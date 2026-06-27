const axios = require('axios');
const WebSocket = require('ws');

const BINANCE_API_URL = 'https://api.binance.com/api/v3';
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';

let wsConnections = new Map();

const initialize = () => {
  console.log('Binance service initialized');
};

const getPrice = async (symbol) => {
  try {
    const response = await axios.get(`${BINANCE_API_URL}/ticker/price`, {
      params: { symbol },
      timeout: 5000,
    });
    return parseFloat(response.data.price);
  } catch (error) {
    console.error('Error fetching price:', error.message);
    return null;
  }
};

const getCandles = async (symbol, interval = '1h', limit = 100) => {
  try {
    const response = await axios.get(`${BINANCE_API_URL}/klines`, {
      params: { symbol, interval, limit },
      timeout: 5000,
    });
    return response.data.map((candle) => ({
      time: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[7]),
    }));
  } catch (error) {
    console.error('Error fetching candles:', error.message);
    return [];
  }
};

const getOrderBook = async (symbol, limit = 20) => {
  try {
    const response = await axios.get(`${BINANCE_API_URL}/depth`, {
      params: { symbol, limit },
      timeout: 5000,
    });
    return {
      bids: response.data.bids.map((b) => [parseFloat(b[0]), parseFloat(b[1])]),
      asks: response.data.asks.map((a) => [parseFloat(a[0]), parseFloat(a[1])]),
    };
  } catch (error) {
    console.error('Error fetching order book:', error.message);
    return null;
  }
};

const getRecentTrades = async (symbol, limit = 50) => {
  try {
    const response = await axios.get(`${BINANCE_API_URL}/trades`, {
      params: { symbol, limit },
      timeout: 5000,
    });
    return response.data.map((trade) => ({
      id: trade.id,
      price: parseFloat(trade.price),
      quantity: parseFloat(trade.qty),
      time: trade.time,
      isBuyerMaker: trade.isBuyerMaker,
    }));
  } catch (error) {
    console.error('Error fetching trades:', error.message);
    return [];
  }
};

const get24hStats = async (symbol) => {
  try {
    const response = await axios.get(`${BINANCE_API_URL}/ticker/24hr`, {
      params: { symbol },
      timeout: 5000,
    });
    return {
      symbol: response.data.symbol,
      priceChange: parseFloat(response.data.priceChange),
      priceChangePercent: parseFloat(response.data.priceChangePercent),
      lastPrice: parseFloat(response.data.lastPrice),
      volume: parseFloat(response.data.volume),
    };
  } catch (error) {
    console.error('Error fetching 24h stats:', error.message);
    return null;
  }
};

module.exports = {
  initialize,
  getPrice,
  getCandles,
  getOrderBook,
  getRecentTrades,
  get24hStats,
};