const { Telegraf } = require('telegraf');
const firebaseService = require('./firebase');
const binanceService = require('./binance');
const securityService = require('./security');

let bot;

const initialize = async () => {
  bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  await bot.telegram.deleteWebhook().catch(() => {});

  bot.start(async (ctx) => {
    try {
      const userId = ctx.from.id.toString();
      let user = await firebaseService.getUser(userId);

      if (!user) {
        await firebaseService.createUser(userId, {
          telegramId: userId,
          username: ctx.from.username || '',
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name || '',
          affiliateCode: generateAffiliateCode(),
          balance: 0,
          commissions: 0,
        });
      }

      await showMainMenu(ctx);
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Erro ao iniciar.');
    }
  });

  bot.action('market', async (ctx) => {
    await ctx.reply('📊 Escolha um ativo:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'BTC/USDT', callback_data: 'price_BTCUSDT' }],
          [{ text: 'ETH/USDT', callback_data: 'price_ETHUSDT' }],
          [{ text: 'BNB/USDT', callback_data: 'price_BNBUSDT' }],
          [{ text: '← Voltar', callback_data: 'menu' }]
        ]
      }
    });
  });

  bot.action(/^price_(.+)$/, async (ctx) => {
    try {
      const symbol = ctx.match[1];

      const data = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
      ).then(r => r.json());

      await ctx.reply(
        `📈 ${symbol}\n\nPreço atual: ${data.price} USDT`
      );
    } catch {
      await ctx.reply('❌ Não foi possível obter o preço.');
    }
  });

  bot.action('account', async (ctx) => {
    const user = await firebaseService.getUser(
      ctx.from.id.toString()
    );

    await ctx.reply(
      `💼 Minha Conta\n\n` +
      `👤 ${user.firstName}\n` +
      `💰 Saldo: ${user.balance || 0} STN\n` +
      `🤝 Comissões: ${user.commissions || 0} STN`
    );
  });

  bot.action('affiliate', async (ctx) => {
    const userId = ctx.from.id.toString();
    const user = await firebaseService.getUser(userId);
    const stats = await firebaseService.getAffiliateStats(userId);

    const referred = stats.referred
      ? Object.keys(stats.referred).length
      : 0;

    await ctx.reply(
      `🤝 Programa de Afiliados\n\n` +
      `Código: ${user.affiliateCode}\n` +
      `Referidos: ${referred}\n` +
      `Comissões: ${user.commissions || 0} STN`
    );
  });

  bot.action('learn', async (ctx) => {
    await ctx.reply(
      `📚 Aprenda\n\n` +
      `• O que é Bitcoin\n` +
      `• O que é Blockchain\n` +
      `• Gestão de risco\n` +
      `• Como investir em cripto`
    );
  });

  bot.action('menu', async (ctx) => {
    await showMainMenu(ctx);
  });

  bot.on('message', async (ctx) => {
    const text = ctx.message.text;
    const userId = ctx.from.id.toString();

    if (securityService.isDuplicateMessage(userId, text)) {
      return ctx.reply('⚠️ Mensagem duplicada.');
    }

    await firebaseService.saveMessage(userId, text);

    ctx.reply(
      'Digite /start para abrir o menu principal.'
    );
  });

  bot.catch((err) => {
    console.error('Telegram Error:', err);
  });

  await bot.launch({
    dropPendingUpdates: true
  });

  console.log('✅ Telegram bot initialized');
};

async function showMainMenu(ctx) {
  await ctx.reply(
    '🚀 Cless Cripto\n\nEscolha uma opção:',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 Mercado', callback_data: 'market' }],
          [{ text: '💼 Minha Conta', callback_data: 'account' }],
          [{ text: '🤝 Afiliados', callback_data: 'affiliate' }],
          [{ text: '📚 Aprenda', callback_data: 'learn' }]
        ]
      }
    }
  );
}

function generateAffiliateCode() {
  return (
    'STN' +
    Math.random().toString(36)
      .substring(2, 10)
      .toUpperCase()
  );
}

module.exports = {
  initialize
};
