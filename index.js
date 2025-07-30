// Importa as classes necessárias e o 'fs' para ler arquivos
require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env
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
} = require('discord.js');

// Pega o token do seu arquivo de configuração (se tiver, senão, coloque o token aqui)
// const { token } = require('./config.json');
const TOKEN = process.env.TOKEN;
const PREFIX = '!';

// Cria a instância do bot com as permissões (Intents)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// =================================================================
// COMMAND HANDLER (VERSÃO ATUALIZADA PARA LER SUBPASTAS)
// =================================================================

// Importa os módulos 'path' e 'fs' no topo do seu index.js, junto com os outros 'require'
const path = require('path');

client.commands = new Collection(); // A coleção de comandos continua a mesma

// Constrói o caminho para a pasta 'commands' de forma segura
const commandsPath = path.join(__dirname, 'commands');
// Lê o nome de todas as subpastas dentro de 'commands'
const commandFolders = fs.readdirSync(commandsPath);

// Loop para entrar em cada subpasta (ex: 'moderacao', 'utilidade')
for (const folder of commandFolders) {
  // Constrói o caminho para a subpasta atual
  const folderPath = path.join(commandsPath, folder);
  // Lê todos os arquivos .js que estão DENTRO da subpasta atual
  const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.js'));

  // Loop para carregar cada arquivo de comando
  for (const file of commandFiles) {
    // Constrói o caminho completo para o arquivo de comando
    const filePath = path.join(folderPath, file);
    const command = require(filePath);

    // Verifica se o comando tem 'data' e 'execute' e o adiciona à coleção
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      // Atualizei o log para mostrar de qual pasta o comando veio!
      console.log(`[Comando Carregado] /${command.data.name} (da pasta: ${folder})`);
    } else {
      console.log(
        `[AVISO] O comando em ${filePath} está faltando a propriedade "data" ou "execute".`
      );
    }
  }
}

// =================================================================
// EVENT HANDLER (O ORGANIZADOR DA GAVETA DE EVENTOS)
// =================================================================
const eventFiles = fs.readdirSync('./events').filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    // Se o evento for para rodar só uma vez (como o 'ready')
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    // Para eventos que podem rodar várias vezes (como 'messageCreate')
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  console.log(`[Evento Carregado] ${event.name}.js`);
}

// =================================================================
// LÓGICA PRINCIPAL UNIFICADA PARA INTERAÇÕES
// =================================================================
client.on('interactionCreate', async (interaction) => {
  // Bloco único para tratar COMANDOS DE BARRA
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`Nenhum comando correspondendo a ${interaction.commandName} foi encontrado.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Erro ao executar o comando ${interaction.commandName}:`, error);

      // Lógica de diagnóstico de erros que já criamos
      if (error.code === 10013) {
        // Unknown User
        await interaction.reply({
          content:
            '🕵️‍♂️ **Usuário não encontrado.** Verifique se o ID está correto ou se o membro já foi desbanido.',
          flags: [MessageFlags.Ephemeral],
        });
      } else {
        // Para todos os outros erros, usamos a mensagem genérica
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: 'Ocorreu um erro inesperado ao processar o comando!',
            flags: [MessageFlags.Ephemeral],
          });
        } else {
          await interaction.reply({
            content: 'Ocorreu um erro inesperado ao processar o comando!',
            flags: [MessageFlags.Ephemeral],
          });
        }
      }
    }
    return; // Retorna para garantir que não prossiga para a lógica de botões
  }

  // Bloco único para tratar BOTÕES
  if (interaction.isButton()) {
    const [action, type, userId] = interaction.customId.split('-');

    if (type !== 'unban') return;

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return interaction.reply({
        content: 'Você não tem permissão para votar nesta revisão.',
        flags: [MessageFlags.Ephemeral],
      });
    }

    const originalMessage = interaction.message;
    const originalEmbed = originalMessage.embeds[0];
    const editedEmbed = EmbedBuilder.from(originalEmbed);
    let votersField = editedEmbed.data.fields.find((field) => field.name === 'Votos para Aprovar');
    let currentVoters = votersField.value.split('\n').filter((v) => v !== 'Nenhum');

    if (currentVoters.includes(interaction.user.tag)) {
      return interaction.reply({
        content: 'Você já registrou seu voto nesta revisão.',
        flags: [MessageFlags.Ephemeral],
      });
    }

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
});

// =======================================================
// CINTO DE SEGURANÇA CONTRA CRASHES
// =======================================================
process.on('unhandledRejection', (error) => {
  console.error('🚨 Erro não tratado (Unhandled Rejection):', error);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Erro não tratado (Uncaught Exception):', error);
});

// Faz o login do bot
client.login(TOKEN);
