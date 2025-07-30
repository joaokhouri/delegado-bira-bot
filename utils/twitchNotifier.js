const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

// Pega as variáveis de ambiente que configuramos
const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_USERNAME, ANNOUNCEMENT_CHANNEL_ID } =
  process.env;

// Variável para guardar nosso "token de acesso" à API da Twitch
let twitchAccessToken = null;
// Variável para guardar o estado da live (para não anunciar toda hora)
let isLive = false;

// Função para obter o Token de Acesso da Twitch
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

// Função principal que verifica o status da live
const checkStreamStatus = async (client) => {
  if (!twitchAccessToken) {
    console.log('[Twitch] Sem token de acesso. Pulando verificação.');
    return;
  }

  try {
    // Pergunta à Twitch: "O streamer está ao vivo?"
    const streamResponse = await axios.get(
      `https://api.twitch.tv/helix/streams?user_login=${TWITCH_USERNAME}`,
      {
        headers: {
          'Client-ID': TWITCH_CLIENT_ID,
          Authorization: `Bearer ${twitchAccessToken}`,
        },
      }
    );

    const streamData = streamResponse.data.data[0];

    if (streamData) {
      // Se streamData existe, o streamer está AO VIVO
      if (!isLive) {
        // Se ele NÃO ESTAVA ao vivo antes, mas está AGORA: ANUNCIAR!
        isLive = true;
        console.log(`[Twitch] ${TWITCH_USERNAME} está online! Preparando anúncio.`);

        // Pega informações adicionais do usuário (como a foto de perfil)
        const userResponse = await axios.get(
          `https://api.twitch.tv/helix/users?login=${TWITCH_USERNAME}`,
          {
            headers: {
              'Client-ID': TWITCH_CLIENT_ID,
              Authorization: `Bearer ${twitchAccessToken}`,
            },
          }
        );
        const userData = userResponse.data.data[0];

        // Monta o Embed do anúncio
        const liveEmbed = new EmbedBuilder()
          .setColor('#6441a5') // Cor roxa da Twitch
          .setTitle(`🔴 ESTAMOS AO VIVO! ${streamData.title}`)
          .setURL(`https://twitch.tv/${TWITCH_USERNAME}`)
          .setAuthor({
            name: `${TWITCH_USERNAME}`,
            iconURL: userData.profile_image_url,
            url: `https://twitch.tv/${TWITCH_USERNAME}`,
          })
          .setDescription(
            'A patrulha do Delegado Bira começou! Venha fazer parte da audiência e manter a ordem no chat.'
          )
          .addFields({
            name: 'Jogando',
            value: `${streamData.game_name || 'Apenas conversando'}`,
            inline: true,
          })
          .setImage(streamData.get_thumbnail_url({ width: 1280, height: 720 })) // Thumbnail da live
          .setTimestamp();

        // Envia o anúncio no canal configurado
        const channel = await client.channels.fetch(ANNOUNCEMENT_CHANNEL_ID);
        if (channel) {
          await channel.send({
            content: `@everyone Atenção, comarca! O Delegado Chefe está em live!`,
            embeds: [liveEmbed],
          });
          console.log('[Twitch] Anúncio de live enviado com sucesso!');
        }
      }
    } else {
      // Se streamData não existe, o streamer está OFFLINE
      if (isLive) {
        // Se ele ESTAVA ao vivo antes, mas NÃO ESTÁ mais: resetar o status.
        console.log(`[Twitch] ${TWITCH_USERNAME} ficou offline.`);
        isLive = false;
      }
    }
  } catch (error) {
    console.error(
      '[Twitch] Erro ao verificar o status da stream:',
      error.response?.data || error.message
    );
    // Se o token expirar, tentamos pegar um novo
    if (error.response?.status === 401) {
      console.log('[Twitch] Token inválido ou expirado. Tentando obter um novo...');
      await getAccessToken();
    }
  }
};

// Função que será chamada pelo index.js para iniciar o serviço
const initializeTwitchNotifier = (client) => {
  console.log('[Twitch] Iniciando o serviço de notificação da Twitch.');
  // Pega o token de acesso assim que o bot liga
  getAccessToken().then(() => {
    // E então começa a verificar o status da live a cada 60 segundos
    setInterval(() => checkStreamStatus(client), 60000); // 60000 ms = 1 minuto
  });
};

// Exportamos apenas a função de inicialização
module.exports = { initializeTwitchNotifier };
