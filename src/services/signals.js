async function generate(symbol) {
  // aqui pode ser IA ou lógica técnica
  return {
    symbol,
    action: "BUY",
    confidence: 0.72,
    reason: "Tendência de alta detectada (exemplo)",
    timestamp: Date.now()
  };
}

module.exports = { generate };
