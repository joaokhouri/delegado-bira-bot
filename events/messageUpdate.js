const { EmbedBuilder } = require('discord.js');

module.exports = {
  // O nome do evento que o discord.js emite quando uma mensagem é atualizada (editada)
  name: 'messageUpdate',

  // A função recebe a 'oldMessage' (a mensagem antes da edição) e a 'newMessage' (a mensagem depois da edição)
  async execute(oldMessage, newMessage, client) {
    // 1. IGNORAR MENSAGENS DE BOTS OU SE O CONTEÚDO FOR O MESMO
    // (O Discord às vezes emite o evento para embeds que carregam, por exemplo)
    if (oldMessage.author?.bot || oldMessage.content === newMessage.content) {
      return;
    }

    // 2. ENCONTRAR O CANAL DE LOGS (usando a mesma variável do .env)
    const channelId = process.env.MOD_LOG_CHANNEL_ID;
    if (!channelId) return;

    const logChannel = oldMessage.guild.channels.cache.get(channelId);
    if (!logChannel) {
      return console.error('[ERRO] O canal de logs não foi encontrado para messageUpdate.');
    }

    // 3. CONSTRUIR O EMBED DO RELATÓRIO DE EDIÇÃO
    const logEmbed = new EmbedBuilder()
      .setColor('#FFFF00') // Amarelo, para indicar uma modificação
      .setTitle('📝 RELATÓRIO DE OCORRÊNCIA')
      .setDescription(`**Uma mensagem foi editada no chat.**`)
      .addFields(
        {
          name: 'Autor da Mensagem',
          value: `${oldMessage.author.tag} (${oldMessage.author.id})`,
          inline: false,
        },
        {
          name: 'Canal',
          value: `${oldMessage.channel.name} (${oldMessage.channel.id})`,
          inline: false,
        },
        {
          name: 'Mensagem Original',
          value: `\`\`\`${
            oldMessage.content.substring(0, 1020) || 'Não foi possível carregar o conteúdo antigo.'
          }\`\`\``,
          inline: false,
        },
        {
          name: 'Mensagem Editada',
          value: `\`\`\`${newMessage.content.substring(0, 1020)}\`\`\``,
          inline: false,
        },
        {
          name: 'Link para a Mensagem',
          value: `[Clique aqui para ir para a mensagem](${newMessage.url})`,
          inline: false,
        }
      )
      .setThumbnail(oldMessage.author.displayAvatarURL())
      .setTimestamp()
      .setFooter({
        text: 'Delegacia do Bira - Setor de Arquivos',
        iconURL: client.user.displayAvatarURL(),
      });

    // 4. ENVIAR O RELATÓRIO PARA O CANAL DE LOGS
    try {
      await logChannel.send({ embeds: [logEmbed] });
    } catch (error) {
      console.error('Erro ao enviar o log de mensagem editada:', error);
    }
  },
};
