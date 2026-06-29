async function decideAction(input) {
  const res = await ai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
És um TRADING AI AGENT.

Tens acesso a:
- preços de mercado
- sinais
- utilizadores
- carteira

Tua função:
1. analisar intenção
2. decidir ação financeira ou informativa
3. nunca executar trades diretamente (apenas sugerir)

Responde:

ACTION: PRICE | SIGNAL | ANALYZE | USER | NONE
DATA: payload
MESSAGE: resposta humana
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
