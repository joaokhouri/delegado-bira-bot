// O evento 'ready' é especial, ele só precisa ser executado uma vez.
module.exports = {
  name: 'ready', // O nome do evento do discord.js
  once: true, // 'true' significa que ele só vai rodar uma vez por inicialização

  // A função execute para eventos recebe o 'client' (o próprio bot) como argumento.
  execute(client) {
    console.log(`Tudo certo! O Delegado Bira (${client.user.tag}) assumiu o plantão.`);
    client.user.setActivity('a ordem na cidade', { type: 'WATCHING' });
  },
};
