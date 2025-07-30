const { SlashCommandBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const canvacord = require('canvacord');
const { getUser, getLeaderboard } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Mostra sua carteira de identificação com seu nível e XP.')
    .addUserOption((option) =>
      option
        .setName('usuário')
        .setDescription('O membro cuja carteira você quer ver.')
        .setRequired(false)
    ),

  async execute(interaction) {
    // Pega o alvo (mencionado ou o próprio autor)
    const targetUser = interaction.options.getUser('usuário') || interaction.user;

    // Busca os dados do usuário no banco de dados
    const user = await getUser(targetUser.id, interaction.guild.id);

    // Se o usuário não tiver registro (nunca falou no chat), envia uma mensagem
    if (!user || user.xp === 0) {
      return interaction.reply({
        content: `O cidadão ${targetUser.tag} ainda não tem nenhum registro de atividade.`,
        flags: [MessageFlags.Ephemeral],
      });
    }

    // Busca o ranking completo para descobrir a posição do usuário
    const leaderboard = await getLeaderboard(interaction.guild.id, 1000); // Pega até 1000 usuários
    const rank = leaderboard.findIndex((entry) => entry.userId === targetUser.id) + 1;

    // Calcula o XP necessário para o próximo nível
    const requiredXp = user.level * 300;

    // Cria o cartão de rank com Canvacord
    const rankCard = new canvacord.Rank()
      .setAvatar(targetUser.displayAvatarURL({ format: 'png', size: 256 }))
      .setCurrentXP(user.xp)
      .setRequiredXP(requiredXp)
      .setLevel(user.level)
      .setRank(rank)
      .setStatus(interaction.guild.members.cache.get(targetUser.id)?.presence?.status || 'offline') // Pega o status (online, ausente, etc)
      .setProgressBar('#0099ff', 'COLOR') // Cor da barra de progresso
      .setUsername(targetUser.username)
      .setDiscriminator(targetUser.discriminator);

    // Constrói a imagem e a prepara para envio
    const cardBuffer = await rankCard.build();
    const attachment = new AttachmentBuilder(cardBuffer, { name: 'rank-card.png' });

    // Envia a imagem como resposta
    await interaction.reply({ files: [attachment] });
  },
};
