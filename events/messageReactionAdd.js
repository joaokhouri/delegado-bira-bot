const { EmbedBuilder } = require('discord.js');
const { getStarboardEntry, addStarboardEntry } = require('../utils/database');

module.exports = {
  name: 'messageReactionAdd',

  async execute(reaction, user, client) {
    // --- VERIFICAÇÕES INICIAIS ---
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    if (!reaction.message.guild || user.bot) return;

    const starEmoji = process.env.STAR_EMOJI || '⭐';
    const starThreshold = parseInt(process.env.STAR_THRESHOLD) || 3;
    const starboardChannelId = process.env.STARBOARD_CHANNEL_ID;

    // Se a reação não for a correta, ou o canal não estiver configurado, ignora.
    if (reaction.emoji.name !== starEmoji || !starboardChannelId) return;

    const message = reaction.message;
    const starCount = reaction.count;

    // Regras: Não pode estrelar a própria mensagem e precisa atingir o limite
    if (message.author.id === user.id || starCount < starThreshold) return;

    // --- LÓGICA DO STARBOARD ---
    try {
      const starboardChannel = await client.channels.fetch(starboardChannelId).catch(() => null);
      if (!starboardChannel) return console.error('[Starboard] Canal do mural não encontrado.');

      const existingEntry = await getStarboardEntry(message.id);

      // Monta o Embed do destaque
      const starEmbed = new EmbedBuilder()
        .setColor('#FFAC33') // Cor de estrela
        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
        .setDescription(message.content || '\u200B') // \u200B se a mensagem for só uma imagem
        .addFields({ name: 'Mensagem Original', value: `[Clique para ver](${message.url})` })
        .setTimestamp(message.createdTimestamp)
        .setFooter({ text: `⭐ ${starCount}` });

      // Se a mensagem original tiver uma imagem, anexa ao embed
      if (message.attachments.size > 0) {
        starEmbed.setImage(message.attachments.first().url);
      }

      if (existingEntry) {
        // Se a mensagem já está no mural, apenas EDITA o contador de estrelas
        const starboardMessage = await starboardChannel.messages
          .fetch(existingEntry.starboardMessageId)
          .catch(() => null);
        if (starboardMessage) {
          await starboardMessage.edit({ embeds: [starEmbed] });
        }
      } else {
        // Se a mensagem atingiu o limite pela primeira vez, ENVIA para o mural
        if (starCount === starThreshold) {
          const starboardMessage = await starboardChannel.send({ embeds: [starEmbed] });
          // E salva no banco de dados para não postar de novo
          await addStarboardEntry(message.id, starboardMessage.id, message.guild.id);
        }
      }
    } catch (error) {
      console.error('[Starboard] Erro ao processar reação:', error);
    }
  },
};
