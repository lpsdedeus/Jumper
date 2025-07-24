const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.static('public'));

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

// ~1.6 req/min ⇒ 37.5s
const POLL_INTERVAL = 37500;
const THRESHOLD = 0.007;  // 0.7%
const API_BASE = 'https://li.quest/v1';

async function fetchConnections() {
  const res = await axios.get(`${API_BASE}/connections`, {
    params: { allowBridges: ['all'], allowExchanges: ['all'] },
    headers: process.env.JUMPER_API_KEY
      ? { 'x-lifi-api-key': process.env.JUMPER_API_KEY }
      : {}
  });
  // LI.FI retorna um objeto com 'connections' ou um array direto
  const data = res.data.connections || res.data;
  return Array.isArray(data) ? data : [];
}

async function quoteConnection(conn) {
  // Ajuste o amount conforme os decimais do token (ex.: 1e18 para ERC-20)
  const amount = 1e18;
  const res = await axios.get(`${API_BASE}/quote`, {
    params: {
      fromChain:        conn.fromChain,
      toChain:          conn.toChain,
      fromTokenAddress: conn.fromTokenAddress,
      toTokenAddress:   conn.toTokenAddress,
      fromAmount:       amount
    },
    headers: process.env.JUMPER_API_KEY
      ? { 'x-lifi-api-key': process.env.JUMPER_API_KEY }
      : {}
  });
  return { ...conn, fromAmount: amount, toAmount: res.data.toAmount };
}

async function fetchOpportunities() {
  try {
    const conns  = await fetchConnections();
    const quotes = await Promise.all(conns.map(quoteConnection));

    return quotes
      .map(q => {
        const rate = q.toAmount / q.fromAmount - 1;
        return {
          pair:      `${q.fromTokenAddress}/${q.toTokenAddress}`,
          chainFrom: q.fromChain,
          chainTo:   q.toChain,
          diff:      (rate * 100).toFixed(2) + '%',
          rate
        };
      })
      .filter(o => Math.abs(o.rate) >= THRESHOLD);
  } catch (err) {
    if (err.response) {
      console.error(
        `Erro ${err.response.status} da LI.FI:`,
        JSON.stringify(err.response.data)
      );
    } else {
      console.error('Erro ao buscar oportunidades:', err.message);
    }
    return [];
  }
}

// Suporta rotas /opportunities e /api/opportunities
app.get(['/opportunities', '/api/opportunities'], async (_, res) => {
  const ops = await fetchOpportunities();
  if (!ops || ops.length === 0) {
    return res.json({ message: 'Nenhuma oportunidade encontrada' });
  }
  res.json(ops);
});

io.on('connection', () => console.log('Cliente conectado'));

setInterval(async () => {
  io.emit('arbOps', await fetchOpportunities());
}, POLL_INTERVAL);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
