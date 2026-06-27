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

const app = express();
const PORT = process.env.PORT || 3000;

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

firebaseService.initialize();
telegramService.initialize();
binanceService.initialize();

app.use('/api/users', userRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/market', marketRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`Cless Cripto running on port ${PORT}`);
});