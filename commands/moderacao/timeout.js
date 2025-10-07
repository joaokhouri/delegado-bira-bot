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

      // --- VARIAÇÕES DE RESPOSTA ---
      const replies = [
        `Pronto. Mandei **${targetUser.tag}** pra salinha do castigo pra pensar um pouco na vida.`,
        `Tá feito. O microfone do engraçadinho **${targetUser.tag}** foi cortado por ${durationString}.`,
        `Operação 'Esfria a Cabeça' executada com sucesso em **${targetUser.tag}**, chefe.`,
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      await interaction.reply({ content: randomReply, flags: [MessageFlags.Ephemeral] });

      // --- LOG COM VARIAÇÕES ---
      const logChannelId = process.env.MOD_LOG_CHANNEL_ID;
      if (!logChannelId) return;
      const logChannel = await interaction.guild.channels.fetch(logChannelId);
      if (!logChannel) return;

      const logDescriptions = [
        'Um cidadão foi temporariamente silenciado para refletir sobre seus atos.',
        'Aplicada pena de silenciamento por tempo determinado.',
        'Membro colocado no cantinho do castigo.',
      ];
      const randomLogDescription =
        logDescriptions[Math.floor(Math.random() * logDescriptions.length)];

      const timeoutLogEmbed = new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle('⚖️ RELATÓRIO DE CASTIGO (TIMEOUT)')
        .setDescription(randomLogDescription)
        .addFields(
          {
            name: 'Membro Silenciado',
            value: `${targetUser.tag} (${targetUser.id})`,
            inline: false,
          },
          { name: 'Duração do Castigo', value: durationString, inline: false },
          { name: 'Moderador Responsável', value: `${interaction.user.tag}`, inline: false },
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
