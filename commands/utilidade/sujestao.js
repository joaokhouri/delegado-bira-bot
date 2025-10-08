const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sugestao')
    .setDescription('Envia uma sugestão anônima para a análise da comunidade.')
    .addStringOption((option) =>
      option.setName('ideia').setDescription('Descreva sua sugestão em detalhes.').setRequired(true)
    ),

  async execute(interaction) {
    // Pega os canais e a sugestão
    const suggestionChannelId = process.env.SUGGESTION_CHANNEL_ID;
    const logChannelId = process.env.MOD_LOG_CHANNEL_ID;
    const suggestionText = interaction.options.getString('ideia');

    if (!suggestionChannelId) {
      return interaction.reply({
        content: 'O canal de sugestões não está configurado. Fale com um administrador.',
        ephemeral: true,
      });
    }

    const suggestionChannel = await interaction.guild.channels
      .fetch(suggestionChannelId)
      .catch(() => null);
    if (!suggestionChannel) {
      return interaction.reply({
        content: 'Não consegui encontrar o canal de sugestões. A configuração pode estar errada.',
        ephemeral: true,
      });
    }

    // 1. CRIA O EMBED PÚBLICO E ANÔNIMO
    const suggestionEmbed = new EmbedBuilder()
      .setColor('#FFFF00') // Amarelo para "nova ideia"
      .setTitle('Nova Sugestão para a Comunidade')
      .setDescription(suggestionText)
      .setTimestamp()
      .setFooter({ text: 'Reaja com 👍 ou 👎 para votar nesta ideia!' });

    try {
      // 2. ENVIA O EMBED NO CANAL PÚBLICO E ADICIONA REAÇÕES
      const suggestionMessage = await suggestionChannel.send({ embeds: [suggestionEmbed] });
      await suggestionMessage.react('👍');
      await suggestionMessage.react('👎');

      // 3. ENVIA O REGISTRO CONFIDENCIAL NO CANAL DE LOGS
      if (logChannelId) {
        const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🕵️‍♂️ Nova Sugestão Registrada')
            .setDescription('Uma nova sugestão anônima foi postada.')
            .addFields(
              { name: 'Autor Original', value: `${interaction.user.tag} (${interaction.user.id})` },
              { name: 'Link para a Sugestão', value: `[Clique aqui](${suggestionMessage.url})` }
            )
            .setTimestamp();
          await logChannel.send({ embeds: [logEmbed] });
        }
      }

      // 4. CONFIRMA PARA O USUÁRIO QUE TUDO DEU CERTO
      await interaction.reply({
        content: 'Sua sugestão foi enviada anonimamente com sucesso!',
        ephemeral: true,
      });
    } catch (error) {
      console.error('Erro ao processar sugestão:', error);
      await interaction.reply({
        content: 'Ocorreu um erro ao tentar enviar sua sugestão.',
        ephemeral: true,
      });
    }
  },
};
