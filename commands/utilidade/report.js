const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Envia uma denúncia confidencial para a equipe de moderação.')
    .addUserOption((option) =>
      option
        .setName('usuário')
        .setDescription('O membro que você está denunciando.')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('motivo')
        .setDescription('Descreva o motivo da denúncia. Seja claro e objetivo.')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('prova')
        .setDescription('Opcional: Cole aqui o link de uma mensagem específica como prova.')
        .setRequired(false)
    ),

  async execute(interaction) {
    // Pega as informações da denúncia
    const targetUser = interaction.options.getUser('usuário');
    const reason = interaction.options.getString('motivo');
    const proofLink = interaction.options.getString('prova');
    const reporter = interaction.user;

    const logChannelId = process.env.MOD_LOG_CHANNEL_ID;
    if (!logChannelId) {
      return interaction.reply({
        content:
          'O sistema de denúncias está temporariamente fora de serviço. Fale com um administrador.',
        ephemeral: true,
      });
    }

    const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
    if (!logChannel) {
      return interaction.reply({
        content: 'Não consegui encontrar o canal de denúncias. A configuração pode estar errada.',
        ephemeral: true,
      });
    }

    // Monta o Embed confidencial para a moderação
    const reportEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🚨 NOVA DENÚNCIA REGISTRADA 🚨')
      .setAuthor({ name: `Denunciante: ${reporter.tag}`, iconURL: reporter.displayAvatarURL() })
      .addFields(
        { name: 'Acusado', value: `${targetUser.tag} (${targetUser.id})` },
        { name: 'Motivo da Denúncia', value: `\`\`\`${reason}\`\`\`` }
      )
      .setTimestamp()
      .setFooter({ text: 'Por favor, investiguem a ocorrência.' });

    // Se o usuário forneceu um link de prova, adiciona ao relatório
    if (proofLink) {
      reportEmbed.addFields({
        name: 'Link de Prova',
        value: `[Clique aqui para ver](${proofLink})`,
      });
    }

    try {
      // Envia o alerta no canal de logs, mencionando o cargo de moderador
      const modRoleId = process.env.MOD_ROLE_ID;
      const alertContent = modRoleId
        ? `<@&${modRoleId}>, nova denúncia recebida:`
        : 'Nova denúncia recebida:';

      await logChannel.send({ content: alertContent, embeds: [reportEmbed] });

      // Confirma para o denunciante que a denúncia foi enviada
      await interaction.reply({
        content:
          'Sua denúncia foi enviada confidencialmente para a moderação. Obrigado por ajudar a manter a ordem!',
        ephemeral: true,
      });
    } catch (error) {
      console.error('Erro ao processar denúncia:', error);
      await interaction.reply({
        content: 'Ocorreu um erro ao tentar enviar sua denúncia.',
        ephemeral: true,
      });
    }
  },
};
