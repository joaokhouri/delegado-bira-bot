// Importa as classes necessárias e o 'fs' para ler arquivos
require('dotenv').config();
const fs = require('fs');
const {
  Client,
  GatewayIntentBits,
  Collection,
  MessageFlags,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder, // Garante que StringSelectMenuBuilder está aqui
} = require('discord.js');
const { initializeTwitchNotifier } = require('./utils/twitchNotifier');
const categoryNames = require('./utils/commandCategories');
const { initializeDatabase } = require('./utils/database');

const path = require('path');

const TOKEN = process.env.TOKEN;

// Cria a instância do bot com as permissões (Intents)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// =================================================================
// HANDLERS (Comandos e Eventos do Discord)
// =================================================================
// Command Handler
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);
for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      command.category = folder;
      client.commands.set(command.data.name, command);
      console.log(`[Comando Carregado] /${command.data.name} (da pasta: ${folder})`);
    } else {
      console.log(
        `[AVISO] O comando em ${filePath} está faltando a propriedade "data" ou "execute".`
      );
    }
  }
}
// Event Handler
const eventFiles = fs.readdirSync('./events').filter((file) => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  console.log(`[Evento Carregado] ${event.name}.js`);
}

// =================================================================
// LÓGICA PRINCIPAL UNIFICADA PARA INTERAÇÕES
// =================================================================
client.on('interactionCreate', async (interaction) => {
  // --- LIDA COM COMANDOS DE BARRA ---
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Erro ao executar o comando ${interaction.commandName}:`, error);
      const errorMessage = 'Ocorreu um erro inesperado ao processar o comando!';
      if (error.code === 10013) {
        errorMessage =
          '🕵️‍♂️ **Usuário não encontrado.** Verifique se o ID está correto ou se o membro já foi desbanido.';
      }
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, flags: [MessageFlags.Ephemeral] });
      } else {
        await interaction.reply({ content: errorMessage, flags: [MessageFlags.Ephemeral] });
      }
    }
    return;
  }

  // --- LIDA COM MENUS DE SELEÇÃO ---
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'ajuda-menu') {
      const selectedCategory = interaction.values[0];
      const commands = interaction.client.commands;
      const commandsInCategory = commands.filter((cmd) => cmd.category === selectedCategory);
      const prettyCategoryName =
        categoryNames[selectedCategory] ||
        selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
      const categoryEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Categoria: ${prettyCategoryName}`)
        .setDescription(
          commandsInCategory
            .map((cmd) => `\`/${cmd.data.name}\`: ${cmd.data.description}`)
            .join('\n')
        );
      await interaction.update({ embeds: [categoryEmbed] });
    }
    return;
  }

  // --- LIDA COM BOTÕES ---
  if (interaction.isButton()) {
    const customId = interaction.customId;

    // Lógica para botões de música
    if (customId.startsWith('music_')) {
      const queue = interaction.client.distube.getQueue(interaction.guildId);
      if (!queue)
        return interaction.reply({
          content: 'A playlist do Bira já terminou.',
          flags: [MessageFlags.Ephemeral],
        });
      if (
        !interaction.member.voice.channel ||
        interaction.member.voice.channel.id !== queue.voiceChannel.id
      ) {
        return interaction.reply({
          content: 'Você precisa estar no mesmo canal de voz que o Bira para usar os controles!',
          flags: [MessageFlags.Ephemeral],
        });
      }

      switch (customId) {
        case 'music_pause_resume':
          if (queue.paused) {
            queue.resume();
            await interaction.reply({
              content: '▶️ O Bira voltou pro play!',
              flags: [MessageFlags.Ephemeral],
            });
          } else {
            queue.pause();
            await interaction.reply({
              content: '⏸️ O Bira foi tomar um café. Música pausada.',
              flags: [MessageFlags.Ephemeral],
            });
          }
          break;
        case 'music_skip':
          if (queue.songs.length <= 1)
            return interaction.reply({
              content: 'Não há próxima música para pular.',
              flags: [MessageFlags.Ephemeral],
            });
          await queue.skip();
          await interaction.deferUpdate(); // Apenas confirma o clique, o evento 'playSong' fará o resto
          break;
        case 'music_stop':
          await queue.stop();
          await interaction.message.edit({ components: [] }); // Remove os botões da mensagem
          await interaction.reply({
            content: '⏹️ Fim da festa. O Bira limpou a pista e guardou os discos.',
            flags: [MessageFlags.Ephemeral],
          });
          break;
      }
    }

    // Lógica para botões de unban
    if (customId.startsWith('approve-unban') || customId.startsWith('reject-unban')) {
      // (Toda a sua lógica de votação do unban que já fizemos antes continua aqui, sem mudar nada)
      const [action, type, userId] = customId.split('-');
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers))
        return interaction.reply({
          content: 'Você não tem permissão para votar nesta revisão.',
          flags: [MessageFlags.Ephemeral],
        });
      const originalMessage = interaction.message;
      const originalEmbed = originalMessage.embeds[0];
      const editedEmbed = EmbedBuilder.from(originalEmbed);
      let votersField = editedEmbed.data.fields.find(
        (field) => field.name === 'Votos para Aprovar'
      );
      let currentVoters = votersField.value.split('\n').filter((v) => v !== 'Nenhum');
      if (currentVoters.includes(interaction.user.tag))
        return interaction.reply({
          content: 'Você já registrou seu voto nesta revisão.',
          flags: [MessageFlags.Ephemeral],
        });
      if (action === 'approve') {
        currentVoters.push(interaction.user.tag);
        votersField.value = currentVoters.join('\n');
        await originalMessage.edit({ embeds: [editedEmbed] });
        await interaction.reply({
          content: 'Seu voto para **APROVAR** foi registrado.',
          flags: [MessageFlags.Ephemeral],
        });
        const votesRequired = parseInt(process.env.VOTES_REQUIRED_FOR_UNBAN);
        if (currentVoters.length >= votesRequired) {
          try {
            const userToUnban = await interaction.client.users.fetch(userId);
            await interaction.guild.members.unban(userId);
            editedEmbed
              .setColor('#00FF00')
              .setTitle(`✅ APROVADO: Revisão de Banimento para ${userToUnban.tag}`)
              .setFooter({ text: `Decisão finalizada.` });
            const disabledButtons = ActionRowBuilder.from(
              originalMessage.components[0]
            ).setComponents(
              originalMessage.components[0].components.map((button) =>
                ButtonBuilder.from(button).setDisabled(true)
              )
            );
            await originalMessage.edit({ embeds: [editedEmbed], components: [disabledButtons] });
          } catch (error) {
            console.error(error);
            await interaction.channel.send(
              'Houve um erro ao tentar desbanir o usuário após a aprovação.'
            );
          }
        }
      } else if (action === 'reject') {
        editedEmbed
          .setColor('#FF0000')
          .setTitle(`❌ REJEITADO: Revisão de Banimento`)
          .setFooter({ text: `Revisão encerrada por ${interaction.user.tag}.` });
        const disabledButtons = ActionRowBuilder.from(originalMessage.components[0]).setComponents(
          originalMessage.components[0].components.map((button) =>
            ButtonBuilder.from(button).setDisabled(true)
          )
        );
        await originalMessage.edit({ embeds: [editedEmbed], components: [disabledButtons] });
        await interaction.reply({
          content: 'Você votou para **REJEITAR**. A proposta foi encerrada.',
          flags: [MessageFlags.Ephemeral],
        });
      }
    }
  }
});

// =======================================================
// CINTOS DE SEGURANÇA E LOGIN
// =======================================================
process.on('unhandledRejection', (error) => {
  console.error('🚨 Erro não tratado (Unhandled Rejection):', error);
});
process.on('uncaughtException', (error) => {
  console.error('🚨 Erro não tratado (Uncaught Exception):', error);
});

client.login(TOKEN).then(async () => {
  await initializeDatabase();
  initializeTwitchNotifier(client);
});
