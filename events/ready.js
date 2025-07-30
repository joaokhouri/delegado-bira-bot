const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,

  execute(client) {
    console.log(`Tudo certo! O Delegado Bira (${client.user.tag}) assumiu o plantão.`);

    // Lista de atividades possíveis para o Delegado
    const activities = [
      { name: '☕ Pausa para o cafézinho...', type: ActivityType.Custom },
      { name: 'as reclamações do patrão', type: ActivityType.Listening },
      { name: 'Candy Crush', type: ActivityType.Playing },
      { name: 'Os Donos da Bola', type: ActivityType.Watching },
      { name: '👍 Dando aquele joinha pro pessoal da firma.', type: ActivityType.Custom },
      { name: 'o jogo no radinho de pilha', type: ActivityType.Listening },
      { name: 'a movimentação no #geral', type: ActivityType.Watching },
      { name: '🔍 Inspecionando as permissões.', type: ActivityType.Custom },
      { name: 'algum filme do Denzel Washington', type: ActivityType.Watching },
      { name: '🎵 Tim Maia', type: ActivityType.Listening },
    ];

    // Define um intervalo para mudar a atividade a cada 15 segundos
    setInterval(() => {
      // Sorteia uma atividade aleatória da lista
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];

      // Define a atividade sorteada
      client.user.setActivity(randomActivity.name, { type: randomActivity.type });
    }, 15000); // 15000 milissegundos = 15 segundos
  },
};
