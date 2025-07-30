module.exports = {
  name: 'messageCreate',

  async execute(message, client) {
    // As verificações de segurança continuam as mesmas
    if (message.author.bot) return;
    if (!message.guild) return;

    // =======================================================
    // 1. O DICIONÁRIO DO DELEGADO
    // Adicione novas palavras e respostas aqui!
    // A "chave" é a palavra a ser procurada (em minúsculas).
    // O "valor" é a resposta que o bot vai dar.
    // =======================================================
    const keywordResponses = {
      // prettier-ignore
      'delegado': 'Chamou, cidadão? Estou de plantão. Se precisar de ajuda com os comandos, use `/ajuda`.',
      'bom dia': `Bom dia! Mantenha a ordem na comarca e o respeito aos seus concidadãos.`,
      'boa noite': `Boa noite. Patrulha noturna em andamento. Descansem, cidadãos de bem.`,
      'obrigado bira': `De nada, cidadão. É meu dever servir e proteger esta comunidade.`,
      // prettier-ignore
      'servidor': 'Para informações oficiais sobre esta comarca, use o comando `/serverinfo`.', // <-- NOVA LINHA
    };

    // =======================================================
    // 2. A PATRULHA (A LÓGICA DE VERIFICAÇÃO)
    // =======================================================

    // Pega o conteúdo da mensagem e converte para minúsculas uma única vez
    const lowerCaseMessage = message.content.toLowerCase();

    // Loop que verifica cada entrada do nosso dicionário
    for (const keyword in keywordResponses) {
      // Verifica se a mensagem INCLUI a palavra-chave
      if (lowerCaseMessage.includes(keyword)) {
        // Se encontrar, envia a resposta correspondente
        try {
          await message.reply(keywordResponses[keyword]);
        } catch (error) {
          console.error('Erro ao tentar responder a uma palavra-chave:', error);
        }

        // IMPORTANTE: Encerra a execução para não responder a múltiplas palavras na mesma mensagem
        return;
      }
    }
  },
};
