const firebaseService = require('./firebase');
const securityService = require('./security');

const referralStructure = {
  level1: 0.1,
  level2: 0.05,
  level3: 0.02,
};

const bonusThresholds = [
  { commissions: 500, bonus: 100 },
  { commissions: 1000, bonus: 250 },
  { commissions: 2000, bonus: 500 },
];

const trackReferral = async (referrerId, referredId, amount) => {
  try {
    await firebaseService.saveAffiliateRelationship(referrerId, referredId);

    const commission = amount * referralStructure.level1;
    const referrer = await firebaseService.getUser(referrerId);

    if (referrer) {
      const newCommissions = (referrer.commissions || 0) + commission;
      await firebaseService.updateUser(referrerId, {
        commissions: newCommissions,
      });

      const eligibleBonus = bonusThresholds.find(
        (t) => newCommissions >= t.commissions
      );

      if (eligibleBonus) {
        await firebaseService.updateUser(referrerId, {
          bonusUnlocked: eligibleBonus.bonus,
        });
      }
    }

    return commission;
  } catch (error) {
    console.error('Error tracking referral:', error);
    return 0;
  }
};

const calculateNetworkStats = async (userId) => {
  const stats = await firebaseService.getAffiliateStats(userId);
  const user = await firebaseService.getUser(userId);

  return {
    affiliateCode: user.affiliateCode,
    directReferrals: stats.referred ? Object.keys(stats.referred).length : 0,
    totalCommissions: user.commissions || 0,
    bonusUnlocked: user.bonusUnlocked || 0,
    progressToBonus: Math.min(
      ((user.commissions || 0) / 500) * 100,
      100
    ),
  };
};

const processWithdrawal = async (userId, amount) => {
  const user = await firebaseService.getUser(userId);

  if (!user || user.commissions < amount) {
    return { success: false, error: 'Insufficient balance' };
  }

  const newBalance = user.commissions - amount;
  await firebaseService.updateUser(userId, {
    commissions: newBalance,
    lastWithdrawal: new Date().toISOString(),
  });

  return {
    success: true,
    newBalance,
    withdrawalId: securityService.generateSecureId(),
  };
};

module.exports = {
  trackReferral,
  calculateNetworkStats,
  processWithdrawal,
  referralStructure,
  bonusThresholds,
};