const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const sharp = require('sharp');
const axios = require('axios');
const path = require('path');
const { getUser, getLeaderboard } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Mostra sua carteira de identificação com seu nível e XP.')
    .addUserOption((option) =>
      option
        .setName('usuário')
        .setDescription('O membro cuja carteira você quer ver.')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const targetUser = interaction.options.getUser('usuário') || interaction.user;
      const targetMember = await interaction.guild.members.fetch(targetUser.id);
      const userDb = await getUser(targetUser.id, interaction.guild.id);

      if (!userDb || userDb.xp === 0) {
        return interaction.editReply({
          content: `O cidadão ${targetUser.tag} ainda não tem nenhum registro de atividade.`,
        });
      }

      const leaderboard = await getLeaderboard(interaction.guild.id, 10000);
      let rank = leaderboard.findIndex((entry) => entry.userId === targetUser.id) + 1;
      if (rank === 0) rank = 'N/A';

      const requiredXp = userDb.level * 300;
      const xpPercentage = Math.floor((userDb.xp / requiredXp) * 100);

      // --- INÍCIO DA GERAÇÃO DA IMAGEM ---

      const avatarUrl = targetUser.displayAvatarURL({ extension: 'png', size: 256 });
      const avatarResponse = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
      const avatarBuffer = Buffer.from(avatarResponse.data, 'binary');

      const avatarSize = 160; // Tamanho do avatar redondo
      const circleMask = Buffer.from(
        `<svg><circle cx="${avatarSize / 2}" cy="${avatarSize / 2}" r="${avatarSize / 2}" /></svg>`
      );
      const circledAvatarBuffer = await sharp(avatarBuffer)
        .resize(avatarSize, avatarSize)
        .composite([{ input: circleMask, blend: 'dest-in' }])
        .png()
        .toBuffer();

      const statusColors = {
        online: '#43b581',
        idle: '#faa61a',
        dnd: '#f04747',
        offline: '#747f8d',
      };
      const status = targetMember.presence?.status || 'offline';
      const statusColor = statusColors[status];
      const ringSize = avatarSize + 18;
      const statusRingBuffer = await sharp({
        create: {
          width: ringSize,
          height: ringSize,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([
          {
            input: Buffer.from(
              `<svg><circle cx="${ringSize / 2}" cy="${ringSize / 2}" r="${
                ringSize / 2
              }" fill="${statusColor}"/></svg>`
            ),
          },
        ])
        .png()
        .toBuffer();

      const progressBarWidth = 680;
      const progressBarHeight = 50;
      const currentProgressWidth = Math.max(
        progressBarHeight,
        Math.floor((progressBarWidth * xpPercentage) / 100)
      );
      const progressBarSvg = `
                <svg width="${progressBarWidth}" height="${progressBarHeight}">
                    <rect x="0" y="0" width="${progressBarWidth}" height="${progressBarHeight}" rx="${
        progressBarHeight / 2
      }" ry="${progressBarHeight / 2}" fill="#484b4e" />
                    <rect x="0" y="0" width="${currentProgressWidth}" height="${progressBarHeight}" rx="${
        progressBarHeight / 2
      }" ry="${progressBarHeight / 2}" fill="#0099ff" />
                    <text x="50%" y="50%" dy="0.35em" text-anchor="middle" font-family="'Segoe UI', sans-serif" font-size="24px" fill="white" font-weight="bold">
                        ${userDb.xp.toLocaleString('pt-BR')} / ${requiredXp.toLocaleString(
        'pt-BR'
      )} XP
                    </text>
                </svg>
            `;
      const progressBarBuffer = Buffer.from(progressBarSvg);

      // --- NOVO LAYOUT DO TEXTO SVG ---
      const textSvg = `
                <svg width="700" height="100">
                    <style>
                        .username { font-family: 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; font-size: 42px; font-weight: 800; fill: #ffffff; }
                        .discriminator { font-family: 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; font-size: 28px; fill: #b9bbbe; }
                        .label { font-family: 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; font-size: 22px; fill: #b9bbbe; text-anchor: end; }
                        .value { font-family: 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; font-size: 42px; font-weight: 800; fill: #ffffff; text-anchor: end; }
                    </style>
                    <text x="0" y="55" class="username">${targetUser.username}<tspan class="discriminator">#${targetUser.discriminator}</tspan></text>
                    <text x="680" y="35" class="label">LEVEL</text>
                    <text x="680" y="75" class="value">${userDb.level}</text>
                    <text x="540" y="35" class="label">RANK</text>
                    <text x="540" y="75" class="value">#${rank}</text>
                </svg>
            `;
      const textBuffer = Buffer.from(textSvg);

      // --- MONTAGEM FINAL COM ALTURA REDUZIDA ---
      const backgroundPath = path.join(__dirname, '..', '..', 'assets', 'rank_bg.png');
      const finalImageBuffer = await sharp(backgroundPath)
        .resize(1000, 240) // ALTURA REDUZIDA AQUI
        .composite([
          { input: statusRingBuffer, top: 31, left: 31 },
          { input: circledAvatarBuffer, top: 40, left: 40 },
          { input: textBuffer, top: 40, left: 270 },
          { input: progressBarBuffer, top: 150, left: 270 },
        ])
        .png()
        .toBuffer();

      const attachment = new AttachmentBuilder(finalImageBuffer, { name: 'rank-card.png' });
      await interaction.editReply({ files: [attachment] });
    } catch (error) {
      console.error('Erro ao gerar o cartão de rank:', error);
      await interaction.editReply({
        content: 'Ocorreu um erro na gráfica. Não foi possível emitir a carteira.',
      });
    }
  },
};
