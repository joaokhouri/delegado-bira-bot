const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
  MessageFlags,
} = require('discord.js');
const { addWarning, getWarnings } = require('../../utils/database');
const ms = require('ms');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Aplica uma advertência a um membro.')
    .addUserOption((option) =>
      option.setName('usuário').setDescription('O membro a ser advertido.').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('motivo').setDescription('O motivo da advertência.').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('usuário');
    const reason = interaction.options.getString('motivo');
    const moderator = interaction.user;

    try {
      // 1. Adiciona a advertência ao banco de dados
      await addWarning(targetUser.id, interaction.guild.id, moderator.id, reason);

      // 2. Notifica o usuário na DM
      const dmEmbed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('Você Recebeu uma Advertência')
        .setDescription(`Você foi advertido(a) no servidor **${interaction.guild.name}**.`)
        .addFields(
          { name: 'Motivo', value: `\`\`\`${reason}\`\`\`` },
          { name: 'Moderador', value: moderator.tag }
        )
        .setFooter({ text: 'Acumular advertências pode levar a punições automáticas.' })
        .setTimestamp();
      await targetUser.send({ embeds: [dmEmbed] }).catch(() => {});

      // 3. Puxa o histórico para verificar o total de advertências
      const userWarnings = await getWarnings(targetUser.id, interaction.guild.id);
      const warningCount = userWarnings.length;

      // 4. Responde ao moderador e envia o log
      const replyEmbed = new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle('⚖️ Advertência Aplicada com Sucesso')
        .setDescription(`O cidadão ${targetUser} foi advertido.`)
        .addFields(
          { name: 'Motivo', value: reason },
          { name: 'Total de Advertências', value: `**${warningCount}**` }
        );

      await interaction.reply({ embeds: [replyEmbed], flags: [MessageFlags.Ephemeral] });

      // 5. Lógica de Punição Automática
      if (warningCount >= 3) {
        const targetMember = await interaction.guild.members.fetch(targetUser.id);
        const timeoutDuration = '1h';
        await targetMember.timeout(
          ms(timeoutDuration),
          `Atingiu o limite de ${warningCount} advertências.`
        );

        const autoPunishEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🚨 PUNIÇÃO AUTOMÁTICA APLICADA 🚨')
          .setDescription(
            `O cidadão ${targetUser} atingiu o limite de **${warningCount} advertências** e foi colocado de castigo.`
          )
          .addFields({ name: 'Punição', value: `Timeout de ${timeoutDuration}` });

        await interaction.channel.send({ embeds: [autoPunishEmbed] }); // Avisa no canal onde o comando foi usado

        // (Opcional) Pode enviar um log adicional para o canal de logs
      }
    } catch (error) {
      console.error('Erro ao executar o /warn:', error);
      await interaction.reply({
        content: 'Ocorreu um erro ao tentar aplicar a advertência.',
        flags: [MessageFlags.Ephemeral],
      });
    }
  },
};
