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

// Poll interval calculado para no máximo 1.6 requisições/minuto → 60s / 1.6 ≈ 37.5s
const POLL_INTERVAL = 37500; // em milissegundos
const THRESHOLD = 0.007; // 0.7%

// Base URL da API pública da Jumper
const API_BASE = 'https://api.jumper.exchange/api/v1';

async function fetchPairs() {
  const res = await axios.get(`${API_BASE}/pairs`);
  return res.data; // ajustar conforme resposta real da API
}

async function fetchOpportunities() {
  try {
    const pairs = await fetchPairs();
    const opportunities = [];

    for (let pair of pairs) {
      // Exemplo: pair = { base, quote, price, fairPrice }
      const diff = (pair.fairPrice - pair.price) / pair.price;
      if (Math.abs(diff) >= THRESHOLD) {
        opportunities.push({
          pair: `${pair.base}/${pair.quote}`,
          price: pair.price,
          fairPrice: pair.fairPrice,
          diff: (diff * 100).toFixed(2) + '%'
        });
      }
    }

    return opportunities;
  } catch (err) {
    console.error('Erro ao buscar oportunidades:', err.message);
    return [];
  }
}

io.on('connection', (socket) => {
  console.log('Cliente conectado');
  socket.on('disconnect', () => console.log('Cliente desconectado'));
});

// Poll e envia via WebSocket respeitando 1.6 req/min
setInterval(async () => {
  const ops = await fetchOpportunities();
  io.emit('arbOps', ops);
}, POLL_INTERVAL);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
