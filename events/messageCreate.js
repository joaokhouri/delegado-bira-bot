module.exports = {
  name: 'messageCreate',

  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // =======================================================
    // LÓGICA DE GANHO DE XP
    // =======================================================
    try {
      const cooldownAmount = 60000; // Cooldown de 60 segundos (em milissegundos)
      const userId = message.author.id;
      const guildId = message.guild.id;

      // Verifica se o usuário está na coleção de cooldowns
      if (!xpCooldowns.has(userId)) {
        // Se não estiver, adiciona XP
        let user = await getUser(userId, guildId);

        // Se o usuário não existir no banco de dados, cria um perfil padrão para ele
        if (!user) {
          user = { userId, guildId, xp: 0, level: 1 };
        }

        // Adiciona uma quantidade aleatória de XP (entre 15 e 25)
        const xpGained = Math.floor(Math.random() * 11) + 15;
        user.xp += xpGained;

        // Calcula o XP necessário para o próximo nível
        const xpToNextLevel = user.level * 300;

        // Verifica se o usuário subiu de nível
        if (user.xp >= xpToNextLevel) {
          user.level++;
          // Opcional: Reseta o XP para o que sobrou após subir de nível
          // user.xp = user.xp - xpToNextLevel;

          // Envia uma mensagem de parabéns no canal
          await message.channel.send(
            `🎉 **Promoção!** Parabéns, ${message.author}! Você foi promovido a **Nível ${user.level}** na hierarquia do Terreiro!`
          );
        }

        // Atualiza as informações do usuário no banco de dados
        await updateUser(userId, guildId, user.xp, user.level);

        // Coloca o usuário no cooldown
        xpCooldowns.set(userId, Date.now());
        setTimeout(() => xpCooldowns.delete(userId), cooldownAmount); // Remove do cooldown após 60 segundos
      }
    } catch (error) {
      console.error('[XP System] Erro ao processar XP para o usuário:', error);
    }

    // =======================================================
    // DICIONÁRIO APRIMORADO DO DELEGADO BIRA
    // Agora ele suporta texto, respostas aleatórias e reações.
    // =======================================================
    const keywordResponses = {
      // --- Respostas de Texto Simples (string) ---
      //prettier-ignore
      'delegado': 'Chamou, meu querido? Estou de plantão. Se precisar de ajuda com os comandos, use `/ajuda`.', //prettier-ignore
      'boa noite': `Boa noite. Patrulha noturna em andamento. Circulando.`, //prettier-ignore

      // --- Respostas Aleatórias (array de strings) ---
      'e ai bira': [
        'Opa, tudo em ordem por aqui.',
        'Na escuta, cidadão.',
        'Fala, chefe. Tudo tranquilo?',
      ],
      'bom dia': [
        'Bom dia campeão!',
        'Um bom dia a todos os cidadãos de bem.',
        'Bom dia! vamos acordar.',
      ],

      // --- Reações com Emoji (objeto) ---
      'amo esse server': { type: 'react', value: '❤️' }, //prettier-ignore
      'kkkk': { type: 'react', value: '😂' }, //prettier-ignore
      'obrigado': { type: 'react', value: '🙏' }, //prettier-ignore
      'parabéns': { type: 'react', value: '🎉' }, //prettier-ignore
    };

    const lowerCaseMessage = message.content.toLowerCase();

    // Loop que verifica cada entrada do nosso dicionário
    for (const keyword in keywordResponses) {
      if (lowerCaseMessage.includes(keyword)) {
        const response = keywordResponses[keyword];

        try {
          // Verificamos o TIPO de resposta que devemos dar
          if (Array.isArray(response)) {
            // Se for um array, pegamos uma resposta aleatória
            const randomIndex = Math.floor(Math.random() * response.length);
            await message.reply(response[randomIndex]);
          } else if (typeof response === 'object' && response.type === 'react') {
            // Se for um objeto do tipo 'react', reagimos com o emoji
            await message.react(response.value);
          } else {
            // Se for qualquer outra coisa (uma string de texto), respondemos normalmente
            await message.reply(response);
          }
        } catch (error) {
          console.error('Erro ao tentar interagir com mensagem:', error);
        }

        return; // Encerra após a primeira correspondência
      }
    }
  },
};
