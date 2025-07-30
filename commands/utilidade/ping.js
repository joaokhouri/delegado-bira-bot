// Importa o construtor de Slash Commands
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  // A propriedade 'data' guarda a definição do comando para o Discord
  data: new SlashCommandBuilder()
    .setName('ping') // O nome do comando (o que vem depois da /)
    .setDescription('Responde com Pong! para testar o bot.'), // A descrição que aparece para o usuário

  // A função execute agora recebe uma 'interaction' em vez de 'message'
  async execute(interaction) {
    // .reply() em uma interação é a forma de responder
    await interaction.reply('Pong! O Delegado está na escuta, via ramal direto!');
  },
};
