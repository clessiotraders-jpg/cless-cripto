const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const messageHashCache = new Map();
const ipRequestMap = new Map();
const phishingKeywords = [
  'verify account',
  'confirm password',
  'update payment',
  'suspicious activity',
  'click here immediately',
  'reset credentials',
  'urgent action required',
];

const validateRequest = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  req.clientIP = clientIP;
  next();
};

const detectPhishing = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const bodyString = JSON.stringify(req.body).toLowerCase();
    for (const keyword of phishingKeywords) {
      if (bodyString.includes(keyword)) {
        console.warn('Phishing attempt detected:', req.path);
        return res.status(403).json({ error: 'Request blocked' });
      }
    }
  }
  next();
};

const detectFloodAttack = (req, res, next) => {
  const clientIP = req.clientIP;
  const now = Date.now();
  const windowSize = 60000;
  const maxRequests = 30;

  if (!ipRequestMap.has(clientIP)) {
    ipRequestMap.set(clientIP, []);
  }

  const requests = ipRequestMap.get(clientIP);
  const recentRequests = requests.filter((time) => now - time < windowSize);

  if (recentRequests.length >= maxRequests) {
    console.warn(`Flood attack detected from ${clientIP}`);
    return res.status(429).json({ error: 'Too many requests' });
  }

  recentRequests.push(now);
  ipRequestMap.set(clientIP, recentRequests);
  next();
};

const validatePayload = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const payloadString = JSON.stringify(req.body);
    const suspiciousPatterns = [
      /<script/i,
      /eval\(/i,
      /exec\(/i,
      /process\.exit/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(payloadString)) {
        console.warn(`Malicious payload detected on ${req.path}`);
        return res.status(400).json({ error: 'Invalid payload' });
      }
    }
  }
  next();
};

const isDuplicateMessage = (userId, message) => {
  const hash = crypto.createHash('sha256').update(`${userId}${message}`).digest('hex');
  const cacheKey = `msg:${hash}`;

  if (messageHashCache.has(cacheKey)) {
    return true;
  }

  messageHashCache.set(cacheKey, true);
  setTimeout(() => messageHashCache.delete(cacheKey), 3600000);

  return false;
};

const isPhishing = (text) => {
  const lowerText = text.toLowerCase();
  return phishingKeywords.some((keyword) => lowerText.includes(keyword));
};

const validateSignal = (signal) => {
  if (!signal.symbol || !signal.entry || !signal.target || !signal.stopLoss) {
    return false;
  }
  if (signal.entry <= 0 || signal.target <= 0 || signal.stopLoss <= 0) {
    return false;
  }
  return true;
};

const enforceRiskManagement = (position) => {
  const maxRiskPercent = 5;
  const maxLeverage = 10;

  if (position.riskPercent > maxRiskPercent) {
    return { valid: false, error: 'Risk exceeds 5%' };
  }
  if (position.leverage > maxLeverage) {
    return { valid: false, error: 'Leverage exceeds 10x' };
  }
  return { valid: true };
};

const generateSecureId = () => {
  return uuidv4();
};

module.exports = {
  validateRequest,
  detectPhishing,
  detectFloodAttack,
  validatePayload,
  isDuplicateMessage,
  isPhishing,
  validateSignal,
  enforceRiskManagement,
  generateSecureId,
};