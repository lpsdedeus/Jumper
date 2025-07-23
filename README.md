Monitor de oportunidades de arbitragem (>0.7%) em todos os pares contra stablecoins em redes EVM, usando a API da Jumper.exchange.
O monitor faz no máximo **1,6 requisições por minuto** (≈ 37,5 s entre polls) para respeitar limites de rate-limit.

## Setup

1. `git clone https://github.com/seu-usuario/Jumper.git`
2. `cd Jumper`
3. `npm install`
4. Crie um arquivo `.env` (se necessário) para variáveis de ambiente.
5. `npm start`

O servidor roda em `http://localhost:3000`. A cada ~37,5 segundos busca oportunidades e envia ao front-end em tempo real.

## Deploy

- Repositório: `github.com/seu-usuario/Jumper`
- Deploy automático no Render: selecione o branch `main`, a build command `npm install` e start command `npm start`.
