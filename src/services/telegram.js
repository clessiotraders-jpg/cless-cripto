const { Telegraf } = require('telegraf');
const firebaseService = require('./firebase');
const binanceService = require('./binance');
const securityService = require('./security');

let bot;

const initialize = async () => {
  bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  await bot.telegram.deleteWebhook().catch(() => {});

  // ---------------- START ----------------
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

  // ---------------- MARKET ----------------
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

  // ---------------- PRICE ----------------
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

  // ---------------- ACCOUNT ----------------
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

  // ---------------- AFFILIATE ----------------
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

  // ---------------- LEARN ----------------
  bot.action('learn', async (ctx) => {
    await ctx.reply(
      `📚 Aprenda\n\n` +
      `• O que é Bitcoin\n` +
      `• O que é Blockchain\n` +
      `• Gestão de risco\n` +
      `• Como investir em cripto`
    );
  });

  // ---------------- MENU ----------------
  bot.action('menu', async (ctx) => {
    await showMainMenu(ctx);
  });

  // ---------------- MESSAGE HANDLER (CÉREBRO LIMPO) ----------------
  bot.on('message', async (ctx) => {
    const text = ctx.message?.text;
    const userId = ctx.from.id.toString();

    if (!text) return;

    try {
      // salva histórico
      await firebaseService.saveMessage(userId, text);

      // 🔥 DETECTA DUPLICADO
      const isDuplicate = securityService.isDuplicateMessage(userId, text);

      if (isDuplicate) {
        // 🧹 apaga no grupo sem aviso
        if (ctx.chat.type !== 'private') {
          try {
            await ctx.deleteMessage();
          } catch (err) {
            console.log('Não consegui apagar mensagem:', err.message);
          }
        }
        return;
      }

      // 🤖 FUTURO: IA entra aqui
      // const reply = await askAI(text, userId)
      // return ctx.reply(reply)

      return;

    } catch (err) {
      console.error('Message handler error:', err);
    }
  });

  bot.catch((err) => {
    console.error('Telegram Error:', err);
  });

  await bot.launch({
    dropPendingUpdates: true
  });

  console.log('✅ Telegram bot initialized');
};

// ---------------- MAIN MENU ----------------
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

// ---------------- AFFILIATE CODE ----------------
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
