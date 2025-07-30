const {
  SlashCommandBuilder,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Inicia uma votação para revisar e possivelmente desbanir um membro.')
    .addStringOption((option) =>
      option.setName('id').setDescription('O ID do usuário para revisão.').setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('motivo')
        .setDescription('O motivo para solicitar a revisão do ban.')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers),

  // A lógica agora é mais direta, sem seu próprio try/catch
  async execute(interaction) {
    const userId = interaction.options.getString('id');
    const reason = interaction.options.getString('motivo');
    const reviewChannelId = process.env.BAN_REVIEW_CHANNEL_ID;

    if (!reviewChannelId) {
      // Se algo der errado, em vez de responder, nós "lançamos" um erro.
      throw new Error('O canal para revisão de bans não está configurado.');
    }
    const reviewChannel = await interaction.guild.channels.fetch(reviewChannelId);
    if (!reviewChannel) {
      throw new Error('Não encontrei o canal de revisão de bans.');
    }

    // A busca pelo usuário agora pode lançar um erro que será pego no index.js
    const bannedUser = await interaction.client.users.fetch(userId);

    const reviewEmbed = new EmbedBuilder()
      .setColor('#FFFF00')
      .setTitle(`Revisão de Banimento: ${bannedUser.tag}`)
      .setThumbnail(bannedUser.displayAvatarURL())
      .addFields(
        { name: 'Usuário a ser Revisado', value: `${bannedUser.tag} (${bannedUser.id})` },
        { name: 'Proposto por', value: `${interaction.user.tag}` },
        { name: 'Motivo da Revisão', value: `\`\`\`${reason}\`\`\`` },
        { name: 'Votos para Aprovar', value: 'Nenhum' }
      )
      .setTimestamp()
      .setFooter({ text: `Votos necessários: ${process.env.VOTES_REQUIRED_FOR_UNBAN}` });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`approve-unban-${userId}`)
        .setLabel('Aprovar Unban')
        .setStyle(ButtonStyle.Success)
        .setEmoji('👍'),
      new ButtonBuilder()
        .setCustomId(`reject-unban-${userId}`)
        .setLabel('Manter Ban')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('👎')
    );

    await reviewChannel.send({ embeds: [reviewEmbed], components: [buttons] });

    // A resposta de sucesso continua aqui, pois só é alcançada se tudo acima deu certo.
    await interaction.reply({
      content: `Sua proposta de revisão para ${bannedUser.tag} foi enviada para ${reviewChannel}.`,
      flags: [MessageFlags.Ephemeral],
    });
  },
};
