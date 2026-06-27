# Cless Cripto

Professional cryptocurrency trading platform for Africa.

## Features

- Real-time market data from Binance
- Telegram bot integration
- Firebase real-time database
- Affiliate program with multi-level tracking
- Advanced security (phishing detection, flood protection, malicious payload filtering)
- Risk management enforcement
- Signal management system

## Installation

```bash
npm install
```

## Configuration

Create `.env` file with Firebase and Telegram credentials.

## Running

```bash
npm start
```

## API Endpoints

### Users
- POST /api/users/register
- GET /api/users/:userId
- PUT /api/users/:userId/preferences
- POST /api/users/:userId/deposit
- POST /api/users/:userId/withdraw

### Market
- GET /api/market/price/:symbol
- GET /api/market/candles/:symbol
- GET /api/market/orderbook/:symbol
- GET /api/market/trades/:symbol
- GET /api/market/stats24h/:symbol

### Signals
- POST /api/signals/create
- GET /api/signals/active

### Affiliates
- POST /api/affiliates/track
- GET /api/affiliates/:userId/stats
- POST /api/affiliates/:userId/withdraw

## Security Features

- Phishing detection
- Flood attack prevention
- Malicious payload filtering
- Duplicate message detection
- Rate limiting
- Risk management enforcement

## Deployment

Deploy to Railway with railway.json config included.