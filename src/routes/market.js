const express = require('express');
const binanceService = require('../services/binance');

const router = express.Router();

router.get('/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const price = await binanceService.getPrice(symbol);

    if (!price) {
      return res.status(404).json({ error: 'Price not found' });
    }

    res.json({ symbol, price });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/candles/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1h', limit = 100 } = req.query;

    const candles = await binanceService.getCandles(symbol, interval, parseInt(limit));
    res.json({ symbol, interval, candles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/orderbook/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 20 } = req.query;

    const orderBook = await binanceService.getOrderBook(symbol, parseInt(limit));
    res.json({ symbol, orderBook });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/trades/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 50 } = req.query;

    const trades = await binanceService.getRecentTrades(symbol, parseInt(limit));
    res.json({ symbol, trades });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats24h/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const stats = await binanceService.get24hStats(symbol);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;