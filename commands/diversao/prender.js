const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const sharp = require('sharp');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('prender')
    .setDescription('Coloca um cidadão infrator atrás das grades.')
    .addUserOption((option) =>
      option.setName('meliante').setDescription('O cidadão a ser detido.').setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const targetUser = interaction.options.getUser('meliante');
    const avatarURL = targetUser.displayAvatarURL({ extension: 'png', size: 512 });
    const gradesPath = path.join(__dirname, '..', '..', 'assets', 'grades.png');

    try {
      const avatarResponse = await axios.get(avatarURL, { responseType: 'arraybuffer' });
      const avatarBuffer = Buffer.from(avatarResponse.data, 'binary');

      // Força o avatar a ter 512x512
      const resizedAvatarBuffer = await sharp(avatarBuffer).resize(512, 512).toBuffer();
      // Força as grades a terem 512x512
      const resizedGradesBuffer = await sharp(gradesPath).resize(512, 512).toBuffer();

      const finalImageBuffer = await sharp(resizedAvatarBuffer)
        .composite([{ input: resizedGradesBuffer }])
        .png()
        .toBuffer();

      const attachment = new AttachmentBuilder(finalImageBuffer, { name: 'preso.png' });
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('ORDEM DE PRISÃO EXECUTADA')
        .setDescription(`O cidadão ${targetUser} foi detido por ordem do Delegado Bira!`)
        .setImage('attachment://preso.png')
        .setTimestamp()
        .setFooter({ text: `Que sirva de lição!` });
      await interaction.editReply({ embeds: [embed], files: [attachment] });
    } catch (error) {
      console.error('Erro ao executar o /prender:', error);
      await interaction.editReply({
        content: 'Houve uma falha na operação. O meliante escapou por enquanto.',
      });
    }
  },
};
