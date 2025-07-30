const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionsBitField,
  MessageFlags,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
// Importamos nosso novo dicionário central
const categoryNames = require('../../utils/commandCategories');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ajuda')
    .setDescription('Lista todos os meus procedimentos e manuais de operação.'),

  async execute(interaction) {
    let commandFolders = fs.readdirSync(path.join(__dirname, '..'));

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      commandFolders = commandFolders.filter((folder) => folder !== 'moderacao');
    }

    const initialEmbed = new EmbedBuilder()
      // ... (o embed inicial continua o mesmo)
      .setColor('#0099ff')
      .setTitle('Manual de Operações do Delegado Bira')
      .setDescription(
        'Olá, cidadão! Sou o Delegado Bira, a unidade de segurança e ordem deste servidor. \n\nSelecione uma categoria abaixo para ver os procedimentos que posso executar.'
      )
      .setThumbnail(interaction.client.user.displayAvatarURL());

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ajuda-menu')
      .setPlaceholder('Escolha uma categoria...')
      .addOptions(
        commandFolders.map((folder) => {
          // A lógica aqui agora lê do nosso arquivo importado
          const label = categoryNames[folder] || folder.charAt(0).toUpperCase() + folder.slice(1);
          return {
            label: label,
            value: folder,
            description: `Comandos da categoria de ${label}`,
          };
        })
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      embeds: [initialEmbed],
      components: [row],
      flags: [MessageFlags.Ephemeral],
    });
  },
};
