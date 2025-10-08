const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { getWarnings } = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Verifica o histórico de advertências de um membro.')
    .addUserOption((option) =>
      option.setName('usuário').setDescription('O membro a ser verificado.').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('usuário');
    const userWarnings = await getWarnings(targetUser.id, interaction.guild.id);

    if (userWarnings.length === 0) {
      return interaction.reply({
        content: `O cidadão ${targetUser.tag} tem a ficha limpa. Nenhuma advertência encontrada.`,
        ephemeral: true,
      });
    }

    const warningsEmbed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle(`Histórico de Advertências de ${targetUser.username}`)
      .setDescription(`Total de **${userWarnings.length}** ocorrências registradas.`);

    // Adiciona um campo para cada advertência, da mais recente para a mais antiga
    for (const warn of userWarnings.slice(0, 25)) {
      // Limita a 25 para não estourar o embed
      const moderator = await interaction.client.users
        .fetch(warn.moderatorId)
        .catch(() => ({ tag: 'ID não encontrado' }));
      warningsEmbed.addFields({
        name: `ID da Ocorrência: ${warn.warningId} - Em <t:${Math.floor(warn.timestamp / 1000)}:R>`,
        value: `**Motivo:** ${warn.reason}\n**Aplicado por:** ${moderator.tag}`,
      });
    }

    await interaction.reply({ embeds: [warningsEmbed], ephemeral: true });
  },
};
