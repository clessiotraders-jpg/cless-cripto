const firebaseService = require('../services/firebase');
const affiliateService = require('../services/affiliate');

const trackReferral = async (req, res) => {
  try {
    const { referrerId, referredId, amount } = req.body;

    if (!referrerId || !referredId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const commission = await affiliateService.trackReferral(
      referrerId,
      referredId,
      amount
    );

    await firebaseService.saveLog({
      type: 'REFERRAL_TRACKED',
      referrerId,
      referredId,
      amount,
      commission,
    });

    res.json({
      success: true,
      commission,
      message: 'Referral tracked successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await firebaseService.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = await affiliateService.calculateNetworkStats(userId);

    res.json({
      ...stats,
      bonusTarget: 500,
      maxLevels: 3,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const processWithdrawal = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.validated;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
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
      newBalance: result.newBalance,
    });

    res.json({
      success: true,
      message: 'Withdrawal processed',
      ...result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  trackReferral,
  getStats,
  processWithdrawal,
};