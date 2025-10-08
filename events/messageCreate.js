const { getUser, updateUser } = require('../utils/database.js');
const {
  Collection,
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const automodConfig = require('../automodConfig.json');
const levelRolesConfig = require('../levelRolesConfig.json');

const xpCooldowns = new Collection();
// O "caderninho" do Bira para monitorar spam de CAPS (AGORA DECLARADO)
const capsSpamTracker = new Collection();

// A função que REPORTA a violação para os moderadores
async function reportViolation(message, reason, client) {
  console.log(`[DEBUG] Violação detectada: "${reason}". Iniciando processo de relatório.`); // Log 1

  const logChannelId = process.env.MOD_LOG_CHANNEL_ID;
  if (!logChannelId) {
    console.error(
      '[DEBUG] ERRO: A variável MOD_LOG_CHANNEL_ID não foi encontrada no .env. Processo abortado.'
    ); // Log 2
    return;
  }

  const logChannel = await message.guild.channels.fetch(logChannelId).catch(() => null);
  if (!logChannel) {
    console.error(
      `[DEBUG] ERRO: O canal de logs com o ID (${logChannelId}) não foi encontrado no servidor. Processo abortado.`
    ); // Log 3
    return;
  }

  console.log(`[DEBUG] Canal de logs "${logChannel.name}" encontrado. Construindo o alerta...`); // Log 4

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

  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`automod-delete-${message.channel.id}-${message.id}`)
      .setLabel('Apagar Mensagem')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🗑️'),
    new ButtonBuilder()
      .setCustomId(`automod-ignore-${message.id}`)
      .setLabel('Ignorar (Falso Alarme)')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('✅')
  );

  const modRoleId = process.env.MOD_ROLE_ID;
  const alertContent = modRoleId
    ? `<@&${modRoleId}>, nova ocorrência para análise:`
    : 'Nova ocorrência para análise:';

  await logChannel.send({ content: alertContent, embeds: [alertEmbed], components: [actionRow] });
  console.log('[DEBUG] Alerta enviado com sucesso!'); // Log 5
}

module.exports = {
  name: 'messageCreate',

  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // =======================================================
    // MÓDULO DE AUTOMOD COMPLETO E CORRIGIDO
    // =======================================================
    try {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        let violationReason = null;
        const lowerCaseMessage = message.content.toLowerCase();

        const strictBannedWords = automodConfig.strictBannedWords || [];
        const strictWord = strictBannedWords.find((word) => lowerCaseMessage.includes(word));
        if (strictWord) {
          violationReason = `A mensagem continha um termo estritamente proibido.`;
        }

        if (!violationReason) {
          const contextualBannedWords = automodConfig.contextualBannedWords || [];
          const contextualWord = contextualBannedWords.find((word) =>
            lowerCaseMessage.includes(word)
          );
          if (contextualWord) {
            const contextualTriggers = automodConfig.contextualTriggers || [];
            const isReply = message.reference;
            const hasMention = message.mentions.users.size > 0 || message.mentions.roles.size > 0;
            const hasTriggerWord = contextualTriggers.some((trigger) =>
              lowerCaseMessage.includes(trigger)
            );
            if (isReply || hasMention || hasTriggerWord) {
              violationReason = `A mensagem usou um termo sensível ("${contextualWord}") em um contexto de ofensa direta.`;
            }
          }
        }

        if (violationReason) {
          await reportViolation(message, violationReason, client); // CORRIGIDO PARA reportViolation
          // Não damos 'return' para que a lógica de XP ainda possa rodar se quisermos
        }

        // Lógica de CAPS LOCK que REPORTA em vez de punir
        const contentWithoutSpaces = message.content.replace(/\s/g, '');
        if (contentWithoutSpaces.length > 10) {
          const caps = contentWithoutSpaces.match(/[A-Z]/g)?.length || 0;
          const capsPercentage = (caps / contentWithoutSpaces.length) * 100;

          if (capsPercentage > automodConfig.maxCapsPercentage) {
            const userData = capsSpamTracker.get(message.author.id) || { count: 0 };
            userData.count++;

            if (userData.timer) clearTimeout(userData.timer);
            userData.timer = setTimeout(() => {
              capsSpamTracker.delete(message.author.id);
            }, 15000);

            capsSpamTracker.set(message.author.id, userData);

            if (userData.count >= 5) {
              // Usando seu limite de 5
              violationReason = 'Envio de 5 ou mais mensagens seguidas em maiúsculas.';
              await reportViolation(message, violationReason, client);
              capsSpamTracker.delete(message.author.id);
            }
          } else {
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
      const cooldownAmount = 60000;
      const userId = message.author.id;
      const guildId = message.guild.id;

      if (!xpCooldowns.has(userId)) {
        let user = await getUser(userId, guildId);
        if (!user) {
          user = { userId, guildId, xp: 0, level: 1 };
        }

        const xpGained = Math.floor(Math.random() * 11) + 15;
        user.xp += xpGained;

        const xpToNextLevel = user.level * 300;

        if (user.xp >= xpToNextLevel) {
          user.level++;

          // --- NOVA LÓGICA DE CARGOS POR NÍVEL ---
          const newRoleForLevel = levelRolesConfig[String(user.level)]; // Pega o ID do cargo para o novo nível

          if (newRoleForLevel) {
            try {
              const role = message.guild.roles.cache.get(newRoleForLevel);
              if (role) {
                // Remove todos os outros cargos de nível para evitar acúmulo
                const allLevelRoleIds = Object.values(levelRolesConfig);
                await message.member.roles.remove(allLevelRoleIds).catch(() => {});

                // Adiciona o novo cargo de nível
                await message.member.roles.add(role);

                // Mensagem de parabéns aprimorada
                await message.channel.send(
                  `🎉 **PROMOÇÃO DE PATENTE!** Parabéns, ${message.author}! Você subiu para o **Nível ${user.level}** e recebeu o cargo **${role.name}**!`
                );
              }
            } catch (roleError) {
              console.error(
                `[LevelRoles] Falha ao tentar dar o cargo de nível para ${message.author.tag}:`,
                roleError
              );
            }
          } else {
            // Mensagem de parabéns padrão se não houver cargo para este nível
            await message.channel.send(
              `🎉 **Subiu de nível!** Parabéns, ${message.author}! Você alcançou o **Nível ${user.level}**!`
            );
          }
        }

        await updateUser(userId, guildId, user.xp, user.level);
        xpCooldowns.set(userId, Date.now());
        setTimeout(() => xpCooldowns.delete(userId), cooldownAmount);
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
      //prettier-ignore
      'salve': [
        'Salve, bigode! Tudo em paz por aí?',
        'Salvado! Mantendo a ordem por aqui.',
        'Salve! Chegou na hora certa pro café da guarita.',
      ],
      //prettier-ignore
      'roubo': [
        // Perfeito para quando alguém "rouba" uma kill no jogo
        'Opa, opa! Calma aí. Acusação de roubo é séria. Apresente as provas no canal competente.',
        'Registrando a ocorrência de "suposto 171". A corregedoria vai apurar.',
        'Sem tumulto na minha área! Resolvam isso no x1, na moral.',
      ],
      //prettier-ignore
      'triste': [
        'Calma, campeão. Bota uma música aí pra animar.',
        'Fica assim não, amigão. O patrão já errou jogada pior que essa.',
        'Quer um café? Dizem que ajuda a resolver 90% dos problemas.',
      ],
      //prettier-ignore
      'bira me ajuda': [
        'Opa, qual é a emergência? Se for comando, usa o `/ajuda`. Se for problema, chame um administrador.',
        'Tô aqui pra isso, campeão. Manda a braba.',
        '190 do Bira, qual a ocorrência?',
      ],
      //prettier-ignore
      'esse bot': [
        'Bot? Eu sou concursado, amigão. Respeita a firma.',
        'Tô ouvindo você falar de mim aí...',
      ],

      // --- Reações com Emoji (objeto) ---
      'amo esse server': { type: 'react', value: '❤️' }, //prettier-ignore
      'kkkk': { type: 'react', value: '😂' }, //prettier-ignore
      'obrigado': { type: 'react', value: '🙏' }, //prettier-ignore
      'parabéns': { type: 'react', value: '🎉' }, //prettier-ignore
      'brabo': { type: 'react', value: '🔥' }, //prettier-ignore
      'f': { type: 'react', value: '😔' }, //prettier-ignore
      'top': { type: 'react', value: '👍' }, //prettier-ignore
      'rip': { type: 'react', value: '💀' }, //prettier-ignore
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
