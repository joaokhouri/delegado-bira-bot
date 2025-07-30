const { EmbedBuilder, AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'messageDeleteBulk',

  async execute(messages, channel, client) {
    // Encontra o canal de logs...
    const logChannelId = process.env.MOD_LOG_CHANNEL_ID;
    if (!logChannelId) return;
    const logChannel = channel.guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    let executor = 'Não identificado';
    try {
      // ===== A MUDANÇA ESTÁ AQUI =====
      // Damos um pequeno "respiro" de 1 segundo (1000ms) para o Discord registrar o log
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Agora buscamos o log, que já deve estar registrado
      const fetchedLogs = await channel.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MessageBulkDelete,
      });
      const deleteLog = fetchedLogs.entries.first();

      if (deleteLog) {
        const { executor: logExecutor } = deleteLog;
        // Aumentamos a janela de tempo para 10 segundos para sermos mais flexíveis
        if (Date.now() - deleteLog.createdTimestamp < 10000) {
          executor = logExecutor.tag;
        }
      }
    } catch (error) {
      console.error('Erro ao buscar o log de auditoria para messageDeleteBulk:', error);
    }

    // Constrói o Embed...
    const logEmbed = new EmbedBuilder()
      .setColor('#FF4500')
      .setTitle('📝 RELATÓRIO DE FAXINA GERAL')
      .setDescription(`**Uma exclusão de mensagens em massa foi executada.**`)
      .addFields(
        { name: 'Canal da Ocorrência', value: `${channel.name}`, inline: false },
        { name: 'Quantidade de Mensagens', value: `${messages.size}`, inline: false },
        { name: 'Ação executada por', value: executor, inline: false }
      )
      .setTimestamp()
      .setFooter({
        text: 'Delegacia do Bira - Setor de Arquivos',
        iconURL: client.user.displayAvatarURL(),
      });

    // Envia o relatório...
    await logChannel.send({ embeds: [logEmbed] });
  },
};
