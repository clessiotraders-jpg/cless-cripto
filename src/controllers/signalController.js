const firebaseService = require('../services/firebase');
const securityService = require('../services/security');
const binanceService = require('../services/binance');

const sentSignals = new Map();

const createSignal = async (req, res) => {
  try {
    const { symbol, entry, target, stopLoss, leverage = 1, type = 'LONG', reason } = req.validated;

    if (!securityService.validateSignal({ symbol, entry, target, stopLoss })) {
      return res.status(400).json({ error: 'Invalid signal parameters' });
    }

    const riskPercent = Math.abs((stopLoss - entry) / entry) * 100;
    const riskCheck = securityService.enforceRiskManagement({
      riskPercent,
      leverage,
    });

    if (!riskCheck.valid) {
      return res.status(400).json({ error: riskCheck.error });
    }

    const price = await binanceService.getPrice(symbol);
    if (!price) {
      return res.status(400).json({ error: 'Cannot verify market data for this symbol' });
    }

    const signalKey = `${symbol}:${entry}:${target}:${stopLoss}`;
    if (sentSignals.has(signalKey)) {
      return res.status(400).json({ error: 'Duplicate signal detected' });
    }

    const signalId = securityService.generateSecureId();
    const signal = {
      id: signalId,
      symbol,
      entry,
      target,
      stopLoss,
      leverage,
      type,
      reason,
      status: 'ACTIVE',
      currentPrice: price,
      createdAt: new Date().toISOString(),
    };

    await firebaseService.saveSignal(signal);
    sentSignals.set(signalKey, true);

    setTimeout(() => sentSignals.delete(signalKey), 86400000);

    await firebaseService.saveLog({
      type: 'SIGNAL_CREATED',
      signalId,
      symbol,
      entry,
    });

    await firebaseService.saveMetric({
      type: 'SIGNAL',
      symbol,
      leverage,
      risk: riskPercent,
    });

    res.status(201).json({
      success: true,
      signalId,
      signal,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const closeSignal = async (req, res) => {
  try {
    const { signalId } = req.params;
    const { exitPrice, reason } = req.body;

    if (!exitPrice) {
      return res.status(400).json({ error: 'Exit price required' });
    }

    await firebaseService.saveLog({
      type: 'SIGNAL_CLOSED',
      signalId,
      exitPrice,
      reason,
    });

    res.json({
      success: true,
      message: 'Signal closed',
      signalId,
      exitPrice,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createSignal,
  closeSignal,
};