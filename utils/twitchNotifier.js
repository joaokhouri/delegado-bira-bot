const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_USERNAME, ANNOUNCEMENT_CHANNEL_ID } =
  process.env;

let twitchAccessToken = null;
let isLive = false;

const getAccessToken = async () => {
  try {
    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        grant_type: 'client_credentials',
      },
    });
    twitchAccessToken = response.data.access_token;
    console.log('[Twitch] Token de acesso obtido com sucesso!');
  } catch (error) {
    console.error(
      '[Twitch] Erro ao obter o token de acesso:',
      error.response?.data || error.message
    );
    twitchAccessToken = null;
  }
};

const checkStreamStatus = async (client) => {
  if (!twitchAccessToken) return;

  try {
    const streamResponse = await axios.get(
      `https://api.twitch.tv/helix/streams?user_login=${TWITCH_USERNAME}`,
      {
        headers: { 'Client-ID': TWITCH_CLIENT_ID, Authorization: `Bearer ${twitchAccessToken}` },
      }
    );
    const streamData = streamResponse.data.data[0];

    if (streamData && !isLive) {
      isLive = true;
      console.log(`[Twitch] ${TWITCH_USERNAME} está online! Preparando anúncio.`);

      const userResponse = await axios.get(
        `https://api.twitch.tv/helix/users?login=${TWITCH_USERNAME}`,
        {
          headers: { 'Client-ID': TWITCH_CLIENT_ID, Authorization: `Bearer ${twitchAccessToken}` },
        }
      );
      const userData = userResponse.data.data[0];

      // =======================================================
      // NOVAS FRASES DO BIRA (ESTILO "CHEGADO")
      // =======================================================

      // Lista de possíveis mensagens de menção (@everyone)
      const announcementPings = [
        `Opa, @everyone! O patrão ligou a câmera, chega mais!`,
        `Atenção, rapaziada! @everyone! O homem tá ao vivo, bora colar!`,
        `Alerta do Bira, @everyone! O campeão tá online, encosta aí!`,
        `Escuta aqui, @everyone! A live começou, ordem do bigode!`,
      ];

      // Lista de possíveis descrições para o Embed (o comentário do Bira)
      const announcementHooks = [
        'A luz vermelha acendeu aqui na guarita. Sinal de que a live começou e meu turno de vigia do chat também. Bora.',
        'Fui intimado a anunciar que a transmissão tá on. Meu trabalho é esse, né? Dar o recado pra galera.',
        'Bora lá dar aquela moral pro chefe, rapaziada. Audiência lá é o cafezinho a mais aqui na guarita.',
        'Vai dar uma chegada lá na live, senão o homem atrasa meu pagamento de novo.',
        'O amigão ali já tá esperando vocês. Chega junto pra resenha ser daquele jeito!',
      ];

      // Sorteia uma mensagem e uma descrição aleatória
      const randomPing = announcementPings[Math.floor(Math.random() * announcementPings.length)];
      const randomHook = announcementHooks[Math.floor(Math.random() * announcementHooks.length)];

      const liveEmbed = new EmbedBuilder()
        .setColor('#6441a5')
        .setTitle(`🔴 AO VIVO: ${streamData.title}`)
        .setURL(`https://twitch.tv/${TWITCH_USERNAME}`)
        .setAuthor({
          name: `${TWITCH_USERNAME}`,
          iconURL: userData.profile_image_url,
          url: `https://twitch.tv/${TWITCH_USERNAME}`,
        })
        .setDescription(randomHook) // Usa a descrição sorteada
        .addFields({
          name: 'Jogando',
          value: `${streamData.game_name || 'Só na resenha'}`,
          inline: true,
        })
        .setImage(streamData.thumbnail_url.replace('{width}', '1280').replace('{height}', '720'))
        .setTimestamp()
        .setFooter({ text: 'Recado oficial do Bira, o seu guarda.' });

      const channel = await client.channels.fetch(ANNOUNCEMENT_CHANNEL_ID);
      if (channel) {
        await channel.send({ content: randomPing, embeds: [liveEmbed] }); // Usa a menção sorteada
        console.log('[Twitch] Anúncio de live (estilo "parça") enviado com sucesso!');
      }
    } else if (!streamData && isLive) {
      console.log(`[Twitch] ${TWITCH_USERNAME} ficou offline.`);
      isLive = false;
    }
  } catch (error) {
    console.error(
      '[Twitch] Erro ao verificar o status da stream:',
      error.response?.data || error.message
    );
    if (error.response?.status === 401) {
      await getAccessToken();
    }
  }
};

const initializeTwitchNotifier = (client) => {
  console.log('[Twitch] Iniciando o serviço de notificação da Twitch.');
  getAccessToken().then(() => {
    // Verifica imediatamente ao iniciar e depois a cada 60 segundos
    checkStreamStatus(client);
    setInterval(() => checkStreamStatus(client), 60000);
  });
};

module.exports = { initializeTwitchNotifier };
