const axios = require('axios');

const OPENAI_API_URL = 'https://api.openai.com/v1';

const askOpenAI = async (message) => {
  try {
    const response = await axios.post(`${OPENAI_API_URL}/chat/completions`, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente especializado em criptomoedas e trading. Seja breve, direto e educativo.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI error:', error.message);
    return null;
  }
};

const explainConcept = async (concept) => {
  const message = `Explique brevemente (em 2-3 frases) o conceito de ${concept} no contexto de criptomoedas e trading.`;
  return askOpenAI(message);
};

const analyzeMarket = async (symbol, priceData) => {
  const message = `Baseado nos dados: ${JSON.stringify(priceData)}, qual é sua análise breve para ${symbol}? Considere apenas análise técnica.`;
  return askOpenAI(message);
};

const motivationalMessage = async () => {
  const message = 'Dê uma mensagem breve e motivacional para um trader que quer aprender sobre criptomoedas com disciplina e gestão de risco.';
  return askOpenAI(message);
};

const answerQuestion = async (question) => {
  return askOpenAI(question);
};

module.exports = {
  askOpenAI,
  explainConcept,
  analyzeMarket,
  motivationalMessage,
  answerQuestion,
};
