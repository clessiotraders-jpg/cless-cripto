const crypto = require('crypto');

const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers[process.env.API_KEY_HEADER?.toLowerCase()];
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key' });
  }
  next();
};

const rateLimitByUserId = new Map();

const userRateLimit = (max = 30, windowMs = 60000) => {
  return (req, res, next) => {
    const userId = req.params.userId || req.body.userId;
    if (!userId) return next();

    const now = Date.now();
    const userRequests = rateLimitByUserId.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < windowMs);

    if (recentRequests.length >= max) {
      return res.status(429).json({ error: 'Rate limit exceeded for this user' });
    }

    recentRequests.push(now);
    rateLimitByUserId.set(userId, recentRequests);
    next();
  };
};

module.exports = {
  verifyApiKey,
  userRateLimit,
};