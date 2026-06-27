const express = require('express');
const firebaseService = require('../services/firebase');
const affiliateService = require('../services/affiliate');

const router = express.Router();

router.post('/track', async (req, res) => {
  try {
    const { referrerId, referredId, amount } = req.body;

    if (!referrerId || !referredId || !amount) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const commission = await affiliateService.trackReferral(
      referrerId,
      referredId,
      amount
    );

    res.json({ success: true, commission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await affiliateService.calculateNetworkStats(userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:userId/withdraw', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const result = await affiliateService.processWithdrawal(userId, amount);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    await firebaseService.saveLog({
      type: 'AFFILIATE_WITHDRAWAL',
      userId,
      amount,
      withdrawalId: result.withdrawalId,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;