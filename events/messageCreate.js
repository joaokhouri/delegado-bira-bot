const { getUser, updateUser } = require('../utils/database.js');
const { Collection, EmbedBuilder, PermissionsBitField } = require('discord.js');
const automodConfig = require('../automodConfig.json');

// ESTA LINHA PROVAVELMENTE ESTAVA FALTANDO
const xpCooldowns = new Collection();

// Função auxiliar para reutilizar o código de punição
async function reportViolation(message, reason, client) {
  const logChannelId = process.env.MOD_LOG_CHANNEL_ID;
  if (!logChannelId) return;

  const logChannel = await message.guild.channels.fetch(logChannelId).catch(() => null);
  if (!logChannel) return;

  // Constrói o Embed de alerta
  const alertEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('🚨 ALERTA DE AUTOMOD 🚨')
    .setDescription(`**Uma mensagem suspeita foi detectada e requer atenção humana.**`)
    .addFields(
      { name: 'Autor', value: `${message.author} (${message.author.tag})`, inline: false },
      { name: 'Canal', value: `${message.channel}`, inline: false },
      { name: 'Motivo do Alerta', value: reason, inline: false },
      {
        name: 'Conteúdo da Mensagem',
        value: `\`\`\`${message.content.substring(0, 1020)}\`\`\``,
        inline: false,
      },
      { name: 'Ação Rápida', value: `[Clique aqui para ir até a mensagem](${message.url})` }
    )
    .setTimestamp()
    .setFooter({ text: 'A decisão de punir ou não cabe a um moderador.' });

  // Constrói os botões de ação para os moderadores
  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`automod-delete-${message.channel.id}-${message.id}`)
      .setLabel('Apagar Mensagem')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🗑️'),
    new ButtonBuilder()
      .setCustomId('automod-ignore')
      .setLabel('Ignorar (Falso Alarme)')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('✅')
  );

  // Envia o alerta mencionando o cargo de moderador
  const modRoleId = process.env.MOD_ROLE_ID;
  const alertContent = modRoleId
    ? `<@&${modRoleId}>, nova ocorrência para análise:`
    : 'Nova ocorrência para análise:';

  await logChannel.send({ content: alertContent, embeds: [alertEmbed], components: [actionRow] });
}

module.exports = {
  name: 'messageCreate',

  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // =======================================================
    // MÓDULO DE AUTOMOD: DETECÇÃO DE LINKS DE CONVITE
    // =======================================================
    try {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        let violationReason = null;
        const lowerCaseMessage = message.content.toLowerCase();

        // 1. Verificações Imediatas (Palavras Proibidas e Links)
        const foundBannedWord = automodConfig.bannedWords.find((word) =>
          lowerCaseMessage.includes(word)
        );
        if (foundBannedWord) {
          violationReason = `A mensagem continha um termo proibido: "${foundBannedWord}".`;
        } else if (/(discord\.(gg|com\/invite)\/[a-zA-Z0-9]+)/.test(message.content)) {
          violationReason = 'A mensagem continha um link de convite para outro servidor.';
        } else if (message.mentions.users.size > automodConfig.maxMentions) {
          violationReason = `A mensagem mencionava ${message.mentions.users.size} usuários (limite: ${automodConfig.maxMentions}).`;
        }

        if (violationReason) {
          await handleViolation(message, violationReason, client);
          return;
        }

        // 2. Verificação de SPAM de CAPS LOCK (com memória)
        const contentWithoutSpaces = message.content.replace(/\s/g, '');
        if (contentWithoutSpaces.length > 10) {
          const caps = contentWithoutSpaces.match(/[A-Z]/g)?.length || 0;
          const capsPercentage = (caps / contentWithoutSpaces.length) * 100;

          if (capsPercentage > automodConfig.maxCapsPercentage) {
            // A mensagem é considerada "CAPS"
            const userData = capsSpamTracker.get(message.author.id) || { count: 0, messages: [] };
            userData.count++;
            userData.messages.push(message);

            // Define um timer. Se o usuário não mandar outra msg em CAPS em 15s, o contador reseta.
            if (userData.timer) clearTimeout(userData.timer);
            userData.timer = setTimeout(() => {
              capsSpamTracker.delete(message.author.id);
            }, 15000); // 15 segundos

            capsSpamTracker.set(message.author.id, userData);

            // Se o contador atingir o limite (5), PUNIÇÃO!
            if (userData.count >= 5) {
              violationReason = 'Envio de 5 ou mais mensagens seguidas em maiúsculas.';

              // Deleta todas as mensagens da sequência
              for (const msg of userData.messages) {
                await msg.delete().catch(() => {}); // O catch evita erros se a msg já foi deletada
              }

              await handleViolation(message, violationReason, client);
              capsSpamTracker.delete(message.author.id); // Limpa o registro do infrator
              return;
            }
          } else {
            // Se a mensagem NÃO for em CAPS, a sequência é quebrada. Limpa o registro.
            capsSpamTracker.delete(message.author.id);
          }
        }
      }
    } catch (error) {
      console.error('[Automod] Erro ao processar mensagem:', error);
    }

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
      'delegado': 'Tô na escuta, meu nobre. Qual é a ocorrência?', //prettier-ignore
      'obrigado bira': 'Tamo junto, campeão. Precisando, é só chamar no rádio.', //prettier-ignore

      // --- Respostas Aleatórias (array de strings) ---
      'boa noite': [
        'Boa noite, rapaziada. Bira iniciando a ronda noturna. Juízo, hein?',
        'Noite. Qualquer coisa, é só chamar no rádio. Câmbio, desligo.',
        'Fechando o expediente por hoje... mentira, tô de olho 24/7. Boa noite!',
      ],
      'e ai bira': ['Opa, firmeza?', 'Na escuta, campeão.', 'Fala, chefe. Tudo tranquilo?'],
      'bom dia': [
        'Bom dia, bom dia! Bora que hoje o serviço tá puxado.',
        'Café na mão e olho no monitor. Bom dia, galera.',
        'Quem acordou, acordou. Quem não acordou, acorda aí! O Bira já tá na ativa.',
        'Bom dia, campeão! Já tô de pé desde as cinco.',
      ],
      salve: [
        'Salve, bigode! Tudo em paz por aí?',
        'Salvado! Mantendo a ordem por aqui.',
        'Salve! Chegou na hora certa pro café da guarita.',
      ],
      roubo: [
        // Perfeito para quando alguém "rouba" uma kill no jogo
        'Opa, opa! Calma aí. Acusação de roubo é séria. Apresente as provas no canal competente.',
        'Registrando a ocorrência de "suposto 171". A corregedoria vai apurar.',
        'Sem tumulto na minha área! Resolvam isso no x1, na moral.',
      ],
      triste: [
        'Calma, campeão. Bota uma música aí pra animar.',
        'Fica assim não, amigão. O patrão já errou jogada pior que essa.',
        'Quer um café? Dizem que ajuda a resolver 90% dos problemas.',
      ],

      // --- Reações com Emoji (objeto) ---
      'amo esse server': { type: 'react', value: '❤️' }, //prettier-ignore
      'kkkk': { type: 'react', value: '😂' }, //prettier-ignore
      'obrigado': { type: 'react', value: '🙏' }, //prettier-ignore
      'parabéns': { type: 'react', value: '🎉' }, //prettier-ignore
      'brabo': { type: 'react', value: '🔥' }, //prettier-ignore
      'f': { type: 'react', value: '😔' }, //prettier-ignore
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
