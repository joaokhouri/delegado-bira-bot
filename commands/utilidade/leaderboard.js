const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { getLeaderboard } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Mostra o quadro de honra com os cidadãos mais ativos.'),

  async execute(interaction) {
    // Busca os dados do ranking do banco de dados (os 10 primeiros)
    const leaderboard = await getLeaderboard(interaction.guild.id, 10);

    // Se o ranking estiver vazio, envia uma mensagem
    if (leaderboard.length === 0) {
      return interaction.reply({
        content: 'Ainda não há registros suficientes para montar um quadro de honra.',
        flags: [MessageFlags.Ephemeral],
      });
    }

    // Monta a descrição do Embed com os dados do ranking
    // Usamos Promise.all para buscar as informações de todos os usuários de forma eficiente
    const leaderboardString = await Promise.all(
      leaderboard.map(async (entry, index) => {
        try {
          // Busca o objeto de usuário do Discord pelo ID
          const user = await interaction.client.users.fetch(entry.userId);
          // Formata a linha do ranking
          const rank = index + 1;
          let rankEmoji = '🏅';
          if (rank === 1) rankEmoji = '🥇';
          if (rank === 2) rankEmoji = '🥈';
          if (rank === 3) rankEmoji = '🥉';

          return `${rankEmoji} **${rank}.** ${user.tag} - **Nível ${entry.level}** (${entry.xp} XP)`;
        } catch (error) {
          // Se o usuário não for encontrado (ex: saiu do Discord), pulamos ele
          return null;
        }
      })
    );

    // Filtra qualquer usuário que não tenha sido encontrado
    const finalLeaderboard = leaderboardString.filter((entry) => entry !== null).join('\n');

    // Cria o Embed final
    const leaderboardEmbed = new EmbedBuilder()
      .setColor('#FFD700') // Dourado
      .setTitle(`🏆 Quadro de Honra do Terreiro`)
      .setAuthor({
        name: 'Registros Oficiais do Delegado Bira',
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setDescription(finalLeaderboard || 'Nenhum registro encontrado.')
      .setTimestamp()
      .setFooter({ text: 'Continue participando para subir no ranking!' });

    // Envia o ranking como resposta
    await interaction.reply({ embeds: [leaderboardEmbed] });
  },
};
