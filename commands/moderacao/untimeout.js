const {
  SlashCommandBuilder,
  PermissionsBitField,
  MessageFlags,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Remove o castigo (timeout) de um membro.')
    .addUserOption((option) =>
      option
        .setName('usuário')
        .setDescription('O membro que será liberado do castigo.')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.MuteMembers), // A mesma permissão de silenciar

  async execute(interaction) {
    const targetUser = interaction.options.getUser('usuário');
    const targetMember = await interaction.guild.members.fetch(targetUser.id);

    // ===== VERIFICAÇÕES DE SEGURANÇA =====

    // Verifica se o membro realmente está de castigo
    if (!targetMember.isCommunicationDisabled()) {
      return interaction.reply({
        content: 'Este cidadão não está no cantinho do castigo.',
        flags: [MessageFlags.Ephemeral],
      });
    }

    // ===== EXECUÇÃO DA REMOÇÃO DO TIMEOUT =====
    try {
      // Para remover o timeout, passamos 'null' para a função .timeout()
      await targetMember.timeout(null, 'Castigo removido pelo moderador.');

      // Resposta privada para o moderador
      await interaction.reply({
        content: `**Liberdade cantou!** O castigo do cidadão **${targetUser.tag}** foi removido. Ele pode voltar à resenha.`,
        flags: [MessageFlags.Ephemeral],
      });

      // ===== LOG DA AÇÃO =====
      const logChannelId = process.env.MOD_LOG_CHANNEL_ID;
      if (!logChannelId) return;

      const logChannel = await interaction.guild.channels.fetch(logChannelId);
      if (!logChannel) return;

      const untimeoutLogEmbed = new EmbedBuilder()
        .setColor('#00FF00') // Verde para uma ação positiva
        .setTitle('⚖️ RELATÓRIO DE LIBERAÇÃO (UNTIMEOUT)')
        .setDescription(`Um membro foi liberado do castigo.`)
        .addFields(
          { name: 'Membro Liberado', value: `${targetUser.tag} (${targetUser.id})`, inline: false },
          {
            name: 'Moderador Responsável',
            value: `${interaction.user.tag} (${interaction.user.id})`,
            inline: false,
          }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();

      await logChannel.send({ embeds: [untimeoutLogEmbed] });
    } catch (error) {
      console.error('Erro ao executar o /untimeout:', error);
      await interaction.reply({
        content: 'Ocorreu um erro na papelada e não foi possível liberar este cidadão.',
        flags: [MessageFlags.Ephemeral],
      });
    }
  },
};
