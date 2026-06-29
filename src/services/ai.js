const OpenAI = require('openai');

const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function decideAction(input) {
  const res = await ai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
És o cérebro central de um sistema de trading cripto.

Tens acesso a:
- USERS
- MARKET DATA
- AFFILIATES
- SIGNALS

Responde SEMPRE neste formato:

ACTION: TELEGRAM | PRICE | SIGNAL | USER | AFFILIATE | NONE
DATA: texto ou json necessário
MESSAGE: resposta para o utilizador

Exemplo:
ACTION: PRICE
DATA: BTCUSDT
MESSAGE: Vou buscar o preço do Bitcoin agora
`
      },
      {
        role: "user",
        content: JSON.stringify(input)
      }
    ]
  });

  return res.choices[0].message.content;
}

module.exports = { decideAction };
