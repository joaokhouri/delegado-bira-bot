const { EmbedBuilder } = require('discord.js');

module.exports = {
  // O nome do evento que o discord.js emite quando uma mensagem é apagada
  name: 'messageDelete',

  // A função recebe o objeto 'message' que foi apagado
  async execute(message, client) {
    // 1. IGNORAR MENSAGENS DE BOTS OU SEM CONTEÚDO
    // Não queremos logar o bot apagando as próprias mensagens, por exemplo.
    // Também ignoramos se a mensagem não tinha texto (era só uma imagem, por ex.)
    if (message.author?.bot || !message.content) {
      return;
    }

    // 2. ENCONTRAR O CANAL DE LOGS
    const channelId = process.env.MOD_LOG_CHANNEL_ID;
    if (!channelId) return; // Se não estiver configurado, não faz nada

    const logChannel = message.guild.channels.cache.get(channelId);
    if (!logChannel) {
      return console.error('[ERRO] O canal de logs não foi encontrado.');
    }

    // 3. CONSTRUIR O EMBED DO RELATÓRIO
    const logEmbed = new EmbedBuilder()
      .setColor('#FFA500') // Laranja, para um tom de alerta/aviso
      .setTitle('📝 RELATÓRIO DE OCORRÊNCIA')
      .setDescription(`**Uma mensagem foi apagada da comarca.**`)
      .addFields(
        {
          name: 'Autor da Mensagem',
          value: `${message.author.tag} (${message.author.id})`,
          inline: false,
        },
        { name: 'Canal', value: `${message.channel.name} (${message.channel.id})`, inline: false },
        {
          name: 'Conteúdo da Mensagem',
          value: `\`\`\`${message.content.substring(0, 1020)}\`\`\``,
          inline: false,
        }
      )
      .setThumbnail(message.author.displayAvatarURL())
      .setTimestamp()
      .setFooter({
        text: 'Delegacia do Bira - Setor de Arquivos',
        iconURL: client.user.displayAvatarURL(),
      });

    // 4. ENVIAR O RELATÓRIO PARA O CANAL DE LOGS
    try {
      await logChannel.send({ embeds: [logEmbed] });
    } catch (error) {
      console.error('Erro ao enviar o log de mensagem apagada:', error);
    }
  },
};
