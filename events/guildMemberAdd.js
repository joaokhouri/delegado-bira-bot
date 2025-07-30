// No topo do arquivo, importamos a ferramenta para construir Embeds
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',

  // Note que adicionamos o 'client' como segundo argumento.
  // O nosso Event Handler no index.js já nos fornece isso.
  // Precisamos dele para pegar o avatar do nosso bot.
  async execute(member, client) {
    // As verificações do canal continuam as mesmas
    const channelId = process.env.WELCOME_CHANNEL_ID;
    if (!channelId) {
      console.log(
        '[AVISO] ID do canal de boas-vindas (WELCOME_CHANNEL_ID) não configurado no .env.'
      );
      return;
    }

    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) {
      console.error(`[ERRO] O canal de boas-vindas com ID ${channelId} não foi encontrado.`);
      return;
    }

    // ===== CONSTRUÇÃO DO EMBED DE BOAS-VINDAS =====

    const welcomeEmbed = new EmbedBuilder()
      .setColor('#0099ff') // Cor da barra lateral do embed (um azul policial)
      .setTitle('⚖️ REGISTRO DE NOVO CIDADÃO')
      .setAuthor({ name: 'Delegacia do Bira', iconURL: client.user.displayAvatarURL() })
      .setDescription(`Um novo recruta foi registrado em nossa comarca. Dêem as boas-vindas!`)
      .setThumbnail(member.user.displayAvatarURL()) // Mostra o avatar do novo membro como uma "foto de perfil"
      .addFields(
        // Adiciona campos organizados
        { name: 'Nome de Recruta', value: `${member.user.username}`, inline: true },
        { name: 'ID do Cidadão', value: `${member.user.id}`, inline: true },
        { name: 'Total de Cidadãos', value: `${member.guild.memberCount}`, inline: false }
      )
      .setImage('https://i.imgur.com/8v3A3pI.gif') // Uma imagem ou GIF de banner na parte de baixo
      .setTimestamp() // Adiciona um carimbo de data e hora de quando o membro entrou
      .setFooter({
        text: 'Ande na linha e a ordem reinará.',
        iconURL: client.user.displayAvatarURL(),
      });

    // Monta a mensagem final com o texto e o embed
    const welcomeMessage = {
      content: `Boas-vindas à comarca, ${member}!`, // O texto menciona o usuário
      embeds: [welcomeEmbed], // O array de embeds contém nosso cartão
    };

    // Envia a mensagem final no canal
    try {
      await channel.send(welcomeMessage);
    } catch (error) {
      console.error('Erro ao enviar a mensagem de boas-vindas com embed:', error);
    }
  },
};
