const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const categoryNames = require('../../utils/commandCategories'); // Importamos nosso "dicionário tradutor"

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painel-comandos')
    .setDescription('Envia um painel com a lista de comandos públicos no canal atual.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator), // Só Admins podem usar

  async execute(interaction) {
    // 1. Filtra os comandos para pegar apenas os que são públicos
    const publicCommands = interaction.client.commands.filter(
      (cmd) => !cmd.data.default_member_permissions
    );

    if (publicCommands.size === 0) {
      return interaction.reply({
        content: 'Não encontrei nenhum comando público para listar.',
        ephemeral: true,
      });
    }

    // 2. Agrupa os comandos públicos por categoria
    const commandCategories = {};
    publicCommands.forEach((command) => {
      const category = command.category || 'Outros';
      if (!commandCategories[category]) {
        commandCategories[category] = [];
      }
      commandCategories[category].push(command);
    });

    // 3. Constrói o Embed com os comandos organizados
    const panelEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Guia de Comandos do Delegado Bira')
      .setDescription(
        'Aqui está a lista de todos os procedimentos que você pode solicitar. Use com sabedoria, cidadão!'
      )
      .setThumbnail(interaction.client.user.displayAvatarURL());

    // Adiciona um campo para cada categoria de comando
    for (const category in commandCategories) {
      // Usa nosso dicionário para pegar o nome bonito da categoria
      const prettyCategoryName =
        categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);

      panelEmbed.addFields({
        name: `\u200B\n${prettyCategoryName}`, // \u200B é um espaço invisível para criar margem
        value: commandCategories[category]
          .map((cmd) => `\`/${cmd.data.name}\`: ${cmd.data.description}`)
          .join('\n'),
        inline: false,
      });
    }

    try {
      // 4. Envia o painel no canal e confirma para o admin
      await interaction.channel.send({ embeds: [panelEmbed] });
      await interaction.reply({
        content: 'O painel de comandos foi enviado com sucesso neste canal.',
        ephemeral: true,
      });
    } catch (error) {
      console.error('Erro ao enviar o painel de comandos:', error);
      await interaction.reply({
        content: 'Ocorreu um erro ao tentar enviar o painel.',
        ephemeral: true,
      });
    }
  },
};
