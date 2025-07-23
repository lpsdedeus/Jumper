# Jumper Arbitrage Monitor

Monitor de oportunidades de arbitragem (>0.7%) em todos os pares contra stablecoins em redes EVM, usando a API da Jumper.exchange.
O monitor faz no máximo **1,6 requisições por minuto** (≈ 37,5 s entre polls) para respeitar limites de rate-limit.

## Setup

1. `git clone https://github.com/seu-usuario/Jumper.git`
2. `cd Jumper`
3. `npm install`
4. **Certifique-se de que o pacote `dotenv` está instalado** (caso contrário, rode `npm install dotenv`).
5. Crie um arquivo `.env` na raiz, com suas variáveis (ex.: `JUMPER_API_KEY=...`).
6. `npm start`

O servidor roda em `http://localhost:3000`. A cada ~37,5 segundos busca oportunidades e envia ao front-end em tempo real.

---

#### package.json
```json
{
  "name": "jumper-arbitrage-monitor",
  "version": "1.0.0",
  "description": "Monitor de oportunidades de arbitragem usando Jumper.exchange API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "axios": "^1.5.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.2",
    "socket.io": "^4.7.1"
  }
}
