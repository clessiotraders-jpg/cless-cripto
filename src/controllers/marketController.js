const binanceService = require('../services/binance');
const firebaseService = require('../services/firebase');

const getPrice = async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol required' });
    }

    const price = await binanceService.getPrice(symbol);

    if (!price) {
      return res.status(404).json({ error: 'Price not available' });
    }

    res.json({
      symbol,
      price,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCandles = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1h', limit = 100 } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol required' });
    }

    const candles = await binanceService.getCandles(
      symbol,
      interval,
      Math.min(parseInt(limit), 500)
    );

    res.json({
      symbol,
      interval,
      count: candles.length,
      candles,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getOrderBook = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 20 } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol required' });
    }

    const orderBook = await binanceService.getOrderBook(
      symbol,
      Math.min(parseInt(limit), 100)
    );

    if (!orderBook) {
      return res.status(404).json({ error: 'Order book not available' });
    }

    res.json({
      symbol,
      bidsCount: orderBook.bids.length,
      asksCount: orderBook.asks.length,
      orderBook,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRecentTrades = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 50 } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol required' });
    }

    const trades = await binanceService.getRecentTrades(
      symbol,
      Math.min(parseInt(limit), 500)
    );

    res.json({
      symbol,
      count: trades.length,
      trades,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const get24hStats = async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol required' });
    }

    const stats = await binanceService.get24hStats(symbol);

    if (!stats) {
      return res.status(404).json({ error: '24h stats not available' });
    }

    res.json({
      ...stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPrice,
  getCandles,
  getOrderBook,
  getRecentTrades,
  get24hStats,
};