const admin = require('firebase-admin');

let db = null;

// ---------------- INITIALIZE ----------------
const initialize = async () => {
  if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error('FIREBASE_PROJECT_ID não definido nas variáveis de ambiente');
  }

  if (!process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error('FIREBASE_PRIVATE_KEY não definido nas variáveis de ambiente');
  }

  if (!process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error('FIREBASE_CLIENT_EMAIL não definido nas variáveis de ambiente');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    console.log('✅ Firebase inicializado com sucesso');
  }

  db = admin.database();
  return db;
};

// ---------------- USERS ----------------
const getUser = async (userId) => {
  const snapshot = await db.ref(`users/${userId}`).once('value');
  return snapshot.val();
};

const createUser = async (userId, userData) => {
  await db.ref(`users/${userId}`).set({
    ...userData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
};

const updateUser = async (userId, userData) => {
  await db.ref(`users/${userId}`).update({
    ...userData,
    updatedAt: new Date().toISOString(),
  });
};

// ---------------- MESSAGES ----------------
const saveMessage = async (userId, message) => {
  const messageId = db.ref('messages').push().key;

  await db.ref(`messages/${messageId}`).set({
    userId,
    content: message,
    timestamp: Date.now(),
  });

  return messageId;
};

const deleteMessage = async (messageId) => {
  await db.ref(`messages/${messageId}`).remove();
};

// ---------------- SIGNALS ----------------
const saveSignal = async (signal) => {
  const signalId = db.ref('signals').push().key;

  await db.ref(`signals/${signalId}`).set({
    ...signal,
    createdAt: Date.now(),
  });

  return signalId;
};

// ---------------- LOGS / METRICS ----------------
const saveLog = async (logData) => {
  const logId = db.ref('logs').push().key;

  await db.ref(`logs/${logId}`).set({
    ...logData,
    timestamp: Date.now(),
  });

  return logId;
};

const saveMetric = async (metric) => {
  const metricId = db.ref('metrics').push().key;

  await db.ref(`metrics/${metricId}`).set({
    ...metric,
    timestamp: Date.now(),
  });

  return metricId;
};

// ---------------- AFFILIATES ----------------
const saveAffiliateRelationship = async (referrerId, referredId) => {
  await db.ref(`affiliates/${referrerId}/referred/${referredId}`).set({
    userId: referredId,
    addedAt: Date.now(),
  });
};

const getAffiliateStats = async (userId) => {
  const snapshot = await db.ref(`affiliates/${userId}`).once('value');
  return snapshot.val() || {};
};

// ---------------- PREFERENCES ----------------
const getUserPreferences = async (userId) => {
  const snapshot = await db.ref(`preferences/${userId}`).once('value');
  return snapshot.val() || {};
};

const saveUserPreferences = async (userId, preferences) => {
  await db.ref(`preferences/${userId}`).update(preferences);
};

// ---------------- PROGRESS ----------------
const trackUserProgress = async (userId, progress) => {
  await db.ref(`progress/${userId}`).update({
    ...progress,
    updatedAt: Date.now(),
  });
};

// ---------------- TRADING SYSTEM ----------------
const saveTrade = async (userId, tradeData) => {
  const tradeId = db.ref(`trades/${userId}`).push().key;

  await db.ref(`trades/${userId}/${tradeId}`).set({
    ...tradeData,
    timestamp: Date.now(),
  });

  return tradeId;
};

const getUserTrades = async (userId) => {
  const snapshot = await db.ref(`trades/${userId}`).once('value');
  return snapshot.val() || {};
};

// ---------------- LEADERBOARD ----------------
const getTopTraders = async (period = 'day') => {
  const snapshot = await db.ref('trades').once('value');

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const WEEK = 7 * DAY;

  const limit = period === 'week' ? WEEK : DAY;

  const ranking = {};

  snapshot.forEach(userSnap => {
    const userId = userSnap.key;
    const trades = userSnap.val();

    let total = 0;

    Object.values(trades || {}).forEach(trade => {
      if (now - trade.timestamp <= limit) {
        total += trade.profit || 0;
      }
    });

    ranking[userId] = total;
  });

  return Object.entries(ranking)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, profit]) => ({
      userId,
      profit
    }));
};

// ---------------- EXPORT ----------------
module.exports = {
  initialize,
  getUser,
  createUser,
  updateUser,
  saveMessage,
  deleteMessage,
  saveSignal,
  saveLog,
  saveMetric,
  saveAffiliateRelationship,
  getAffiliateStats,
  getUserPreferences,
  saveUserPreferences,
  trackUserProgress,

  // 🔥 TRADING
  saveTrade,
  getUserTrades,
  getTopTraders
};
