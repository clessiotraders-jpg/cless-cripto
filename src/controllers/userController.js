const firebaseService = require('../services/firebase');
const securityService = require('../services/security');

const registerUser = async (req, res) => {
  try {
    const { telegramId, email, password } = req.validated;

    const existingUser = await firebaseService.getUser(telegramId);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = securityService.hashPassword(password);

    await firebaseService.createUser(telegramId, {
      email,
      password: hashedPassword,
      affiliateCode: 'STN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      balance: 0,
      commissions: 0,
      createdAt: new Date().toISOString(),
    });

    await firebaseService.saveLog({
      type: 'USER_REGISTERED',
      userId: telegramId,
      email,
    });

    res.status(201).json({
      success: true,
      userId: telegramId,
      message: 'User registered successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await firebaseService.getUser(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    delete user.password;
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    await firebaseService.saveUserPreferences(userId, req.body);
    res.json({ success: true, message: 'Preferences updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deposit = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.validated;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const user = await firebaseService.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newBalance = (user.balance || 0) + amount;
    await firebaseService.updateUser(userId, { balance: newBalance });

    const logId = await firebaseService.saveLog({
      type: 'DEPOSIT',
      userId,
      amount,
      newBalance,
    });

    res.json({
      success: true,
      newBalance,
      transactionId: logId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const withdraw = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.validated;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const user = await firebaseService.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const newBalance = user.balance - amount;
    await firebaseService.updateUser(userId, { balance: newBalance });

    const logId = await firebaseService.saveLog({
      type: 'WITHDRAWAL',
      userId,
      amount,
      newBalance,
    });

    res.json({
      success: true,
      newBalance,
      transactionId: logId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const trackProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const progress = req.body;

    await firebaseService.trackUserProgress(userId, progress);
    res.json({ success: true, message: 'Progress tracked' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerUser,
  getUser,
  updatePreferences,
  deposit,
  withdraw,
  trackProgress,
};