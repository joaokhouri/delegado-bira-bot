// Importa as ferramentas necessárias do discord.js
const {
  SlashCommandBuilder,
  PermissionsBitField,
  MessageFlags,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  // 1. DEFINIÇÃO DO COMANDO
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Apaga uma certa quantidade de mensagens do canal.')
    .addIntegerOption(
      (
        option // Adiciona um campo para o usuário digitar um número
      ) =>
        option
          .setName('quantidade')
          .setDescription('O número de mensagens a serem apagadas (1 a 99).')
          .setRequired(true)
    ) // Torna este campo obrigatório
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages), // Só mostra o comando para quem pode gerenciar mensagens

  // 2. LÓGICA DE EXECUÇÃO DO COMANDO
  async execute(interaction) {
    // Pega o número que o usuário digitou no comando
    const quantidade = interaction.options.getInteger('quantidade');

    // Verifica se o usuário tem permissão para apagar mensagens (uma segunda camada de segurança)
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({
        content: 'Você não tem permissão para usar este comando',
        flags: [MessageFlags.Ephemeral],
      });
    }

    // Validação da quantidade (o Discord só permite apagar de 1 a 100 de uma vez, e não mensagens com mais de 14 dias)
    if (quantidade < 1 || quantidade > 99) {
      return interaction.reply({
        content: 'Delegado Bira só pode apagar entre 1 e 99 mensagens por vez.',
        flags: [MessageFlags.Ephemeral],
      });
    }

    // Ação de apagar as mensagens
    try {
      // Ação de apagar as mensagens
      const deletedMessages = await interaction.channel.bulkDelete(quantidade, true);

      // ===== CONSTRUÇÃO DO EMBED DE CONFIRMAÇÃO =====
      const clearEmbed = new EmbedBuilder()
        .setColor('#00FF00') // Verde para uma ação bem-sucedida
        .setTitle('Operação "Limpa Pista"')
        .setDescription('A área foi limpa conforme o procedimento.')
        .addFields(
          { name: 'Mensagens Apagadas', value: `${deletedMessages.size}`, inline: true },
          { name: 'Oficial Responsável', value: `${interaction.user}`, inline: true }
        )
        .setTimestamp();

      // Enviamos o Embed como resposta. Note que REMOVEMOS a flag 'ephemeral'.
      await interaction.reply({ embeds: [clearEmbed] });

      // Opcional: Apagar a mensagem de confirmação depois de alguns segundos
      setTimeout(() => interaction.deleteReply(), 5000); // 5000 milissegundos = 5 segundos
    } catch (error) {
      console.error('Erro ao tentar executar a faxina:', error);
      await interaction.reply({
        content: 'Ocorreu um erro e a papelada emperrou. Não foi possível apagar as mensagens.',
        flags: [MessageFlags.Ephemeral],
      });
    }
  },
};
