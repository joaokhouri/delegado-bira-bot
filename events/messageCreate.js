const { getUser, updateUser } = require('../utils/database.js');
const { Collection, EmbedBuilder, PermissionsBitField } = require('discord.js');

// ESTA LINHA PROVAVELMENTE ESTAVA FALTANDO
const xpCooldowns = new Collection();

module.exports = {
  name: 'messageCreate',

  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // =======================================================
    // MÓDULO DE AUTOMOD: DETECÇÃO DE LINKS DE CONVITE
    // =======================================================
    try {
      // Verifica se o autor da mensagem NÃO é um administrador ou moderador
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        const inviteLinkRegex = /(discord\.(gg|com\/invite)\/[a-zA-Z0-9]+)/;
        if (inviteLinkRegex.test(message.content)) {
          // 1. Deleta a mensagem com o link
          await message.delete();

          // 2. Avisa o infrator no privado (DM)
          const dmEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🚨 Mensagem Apagada Automaticamente')
            .setDescription(`Olá! Sou o Bira, o guarda aqui do **${message.guild.name}**.`)
            .addFields({
              name: 'Motivo',
              value:
                'Sua mensagem foi removida por conter um link de convite para outro servidor, o que não é permitido pelas nossas regras.',
            });

          try {
            await message.author.send({ embeds: [dmEmbed] });
          } catch (dmError) {
            console.log(
              `[Automod] Não foi possível enviar DM para ${message.author.tag}. (Provavelmente DMs fechadas)`
            );
          }

          // 3. Registra a ocorrência no canal de logs
          const logChannelId = process.env.MOD_LOG_CHANNEL_ID;
          if (logChannelId) {
            const logChannel = await message.guild.channels.fetch(logChannelId);
            if (logChannel) {
              const logEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('📝 RELATÓRIO DE AUTOMOD')
                .setDescription('**Link de convite detectado e removido.**')
                .addFields(
                  {
                    name: 'Autor',
                    value: `${message.author.tag} (${message.author.id})`,
                    inline: false,
                  },
                  { name: 'Canal', value: `${message.channel.name}`, inline: false },
                  {
                    name: 'Conteúdo Removido',
                    value: `\`\`\`${message.content.substring(0, 1020)}\`\`\``,
                    inline: false,
                  }
                )
                .setTimestamp();
              await logChannel.send({ embeds: [logEmbed] });
            }
          }

          // Encerra a execução para esta mensagem, pois ela já foi tratada
          return;
        }
      }
    } catch (error) {
      console.error('[Automod] Erro ao verificar links de convite:', error);
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
