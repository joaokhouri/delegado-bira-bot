const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const sharp = require('sharp');

// Função auxiliar mais segura para quebrar o texto
function wrapText(text, maxCharsPerLine = 30) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length > maxCharsPerLine && currentLine.length > 0) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = (currentLine + ' ' + word).trim();
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine.trim());
  }
  return lines;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filosofo')
    .setDescription('Transforma uma frase de um cidadão em uma citação filosófica.')
    .addUserOption((option) =>
      option
        .setName('autor')
        .setDescription('O cidadão que proferiu a pérola de sabedoria.')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('frase').setDescription('A frase a ser imortalizada.').setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('autor');
    const quoteText = interaction.options.getString('frase');
    const avatarURL = targetUser.displayAvatarURL({ extension: 'png', size: 512 });

    try {
      // 1. Baixa o avatar do usuário
      const avatarResponse = await axios.get(avatarURL, { responseType: 'arraybuffer' });
      const avatarBuffer = Buffer.from(avatarResponse.data, 'binary');

      // 2. Cria uma máscara de gradiente para o efeito de fade
      const avatarSize = 300;
      const gradientMask = await sharp({
        create: {
          width: avatarSize,
          height: avatarSize,
          channels: 4,
          // Cria um gradiente que vai de totalmente opaco (preto) a totalmente transparente
          background: { r: 0, g: 0, b: 0, alpha: 1 },
        },
      })
        .composite([
          {
            input: Buffer.from(
              `<svg><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0.6" stop-color="white" stop-opacity="1"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient></defs><rect x="0" y="0" width="${avatarSize}" height="${avatarSize}" fill="url(#g)"/></svg>`
            ),
          },
        ])
        .png()
        .toBuffer();

      // 3. Aplica o fade no avatar
      const fadedAvatarBuffer = await sharp(avatarBuffer)
        .resize(avatarSize, avatarSize)
        .composite([
          {
            input: gradientMask,
            blend: 'dest-in', // Usa o gradiente como máscara de transparência
          },
        ])
        .png()
        .toBuffer();

      // 4. Prepara o texto com quebra de linha
      const wrappedLines = wrapText(quoteText);
      const textYOffset = 180;
      const textLineHeight = 45;
      const textSvg = `
                <svg width="450" height="400">
                    <style>
                        .quote { fill: #E0E0E0; font-size: 36px; font-family: Georgia, serif; font-style: italic; text-anchor: start; }
                        .author { fill: #B0B0B0; font-size: 26px; font-family: Arial, sans-serif; text-anchor: start; font-weight: bold; }
                    </style>
                    <text x="0" y="${textYOffset}" class="quote">
                        " ${wrappedLines
                          .map(
                            (line, i) =>
                              `<tspan x="0" dy="${i === 0 ? 0 : textLineHeight}">${line}</tspan>`
                          )
                          .join('')} "
                    </text>
                    <text x="0" y="${
                      textYOffset + wrappedLines.length * textLineHeight + 30
                    }" class="author">- ${targetUser.username}</text>
                </svg>
            `;
      const textBuffer = Buffer.from(textSvg);

      // 5. Cria a imagem de fundo e junta tudo
      const finalImageBuffer = await sharp({
        create: {
          width: 900,
          height: 500,
          channels: 4,
          background: { r: 20, g: 20, b: 25, alpha: 1 },
        },
      })
        .composite([
          { input: fadedAvatarBuffer, top: 100, left: 0 }, // Cola o avatar com fade
          { input: textBuffer, top: 0, left: 400 }, // Cola o texto
        ])
        .png()
        .toBuffer();

      // 6. Prepara e envia o resultado
      const attachment = new AttachmentBuilder(finalImageBuffer, { name: 'filosofo.png' });
      await interaction.editReply({ files: [attachment] });
    } catch (error) {
      console.error('Erro ao executar o /filosofo:', error);
      await interaction.editReply({
        content: 'Houve uma falha ao imortalizar o pensamento. A sabedoria era complexa demais.',
      });
    }
  },
};
