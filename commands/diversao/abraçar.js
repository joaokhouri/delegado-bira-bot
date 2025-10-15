const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('abraçar')
    .setDescription('Dá um abraço em outro membro.')
    .addUserOption((option) =>
      option.setName('membro').setDescription('O cidadão que receberá o abraço.').setRequired(true)
    ),

  async execute(interaction) {
    const autorDoAbraço = interaction.user;
    const membroAbraçado = interaction.options.getUser('membro');

    // Impede que o usuário se abrace
    if (membroAbraçado.id === autorDoAbraço.id) {
      return interaction.reply({
        content:
          'Abraçar a si mesmo é um sinal de amor próprio, mas este comando é para os outros, campeão.',
        flags: [MessageFlags.Ephemeral],
      });
    }

    // Lista de GIFs de abraço
    const hugGifs = [
      'https://media1.tenor.com/m/p1GGOs_f-LIAAAAC/hug-love.gif',
      'https://media1.tenor.com/m/J7eGDvGeP9IAAAAC/hug-hugs.gif',
      'https://media1.tenor.com/m/8sA4Tz9_S-AAAAAC/love-hug.gif',
      'https://media1.tenor.com/m/SuA42b1W27sAAAAC/hug-sending-hug.gif',
      'https://media1.tenor.com/m/Qy1oVd13G8AAAAAC/hug-love.gif',
    ];

    // Sorteia um GIF da lista
    const randomGif = hugGifs[Math.floor(Math.random() * hugGifs.length)];

    const hugEmbed = new EmbedBuilder()
      .setColor('#FF69B4') // Rosa
      .setDescription(`**${autorDoAbraço} deu um abraço apertado em ${membroAbraçado}!**`)
      .setImage(randomGif);

    await interaction.reply({ embeds: [hugEmbed] });
  },
};
