const admin = require('firebase-admin');

let db = null;

const initialize = async () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
  }
  db = admin.database();
  return db;
};

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

const saveMessage = async (userId, message) => {
  const messageId = db.ref('messages').push().key;
  await db.ref(`messages/${messageId}`).set({
    userId,
    content: message,
    timestamp: new Date().toISOString(),
  });
  return messageId;
};

const deleteMessage = async (messageId) => {
  await db.ref(`messages/${messageId}`).remove();
};

const saveSignal = async (signal) => {
  const signalId = db.ref('signals').push().key;
  await db.ref(`signals/${signalId}`).set({
    ...signal,
    createdAt: new Date().toISOString(),
  });
  return signalId;
};

const saveLog = async (logData) => {
  const logId = db.ref('logs').push().key;
  await db.ref(`logs/${logId}`).set({
    ...logData,
    timestamp: new Date().toISOString(),
  });
  return logId;
};

const saveMetric = async (metric) => {
  const metricId = db.ref('metrics').push().key;
  await db.ref(`metrics/${metricId}`).set({
    ...metric,
    timestamp: new Date().toISOString(),
  });
  return metricId;
};

const saveAffiliateRelationship = async (referrerId, referredId) => {
  await db.ref(`affiliates/${referrerId}/referred/${referredId}`).set({
    userId: referredId,
    addedAt: new Date().toISOString(),
  });
};

const getAffiliateStats = async (userId) => {
  const snapshot = await db.ref(`affiliates/${userId}`).once('value');
  return snapshot.val() || {};
};

const getUserPreferences = async (userId) => {
  const snapshot = await db.ref(`preferences/${userId}`).once('value');
  return snapshot.val() || {};
};

const saveUserPreferences = async (userId, preferences) => {
  await db.ref(`preferences/${userId}`).update(preferences);
};

const trackUserProgress = async (userId, progress) => {
  await db.ref(`progress/${userId}`).update({
    ...progress,
    updatedAt: new Date().toISOString(),
  });
};

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
};