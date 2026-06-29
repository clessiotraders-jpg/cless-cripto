require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const firebaseService = require('./services/firebase');
const telegramService = require('./services/telegram');
const securityService = require('./services/security');
const binanceService = require('./services/binance');
const affiliateService = require('./services/affiliate');

const userRoutes = require('./routes/users');
const signalRoutes = require('./routes/signals');
const affiliateRoutes = require('./routes/affiliates');
const marketRoutes = require('./routes/market');

// 🔥 IA CORE (NOVO)
const aiService = require('./services/ai');
const executor = require('./services/executor');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------- SECURITY ----------------
app.use(helmet());
app.use(cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.use(securityService.validateRequest);
app.use(securityService.detectPhishing);
app.use(securityService.detectFloodAttack);
app.use(securityService.validatePayload);

// ---------------- INIT SERVICES ----------------
firebaseService.initialize();
telegramService.initialize();
binanceService.initialize();

// ---------------- ROUTES ----------------
app.use('/api/users', userRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/market', marketRoutes);

// ---------------- HEALTH ----------------
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------- 🤖 IA ENDPOINT (NOVO CÉREBRO) ----------------
app.post('/api/ai/act', async (req, res) => {
  try {
    const input = req.body;

    // 🔥 IA decide o que fazer
    const decision = await aiService.decideAction(input);

    const action = decision.match(/ACTION:\s*(.*)/)?.[1]?.trim();
    const data = decision.match(/DATA:\s*(.*)/)?.[1]?.trim();
    const message = decision.match(/MESSAGE:\s*(.*)/)?.[1]?.trim();

    // ⚡ executa ação real
    const result = await executor.execute(action, data);

    return res.json({
      ok: true,
      message,
      action,
      result
    });

  } catch (err) {
    console.error('AI ERROR:', err);
    return res.status(500).json({
      error: 'AI system failed'
    });
  }
});

// ---------------- 404 ----------------
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ---------------- ERROR HANDLER ----------------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log(`Cless Cripto running on port ${PORT}`);
});
