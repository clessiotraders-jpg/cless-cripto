const { Telegraf } = require('telegraf');
const firebaseService = require('./firebase');
const securityService = require('./security');

let bot = null;
const messageCache = new Map();

const initialize = () => {
  bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    const user = await firebaseService.getUser(userId);

    if (!user) {
      await firebaseService.createUser(userId, {
        telegramId: userId,
        username: ctx.from.username || 'User',
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        affiliateCode: generateAffiliateCode(),
        balance: 0,
        commissions: 0,
      });
    }

    ctx.reply(
      '🚀 Bem-vindo à Cless Cripto!\n\nEscolha uma opção:',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 Market Data', callback_data: 'market' }],
            [{ text: '🤝 Afiliados', callback_data: 'affiliate' }],
            [{ text: '💼 Minha Conta', callback_data: 'account' }],
            [{ text: '📚 Aprenda', callback_data: 'learn' }],
          ],
        },
      }
    );
  });

  bot.action('market', async (ctx) => {
    await ctx.reply('Escolha um ativo:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'BTC/USDT', callback_data: 'price_BTCUSDT' }],
          [{ text: 'ETH/USDT', callback_data: 'price_ETHUSDT' }],
          [{ text: 'BNB/USDT', callback_data: 'price_BNBUSDT' }],
        ],
      },
    });
  });

  bot.action('affiliate', async (ctx) => {
    const userId = ctx.from.id.toString();
    const stats = await firebaseService.getAffiliateStats(userId);
    const user = await firebaseService.getUser(userId);

    const referred = stats.referred ? Object.keys(stats.referred).length : 0;
    const commissions = user.commissions || 0;

    await ctx.reply(
      `🤝 Seu Programa de Afiliados:\n\nCódigo: ${user.affiliateCode}\nReferências: ${referred}\nComissões: ${commissions} STN\nMeta: 500 STN\nProgresso: ${((commissions / 500) * 100).toFixed(0)}%`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Compartilhar', callback_data: 'share_affiliate' }],
            [{ text: '← Voltar', callback_data: 'start' }],
          ],
        },
      }
    );
  });

  bot.on('message', async (ctx) => {
    const userId = ctx.from.id.toString();
    const messageText = ctx.message.text;

    if (securityService.isDuplicateMessage(userId, messageText)) {
      await ctx.reply('⚠️ Mensagem duplicada ignorada');
      return;
    }

    if (securityService.isPhishing(messageText)) {
      await firebaseService.saveLog({
        type: 'PHISHING_ATTEMPT',
        userId,
        content: messageText,
        severity: 'HIGH',
      });
      await ctx.reply('🚨 Potencial phishing detectado');
      return;
    }

    await firebaseService.saveMessage(userId, messageText);
    ctx.reply('✅ Mensagem recebida');
  });

  bot.launch();
  console.log('Telegram bot initialized');
};

const sendMessage = async (chatId, text, options = {}) => {
  try {
    await bot.telegram.sendMessage(chatId, text, options);
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

const generateAffiliateCode = () => {
  return 'STN' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

module.exports = {
  initialize,
  sendMessage,
};