const { EmbedBuilder, AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'guildMemberRemove',

  async execute(member, client) {
    const goodbyeChannelId = process.env.GOODBYE_CHANNEL_ID;
    if (!goodbyeChannelId) return;

    const goodbyeChannel = await member.guild.channels.fetch(goodbyeChannelId).catch(() => null);
    if (!goodbyeChannel) return;

    await new Promise((resolve) => setTimeout(resolve, 2000));

    let departureType = 'self'; // Começamos assumindo que a saída foi voluntária
    let moderator = null;
    let auditReason = 'Não especificado';

    try {
      const fetchedLogs = await member.guild.fetchAuditLogs({ limit: 5 });

      const kickLog = fetchedLogs.entries.find(
        (entry) =>
          entry.action === AuditLogEvent.MemberKick &&
          entry.target.id === member.id &&
          Date.now() - entry.createdTimestamp < 5000
      );

      const banLog = fetchedLogs.entries.find(
        (entry) =>
          entry.action === AuditLogEvent.MemberBanAdd &&
          entry.target.id === member.id &&
          Date.now() - entry.createdTimestamp < 5000
      );

      if (banLog) {
        departureType = 'ban';
        moderator = banLog.executor;
        auditReason = banLog.reason || auditReason;
      } else if (kickLog) {
        departureType = 'kick';
        moderator = kickLog.executor;
        auditReason = kickLog.reason || auditReason;
      }
    } catch (error) {
      console.error('[Goodbye] Erro ao tentar buscar o registro de auditoria:', error);
    }

    // =======================================================
    // NOVAS FRASES DO BIRA (PARA CADA TIPO DE SAÍDA)
    // =======================================================
    const responses = {
      self: {
        color: '#FFA500', // Laranja
        title: 'UM CIDADÃO BATEU O SINO',
        status: [
          'Até logo, até mais ver, bon voyage, arrivederci, até mais, adeus, boa viagem, vá em paz, que a porta bata onde o sol não bate, não volte mais aqui, hasta la vista baby, escafeda-se, e saia logo daqui.',
          'Anotado na prancheta: o indivíduo pediu as contas. A guarita sentirá sua falta... ou não.',
          'Menos um pra eu ficar de olho. Bom, o portão tá aberto, né? Passar bem.',
          'Ué, já vai? Nem se despediu do Bira? Fica aí o registro da baixa.',
        ],
      },
      kick: {
        color: '#FF4500', // Laranja-avermelhado
        title: 'BAIXA POR MAU COMPORTAMENTO',
        status: 'Foi **convidado(a) a se retirar** da área.',
      },
      ban: {
        color: '#FF0000', // Vermelho
        title: 'CPF CANCELADO NO TERREIRO',
        status: 'Foi **permanentemente banido(a)**. Esse não volta mais.',
      },
    };

    const responseData = responses[departureType];

    // Sorteia uma frase, se a resposta for uma lista
    const statusText = Array.isArray(responseData.status)
      ? responseData.status[Math.floor(Math.random() * responseData.status.length)]
      : responseData.status;

    const goodbyeEmbed = new EmbedBuilder()
      .setColor(responseData.color)
      .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
      .setTitle(responseData.title)
      .setDescription(`${member.user} não faz mais parte da rapaziada.`)
      .addFields({ name: 'Status', value: statusText })
      .setTimestamp()
      .setFooter({ text: `ID do Usuário: ${member.id}` });

    if (moderator) {
      goodbyeEmbed.addFields(
        { name: 'Ação por', value: `${moderator.tag}` },
        { name: 'Motivo Registrado', value: `*${auditReason}*` }
      );
    }

    await goodbyeChannel.send({ embeds: [goodbyeEmbed] });
  },
};
