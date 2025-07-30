const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Mostra o relatório demográfico completo da nossa comarca.'),

  async execute(interaction) {
    const guild = interaction.guild; // O objeto do servidor

    // Faz o fetch do dono do servidor para garantir que temos as informações atualizadas
    const owner = await guild.fetchOwner();

    // Contagem de canais por tipo
    const textChannels = guild.channels.cache.filter((c) => c.type === 0).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.type === 2).size;
    const categories = guild.channels.cache.filter((c) => c.type === 4).size;

    // Cria o Embed com todas as informações
    const serverInfoEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Relatório Demográfico: ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 256 })) // Ícone do servidor
      .addFields(
        { name: '👑 Dono da Área', value: `${owner.user.tag}`, inline: true },
        { name: '🆔 ID do Servidor', value: `\`${guild.id}\``, inline: true },
        {
          name: '📅 Data de Fundação',
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
          inline: false,
        },
        {
          name: '👥 População Total',
          value: `**${guild.memberCount}** membros`,
          inline: true,
        },
        {
          name: '📜 Cargos',
          value: `${guild.roles.cache.size} cargos`,
          inline: true,
        },
        {
          name: '🙂 Emojis',
          value: `${guild.emojis.cache.size} emojis`,
          inline: true,
        },
        {
          name: '🏛️ Estrutura de Canais',
          value: `**${categories}** Categorias\n**${textChannels}** Canais de Texto\n**${voiceChannels}** Canais de Voz`,
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({
        text: `Relatório emitido por: Delegado Bira`,
        iconURL: interaction.client.user.displayAvatarURL(),
      });

    await interaction.reply({ embeds: [serverInfoEmbed] });
  },
};
