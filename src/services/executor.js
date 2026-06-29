const binanceService = require('./binance');
const firebaseService = require('./firebase');
const signalService = require('./signals');

async function execute(action, data) {
  switch (action) {

    case 'PRICE':
      return await binanceService.getPrice(data);

    case 'SIGNAL':
      return await signalService.generate(data);

    case 'USER':
      return await firebaseService.getUser(data);

    case 'ANALYZE':
      return {
        analysis: "Mercado em consolidação (exemplo)"
      };

    default:
      return null;
  }
}

module.exports = { execute };
