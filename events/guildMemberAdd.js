const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',

  async execute(member, client) {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    if (!channelId) return;

    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    // =======================================================
    // NOVAS FRASES DO BIRA (ESTILO "RECEPCIONISTA")
    // =======================================================

    // Lista de possíveis títulos para o Embed
    const welcomeTitles = [
      `CHEGOU REFORÇO NA ÁREA!`,
      `ABRE O PORTÃO QUE CHEGOU GENTE NOVA!`,
      `MAIS UM PRA QUADRILHA!`,
      `OLHA QUEM TÁ CHEGANDO NO PEDAÇO!`,
    ];

    // Lista de possíveis frases de boas-vindas na descrição
    const welcomeMessages = [
      `O portão tava aberto e o cidadão(ã) resolveu colar. Seja bem-vindo(a)!`,
      `Acabei de checar a identidade na portaria e tá tudo certo. Pode entrar!`,
      `O patrão mandou receber bem, então sinta-se em casa. Pode chegar.`,
      `Mais uma alma pra firma. Fica à vontade, campeão(ã)!`,
    ];

    // Sorteia um título e uma mensagem
    const randomTitle = welcomeTitles[Math.floor(Math.random() * welcomeTitles.length)];
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

    const welcomeEmbed = new EmbedBuilder()
      .setColor('#00FF00') // Verde para boas-vindas
      .setTitle(randomTitle)
      .setAuthor({ name: `Recado do Bira da Guarita`, iconURL: client.user.displayAvatarURL() })
      .setDescription(randomMessage)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        {
          name: 'Primeira Parada',
          value: 'Dá uma lida no canal de `#regras-da-casa` pra não levar uma dura depois.',
        },
        {
          name: 'Total de Membros',
          value: `Agora somos **${member.guild.memberCount}** na resenha!`,
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Qualquer problema, chama o Bira.' });

    // A mensagem principal menciona o usuário
    const mainMessage = {
      content: `E aí, ${member}, tranquilo? Seja bem-vindo(a)!`,
      embeds: [welcomeEmbed],
    };

    try {
      await channel.send(mainMessage);
    } catch (error) {
      console.error('Erro ao enviar a mensagem de boas-vindas:', error);
    }
  },
};
