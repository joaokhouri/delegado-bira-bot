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

      // --- VARIAÇÕES DE RESPOSTA ---
      const replies = [
        `Serviço feito, chefe. O cidadão **${targetUser.tag}** foi convidado a se retirar.`,
        `Ok, o amigão **${targetUser.tag}** ali já não faz mais parte da nossa resenha.`,
        `Missão dada é missão cumprida. Elemento **${targetUser.tag}** removido da área.`,
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      await interaction.reply({ content: randomReply, flags: [MessageFlags.Ephemeral] });

      // --- LOG COM VARIAÇÕES ---
      const logChannelId = process.env.MOD_LOG_CHANNEL_ID;
      if (!logChannelId) return;
      const logChannel = await interaction.guild.channels.fetch(logChannelId);
      if (!logChannel) return;

      const logDescriptions = [
        'Um cidadão foi acompanhado até a saída.',
        'Ordem de remoção executada conforme o procedimento.',
        'Um membro foi retirado da área por mau comportamento.',
      ];
      const randomLogDescription =
        logDescriptions[Math.floor(Math.random() * logDescriptions.length)];

      const kickLogEmbed = new EmbedBuilder()
        .setColor('#aca902ff')
        .setTitle('⚖️ RELATÓRIO DE EXPULSÃO')
        .setDescription(randomLogDescription)
        .addFields(
          { name: 'Membro Expulso', value: `${targetUser.tag} (${targetUser.id})`, inline: false },
          { name: 'Moderador Responsável', value: `${interaction.user.tag}`, inline: false },
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
