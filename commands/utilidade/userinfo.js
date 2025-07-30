const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Puxa a ficha de um cidadão para análise.')
    .addUserOption(
      (
        option // O campo para mencionar um usuário é opcional
      ) =>
        option
          .setName('usuário')
          .setDescription('O cidadão que você deseja investigar.')
          .setRequired(false)
    ),

  async execute(interaction) {
    // Se o usuário não for mencionado, o alvo é quem usou o comando
    const targetUser = interaction.options.getUser('usuário') || interaction.user;
    const targetMember = await interaction.guild.members.fetch(targetUser.id);

    // Formatação dos cargos do membro
    const roles = targetMember.roles.cache
      .sort((a, b) => b.position - a.position) // Ordena os cargos do mais alto para o mais baixo
      .filter((role) => role.id !== interaction.guild.id) // Filtra o cargo @everyone
      .map((role) => role.toString()) // Converte cada cargo em uma menção
      .join(', '); // Junta tudo com vírgulas

    // Criação do Embed com as informações
    const userInfoEmbed = new EmbedBuilder()
      .setColor(targetMember.displayHexColor || '#0099ff') // Usa a cor do cargo mais alto do membro
      .setTitle(`FICHA CÍVICA: ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 })) // Avatar do usuário
      .addFields(
        { name: '👤 Nome de Usuário', value: `${targetUser.tag}`, inline: true },
        { name: '🆔 ID do Cidadão', value: `\`${targetUser.id}\``, inline: true },
        { name: '🤖 É um Bot?', value: targetUser.bot ? 'Sim' : 'Não', inline: true },
        {
          name: '📅 Conta Criada em',
          // Formata o timestamp para a data e hora local do usuário que está vendo
          value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`,
          inline: false,
        },
        {
          name: '📥 Entrada na Comarca',
          // O ':R' mostra o tempo relativo (ex: "há 2 meses")
          value: `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>`,
          inline: false,
        },
        {
          name: `💼 Cargos (${targetMember.roles.cache.size - 1})`,
          value: roles || 'Nenhum cargo',
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({
        text: `Solicitado por: ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    await interaction.reply({ embeds: [userInfoEmbed] });
  },
};
