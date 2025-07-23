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

// Poll interval para no máximo 1.6 requisições/minuto (~37.5s)
const POLL_INTERVAL = 37500;
const THRESHOLD = 0.007; // 0.7%
const API_BASE = 'https://api.jumper.exchange/api/v1';

async function fetchPairs() {
  const res = await axios.get(`${API_BASE}/pairs`);
  return res.data; // ajuste conforme resposta real da API
}

async function fetchOpportunities() {
  try {
    const pairs = await fetchPairs();
    const opportunities = [];
    pairs.forEach(pair => {
      const diff = (pair.fairPrice - pair.price) / pair.price;
      if (Math.abs(diff) >= THRESHOLD) {
        opportunities.push({
          pair: `${pair.base}/${pair.quote}`,
          chain: pair.chain,
          price: pair.price,
          fairPrice: pair.fairPrice,
          diff: (diff * 100).toFixed(2) + '%'
        });
      }
    });
    return opportunities;
  } catch (err) {
    console.error('Erro ao buscar oportunidades:', err.message);
    return [];
  }
}

// NOVO ENDPOINT para teste no navegador
app.get('/api/opportunities', async (req, res) => {
  const ops = await fetchOpportunities();
  res.json(ops);
});

io.on('connection', socket => console.log('Cliente conectado'));

// Emit via WebSocket
setInterval(async () => {
  const ops = await fetchOpportunities();
  io.emit('arbOps', ops);
}, POLL_INTERVAL);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
