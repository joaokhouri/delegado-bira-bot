const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sortear')
    .setDescription('O Bira sorteia um número para você.')
    .addIntegerOption((option) =>
      option
        .setName('maximo')
        .setDescription('O número máximo a ser sorteado (o mínimo é sempre 1).')
        .setRequired(true)
        .setMinValue(2)
    ), // Garante que o número máximo seja pelo menos 2

  async execute(interaction) {
    const maximo = interaction.options.getInteger('maximo');

    // Gera um número aleatório entre 1 e o máximo
    const numeroSorteado = Math.floor(Math.random() * maximo) + 1;

    const sorteioEmbed = new EmbedBuilder()
      .setColor('#1E90FF') // Azul
      .setTitle('🎲 Sorteio do Bira')
      .setDescription(`O Bira rolou os dados e o resultado entre 1 e ${maximo} é...`)
      .addFields({ name: 'Número Sorteado', value: `**${numeroSorteado}**` })
      .setFooter({ text: `Sorteio solicitado por: ${interaction.user.tag}` });

    await interaction.reply({ embeds: [sorteioEmbed] });
  },
};
