const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const sharp = require('sharp');

// Função auxiliar para quebrar o texto em várias linhas
function wrapText(text, maxCharsPerLine = 35) {
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

// Função para formatar números grandes
function formatNumber(num) {
  if (num < 1000) return num;
  if (num < 10000) return (num / 1000).toFixed(1) + 'K';
  return (num / 1000).toFixed(0) + 'K';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tweet')
    .setDescription('Cria um tweet falso em nome de um cidadão.')
    .addStringOption((option) =>
      option.setName('texto').setDescription('O conteúdo do tweet a ser gerado.').setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName('autor')
        .setDescription('O autor do tweet (se não for você).')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('autor') || interaction.user;
    const tweetText = interaction.options.getString('texto');
    const avatarURL = targetUser.displayAvatarURL({ extension: 'png', size: 256 });

    try {
      // 1. Baixa o avatar e o torna redondo
      const avatarResponse = await axios.get(avatarURL, { responseType: 'arraybuffer' });
      const avatarBuffer = Buffer.from(avatarResponse.data, 'binary');
      const avatarSize = 100;
      const circleMask = Buffer.from(
        `<svg><circle cx="${avatarSize / 2}" cy="${avatarSize / 2}" r="${avatarSize / 2}" /></svg>`
      );
      const roundedAvatarBuffer = await sharp(avatarBuffer)
        .resize(avatarSize, avatarSize)
        .composite([{ input: circleMask, blend: 'dest-in' }])
        .png()
        .toBuffer();

      // 2. Prepara o texto e as estatísticas
      const wrappedLines = wrapText(tweetText, 30);
      const replies = formatNumber(Math.floor(Math.random() * 5000));
      const retweets = formatNumber(Math.floor(Math.random() * 15000));
      const likes = formatNumber(Math.floor(Math.random() * 100000));

      // 3. Cria a imagem SVG com o texto
      // A altura do SVG é calculada para ser mais justa ao texto
      const textLineHeight = 40;
      const statsHeight = 60;
      const svgHeight = 100 + wrappedLines.length * textLineHeight + statsHeight;

      const textSvg = `
                <svg width="650" height="${svgHeight}">
                    <style>
                        .name { font-family: 'Segoe UI', sans-serif; font-size: 24px; font-weight: 800; fill: #E7E9EA; }
                        .handle { font-family: 'Segoe UI', sans-serif; font-size: 20px; fill: #71767B; }
                        .text { font-family: 'Segoe UI', sans-serif; font-size: 28px; fill: #E7E9EA; }
                        .stats { font-family: 'Segoe UI', sans-serif; font-size: 20px; fill: #71767B; }
                    </style>
                    <text x="0" y="30" class="name">${targetUser.username}</text>
                    <text x="0" y="58" class="handle">@${targetUser.username.toLowerCase()}</text>
                    <text x="0" y="110" class="text">
                        ${wrappedLines
                          .map((line) => `<tspan x="0" dy="1.3em">${line}</tspan>`)
                          .join('')}
                    </text>
                    <text x="0" y="${90 + wrappedLines.length * textLineHeight + 40}" class="stats">
                        <tspan>💬 ${replies}</tspan> <tspan dx="30">🔁 ${retweets}</tspan> <tspan dx="30">❤️ ${likes}</tspan>
                    </text>
                </svg>
            `;
      const textBuffer = Buffer.from(textSvg);

      // 4. Cria a imagem de fundo com altura um pouco menor e junta tudo
      const finalImageBuffer = await sharp({
        create: {
          width: 800,
          height: 350, // Altura fixa, mas mais justa
          channels: 4,
          background: '#14212b',
        },
      })
        .composite([
          { input: roundedAvatarBuffer, top: 40, left: 40 },
          { input: textBuffer, top: 40, left: 160 },
        ])
        .png()
        .toBuffer();

      // 5. Envia o resultado
      const attachment = new AttachmentBuilder(finalImageBuffer, { name: 'tweet.png' });
      await interaction.editReply({ files: [attachment] });
    } catch (error) {
      console.error('Erro ao executar o /tweet:', error);
      await interaction.editReply({
        content: 'Houve uma falha na gráfica. Não foi possível imprimir o tweet.',
      });
    }
  },
};
