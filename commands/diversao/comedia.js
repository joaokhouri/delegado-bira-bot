const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('comedia')
    .setDescription('Intima um cidadão por excesso de gracinhas no servidor.')
    .addUserOption((option) =>
      option.setName('cidadão').setDescription('O engraçadinho em questão.').setRequired(true)
    ),

  async execute(interaction) {
    const autorDaIntimacao = interaction.user;
    const cidadaoComedia = interaction.options.getUser('cidadão');

    // --- A LÓGICA ATUALIZADA ESTÁ AQUI ---
    // Se tentarem intimar o próprio Bira
    if (cidadaoComedia.id === interaction.client.user.id) {
      // Lista de respostas possíveis
      const biraResponses = [
        `Opa, opa, opa! ${autorDaIntimacao}, achou que podia me intimar na minha própria área? Isso é desacato à autoridade, tá pensando o quê? Respeita o Bira!`,
        `Que audácia é essa, ${autorDaIntimacao}? Tentando prender o próprio delegado? Vou anotar seu nome no meu caderninho aqui...`,
        `"Comédia"? ${autorDaIntimacao}, o único comédia aqui é você achando que esse comando ia funcionar em mim. Circulando, circulando!`,
      ];
      // Sorteia uma das respostas da lista
      const randomResponse = biraResponses[Math.floor(Math.random() * biraResponses.length)];

      // Responde publicamente (sem a flag Ephemeral)
      return interaction.reply(randomResponse);
    }

    // Se o usuário se intimar
    if (cidadaoComedia.id === autorDaIntimacao.id) {
      return interaction.reply({
        content: 'Assumir a própria condição é o primeiro passo. Respeito, cidadão.',
        flags: [MessageFlags.Ephemeral],
      });
    }

    const comediaEmbed = new EmbedBuilder()
      .setColor('#FFFF00')
      .setTitle('🚨 ALERTA DE COMÉDIA 🚨')
      .setDescription(
        `O cidadão ${autorDaIntimacao} acaba de registrar uma ocorrência de infração humorística!`
      )
      .addFields(
        { name: 'Indivíduo Autuado', value: `${cidadaoComedia}` },
        { name: 'Infração', value: 'Excesso de piadas questionáveis e gracinhas.' }
      )
      .setImage('https://media1.tenor.com/m/S21fVd5e1dIAAAAC/tiririca-abestado.gif')
      .setTimestamp()
      .setFooter({ text: 'A patrulha está de olho no engraçadinho.' });

    await interaction.reply({ embeds: [comediaEmbed] });
  },
};
