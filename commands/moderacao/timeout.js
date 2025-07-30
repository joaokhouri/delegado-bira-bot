// Adicionamos EmbedBuilder
const {
  SlashCommandBuilder,
  PermissionsBitField,
  MessageFlags,
  EmbedBuilder,
} = require('discord.js');
const ms = require('ms');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Coloca um membro de castigo (silenciado) por um tempo determinado.')
    .addUserOption((option) =>
      option.setName('usuário').setDescription('O membro que ficará de castigo.').setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('duração')
        .setDescription('Duração do castigo (ex: 10m, 1h, 1d).')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('motivo').setDescription('O motivo do castigo.').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.MuteMembers),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('usuário');
    const durationString = interaction.options.getString('duração');
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido.';
    const targetMember = await interaction.guild.members.fetch(targetUser.id);
    const durationMs = ms(durationString);

    // Verificações de segurança e de duração...
    if (targetUser.id === interaction.guild.ownerId) {
      return interaction.reply({
        content: 'Não se pode colocar o dono do servidor de castigo.',
        flags: [MessageFlags.Ephemeral],
      });
    }
    if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({
        content: 'Você não pode aplicar um castigo em alguém com cargo igual ou superior ao seu.',
        flags: [MessageFlags.Ephemeral],
      });
    }
    if (targetMember.isCommunicationDisabled()) {
      return interaction.reply({
        content: 'Este membro já está de castigo.',
        flags: [MessageFlags.Ephemeral],
      });
    }
    if (!durationMs) {
      return interaction.reply({
        content: 'Duração inválida. Use formatos como "10m", "1h", "7d".',
        flags: [MessageFlags.Ephemeral],
      });
    }
    if (durationMs > ms('28d')) {
      return interaction.reply({
        content: 'O castigo não pode exceder 28 dias.',
        flags: [MessageFlags.Ephemeral],
      });
    }

    try {
      // Ação de timeout
      await targetMember.timeout(durationMs, reason);

      // Resposta privada
      await interaction.reply({
        content: `**Ordem no tribunal!** O cidadão **${targetUser.tag}** vai refletir sobre seus atos no xilindró por **${durationString}**.`,
        flags: [MessageFlags.Ephemeral],
      });

      // ===== INÍCIO DA INTEGRAÇÃO DO LOG =====
      const logChannelId = process.env.MOD_LOG_CHANNEL_ID;
      if (!logChannelId) return;

      const logChannel = await interaction.guild.channels.fetch(logChannelId);
      if (!logChannel) return;

      const timeoutLogEmbed = new EmbedBuilder()
        .setColor('#FFFF00') // Amarelo para timeout
        .setTitle('⚖️ RELATÓRIO DE CASTIGO (TIMEOUT)')
        .setDescription(`Um membro foi temporariamente silenciado.`)
        .addFields(
          {
            name: 'Membro Silenciado',
            value: `${targetUser.tag} (${targetUser.id})`,
            inline: false,
          },
          { name: 'Duração do Castigo', value: durationString, inline: false },
          {
            name: 'Moderador Responsável',
            value: `${interaction.user.tag} (${interaction.user.id})`,
            inline: false,
          },
          { name: 'Motivo', value: `\`\`\`${reason}\`\`\``, inline: false }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();

      await logChannel.send({ embeds: [timeoutLogEmbed] });
      // ===== FIM DA INTEGRAÇÃO DO LOG =====
    } catch (error) {
      console.error('Erro ao executar o /timeout:', error);
      await interaction.reply({
        content: 'Ocorreu um erro na papelada e não foi possível aplicar o castigo.',
        flags: [MessageFlags.Ephemeral],
      });
    }
  },
};
