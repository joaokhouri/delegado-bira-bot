// Adicionamos EmbedBuilder à lista de importações
const {
  SlashCommandBuilder,
  PermissionsBitField,
  MessageFlags,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa um membro do servidor (ele poderá voltar se tiver convite).')
    .addUserOption((option) =>
      option.setName('usuário').setDescription('O membro que será expulso.').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('motivo').setDescription('O motivo da expulsão.').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('usuário');
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido.';
    const targetMember = await interaction.guild.members.fetch(targetUser.id);

    // As verificações de segurança continuam as mesmas...
    if (targetUser.id === interaction.guild.ownerId) {
      return interaction.reply({
        content: 'Você não pode expulsar o dono da cidade, né?',
        flags: [MessageFlags.Ephemeral],
      });
    }
    if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({
        content: 'Você não pode expulsar alguém com cargo igual ou superior ao seu.',
        flags: [MessageFlags.Ephemeral],
      });
    }
    if (!targetMember.kickable) {
      return interaction.reply({
        content: 'O Delegado Bira não tem poder para expulsar esse membro. Verifique meus cargos!',
        flags: [MessageFlags.Ephemeral],
      });
    }

    try {
      // Ação de expulsar
      await targetMember.kick(reason);

      // Resposta privada para o moderador
      await interaction.reply({
        content: `**Ordem e progresso!** O cidadão **${targetUser.tag}** foi conduzido para fora da comarca.`,
        flags: [MessageFlags.Ephemeral],
      });

      // ===== INÍCIO DA INTEGRAÇÃO DO LOG =====
      const logChannelId = process.env.MOD_LOG_CHANNEL_ID;
      if (!logChannelId) return; // Se o canal de log não estiver configurado, para por aqui

      const logChannel = await interaction.guild.channels.fetch(logChannelId);
      if (!logChannel) return;

      const kickLogEmbed = new EmbedBuilder()
        .setColor('#FF4500') // Laranja-avermelhado
        .setTitle('⚖️ RELATÓRIO DE EXPULSÃO')
        .setDescription(`Uma ordem de expulsão foi executada.`)
        .addFields(
          { name: 'Membro Expulso', value: `${targetUser.tag} (${targetUser.id})`, inline: false },
          {
            name: 'Moderador Responsável',
            value: `${interaction.user.tag} (${interaction.user.id})`,
            inline: false,
          },
          { name: 'Motivo', value: `\`\`\`${reason}\`\`\``, inline: false }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();

      await logChannel.send({ embeds: [kickLogEmbed] });
      // ===== FIM DA INTEGRAÇÃO DO LOG =====
    } catch (error) {
      console.error('Erro ao executar o /kick:', error);
      await interaction.reply({
        content: 'Ocorreu um erro na papelada e não foi possível processar a expulsão.',
        flags: [MessageFlags.Ephemeral],
      });
    }
  },
};
