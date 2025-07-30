const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gado')
    .setDescription('Aciona o Gado-Detector 3000 para medir o nível de um cidadão.')
    .addUserOption(
      (
        option // O campo para mencionar um usuário é opcional
      ) => option.setName('cidadão').setDescription('O alvo da investigação.').setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('cidadão') || interaction.user;
    const gadoLevel = Math.floor(Math.random() * 101);

    const gadoEmbed = new EmbedBuilder()
      .setColor('#FFC0CB')
      .setTitle('🐂 LAUDO TÉCNICO - GADO-DETECTOR 3000')
      .setDescription(`Análise solicitada por: ${interaction.user.tag}`)
      .setThumbnail('https://i.imgur.com/v86v2S1.png')
      .addFields(
        // ===== A MUDANÇA ESTÁ AQUI =====
        // Em vez de 'targetUser.tag', usamos o próprio 'targetUser' para criar a menção.
        { name: 'Cidadão Sob Investigação', value: `${targetUser}`, inline: false },
        {
          name: 'Resultado da Perícia',
          value: `O indivíduo apresenta um índice de **${gadoLevel}%** de gado.`,
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Procedimento padrão. Sem mais.' });

    // A lógica condicional para as observações continua a mesma...
    if (gadoLevel === 0) {
      gadoEmbed.addFields({
        name: 'Observação do Delegado',
        value: 'Negativo para gadice. Cidadão exemplar. Dispensado.',
      });
    } else if (gadoLevel > 0 && gadoLevel <= 30) {
      gadoEmbed.addFields({
        name: 'Observação do Delegado',
        value: 'Nível baixo. Apenas uma suspeita leve. Mantenha-se na linha.',
      });
    } else if (gadoLevel > 30 && gadoLevel <= 70) {
      gadoEmbed.addFields({
        name: 'Observação do Delegado',
        value: 'Sinais claros. O cidadão está sob observação da patrulha.',
      });
    } else if (gadoLevel > 70 && gadoLevel < 100) {
      gadoEmbed.addFields({
        name: 'Observação do Delegado',
        value: 'Alerta vermelho! Nível crítico. Sujeito a maiores investigações.',
      });
    } else if (gadoLevel === 100) {
      gadoEmbed.addFields({
        name: 'Observação do Delegado',
        value: 'O Gado-Detector explodiu. Caso de saúde pública. Quarentena imediata.',
      });
      gadoEmbed.setColor('#FF0000');
    }

    // A resposta final continua com o 'content' para garantir a notificação
    await interaction.reply({
      content: `**Intimação:** O laudo técnico do cidadão ${targetUser} foi solicitado.`,
      embeds: [gadoEmbed],
    });
  },
};
