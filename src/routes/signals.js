const express = require('express');
const firebaseService = require('../services/firebase');
const securityService = require('../services/security');
const binanceService = require('../services/binance');

const router = express.Router();
const sentSignals = new Set();

router.post('/create', async (req, res) => {
  try {
    const { symbol, entry, target, stopLoss, leverage, type, reason } = req.body;

    if (!securityService.validateSignal({ symbol, entry, target, stopLoss })) {
      return res.status(400).json({ error: 'Invalid signal' });
    }

    const riskPercent = ((stopLoss - entry) / entry) * 100;
    const riskCheck = securityService.enforceRiskManagement({
      riskPercent: Math.abs(riskPercent),
      leverage: leverage || 1,
    });

    if (!riskCheck.valid) {
      return res.status(400).json({ error: riskCheck.error });
    }

    const price = await binanceService.getPrice(symbol);
    if (!price) {
      return res.status(400).json({ error: 'Cannot verify market data' });
    }

    const signalId = securityService.generateSecureId();
    const signalKey = `${symbol}:${entry}:${target}:${stopLoss}`;

    if (sentSignals.has(signalKey)) {
      return res.status(400).json({ error: 'Duplicate signal' });
    }

    const signal = {
      id: signalId,
      symbol,
      entry,
      target,
      stopLoss,
      leverage: leverage || 1,
      type: type || 'LONG',
      reason,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    await firebaseService.saveSignal(signal);
    sentSignals.add(signalKey);

    setTimeout(() => sentSignals.delete(signalKey), 86400000);

    res.json({ success: true, signalId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/active', async (req, res) => {
  try {
    res.json({ success: true, signals: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;