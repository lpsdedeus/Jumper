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

const POLL_INTERVAL = 37500;    // ~1.6 req/min
const THRESHOLD = 0.007;        // 0.7%
const API_BASE = 'https://li.quest/v1';

// 1) Pega todas as conexões (possíveis rotas de swap)
async function fetchConnections() {
  const res = await axios.get(`${API_BASE}/connections`, {
    headers: process.env.JUMPER_API_KEY
      ? { 'x-lifi-api-key': process.env.JUMPER_API_KEY }
      : {}
  });
  return res.data; // array de { fromChain, toChain, fromTokenAddress, toTokenAddress, ... }
}

// 2) Para cada conexão, pede um quote de 1 unidade de token
async function quoteConnection(conn) {
  const amount = 1e6; // ex: 1 token (6 decimais) — ajuste conforme cada token
  const q = await axios.get(`${API_BASE}/quote`, {
    params: {
      fromChain: conn.fromChain,
      toChain: conn.toChain,
      fromTokenAddress: conn.fromTokenAddress,
      toTokenAddress: conn.toTokenAddress,
      fromAmount: amount
    },
    headers: process.env.JUMPER_API_KEY
      ? { 'x-lifi-api-key': process.env.JUMPER_API_KEY }
      : {}
  });
  return {
    ...conn,
    fromAmount: amount,
    toAmount: q.data.toAmount
  };
}

async function fetchOpportunities() {
  try {
    const conns = await fetchConnections();
    const quotes = await Promise.all(conns.map(quoteConnection));

    const ops = quotes
      .map(q => {
        const rate = q.toAmount / q.fromAmount - 1;
        return {
          pair: `${q.fromTokenAddress}/${q.toTokenAddress}`,
          chainFrom: q.fromChain,
          chainTo: q.toChain,
          rate
        };
      })
      .filter(o => Math.abs(o.rate) >= THRESHOLD)
      .map(o => ({
        ...o,
        diff: (o.rate * 100).toFixed(2) + '%'
      }));

    return ops;
  } catch (err) {
    console.error('Erro ao buscar oportunidades:', err.message);
    return [];
  }
}

// HTTP endpoint de teste
app.get('/api/opportunities', async (req, res) => {
  res.json(await fetchOpportunities());
});

io.on('connection', socket => console.log('Cliente conectado'));

setInterval(async () => {
  io.emit('arbOps', await fetchOpportunities());
}, POLL_INTERVAL);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
