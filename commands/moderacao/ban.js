// Adicionamos EmbedBuilder
const {
  SlashCommandBuilder,
  PermissionsBitField,
  MessageFlags,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bane um membro permanentemente do servidor.')
    .addUserOption((option) =>
      option.setName('usuário').setDescription('O membro que será banido.').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('motivo').setDescription('O motivo do banimento.').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('usuário');
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido.';
    const targetMember = await interaction.guild.members.fetch(targetUser.id);

    // Verificações de segurança...
    if (targetUser.id === interaction.guild.ownerId) {
      return interaction.reply({
        content: 'Não se pode banir o chefão. Ordens superiores.',
        flags: [MessageFlags.Ephemeral],
      });
    }
    if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({
        content:
          'Este indivíduo tem um cargo muito alto. Minha jurisdição não permite esse banimento.',
        flags: [MessageFlags.Ephemeral],
      });
    }
    if (!targetMember.bannable) {
      return interaction.reply({
        content: 'O Delegado Bira não tem poder para banir esse membro. Verifique meus cargos!',
        flags: [MessageFlags.Ephemeral],
      });
    }

    try {
      // Ação de banir
      await targetMember.ban({ reason: reason });

      // Resposta privada
      await interaction.reply({
        content: `**Tolerância zero!** O meliante **${targetUser.tag}** foi permanentemente banido da comarca.`,
        flags: [MessageFlags.Ephemeral],
      });

      // ===== INÍCIO DA INTEGRAÇÃO DO LOG =====
      const logChannelId = process.env.MOD_LOG_CHANNEL_ID;
      if (!logChannelId) return;

      const logChannel = await interaction.guild.channels.fetch(logChannelId);
      if (!logChannel) return;

      const banLogEmbed = new EmbedBuilder()
        .setColor('#FF0000') // Vermelho forte para banimento
        .setTitle('⚖️ RELATÓRIO DE BANIMENTO')
        .setDescription(`Um mandado de banimento permanente foi executado.`)
        .addFields(
          { name: 'Membro Banido', value: `${targetUser.tag} (${targetUser.id})`, inline: false },
          {
            name: 'Moderador Responsável',
            value: `${interaction.user.tag} (${interaction.user.id})`,
            inline: false,
          },
          { name: 'Motivo', value: `\`\`\`${reason}\`\`\``, inline: false }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();

      await logChannel.send({ embeds: [banLogEmbed] });
      // ===== FIM DA INTEGRAÇÃO DO LOG =====
    } catch (error) {
      console.error('Erro ao executar o /ban:', error);
      await interaction.reply({
        content: 'Ocorreu um erro na papelada e não foi possível processar o banimento.',
        flags: [MessageFlags.Ephemeral],
      });
    }
  },
};
