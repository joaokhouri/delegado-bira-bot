const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('moeda')
    .setDescription('O Delegado Bira joga uma moeda para decidir a sorte.'),

  async execute(interaction) {
    // Sorteia um número: 0 ou 1
    const resultado = Math.floor(Math.random() * 2); // 0 para Cara, 1 para Coroa

    // Define a imagem e o texto correspondente ao resultado
    const caraImagem = 'https://i.imgur.com/b68p6M2.png'; // URL de uma imagem de moeda "Cara"
    const coroaImagem = 'https://i.imgur.com/B6s43yN.png'; // URL de uma imagem de moeda "Coroa"

    const resultadoTexto = resultado === 0 ? 'Cara' : 'Coroa';
    const resultadoImagem = resultado === 0 ? caraImagem : coroaImagem;

    // Cria o Embed com o resultado
    const moedaEmbed = new EmbedBuilder()
      .setColor('#FFD700') // Dourado
      .setTitle('🪙 Cara ou Coroa?')
      .setDescription(`O Delegado jogou a moeda para o alto e o resultado é...`)
      .setThumbnail(resultadoImagem)
      .addFields({ name: 'Resultado Final', value: `**${resultadoTexto}**!` })
      .setFooter({ text: `Decisão tomada por: ${interaction.user.tag}` });

    await interaction.reply({ embeds: [moedaEmbed] });
  },
};
