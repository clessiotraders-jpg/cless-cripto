const express = require('express');
const firebaseService = require('../services/firebase');
const securityService = require('../services/security');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { telegramId, email, password } = req.body;

    if (!telegramId || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await firebaseService.createUser(telegramId, {
      email,
      password: securityService.hashPassword(password),
      affiliateCode: 'STN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      balance: 0,
      commissions: 0,
    });

    res.json({ success: true, userId: telegramId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:userId', async (req, res) => {
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
});

router.put('/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    await firebaseService.saveUserPreferences(userId, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:userId/deposit', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const user = await firebaseService.getUser(userId);
    const newBalance = (user.balance || 0) + amount;

    await firebaseService.updateUser(userId, { balance: newBalance });
    await firebaseService.saveLog({
      type: 'DEPOSIT',
      userId,
      amount,
      newBalance,
    });

    res.json({ success: true, newBalance });
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

    const user = await firebaseService.getUser(userId);

    if (!user || user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const newBalance = user.balance - amount;
    await firebaseService.updateUser(userId, { balance: newBalance });

    await firebaseService.saveLog({
      type: 'WITHDRAWAL',
      userId,
      amount,
      newBalance,
    });

    res.json({ success: true, newBalance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;