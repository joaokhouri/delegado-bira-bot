const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path'); // Importa o 'path' para lidar com os caminhos de arquivo
require('dotenv').config();

const commands = [];
// Constrói o caminho para a pasta 'commands'
const commandsPath = path.join(__dirname, 'commands');
// Lê os nomes das subpastas (ex: 'moderacao', 'utilidade')
const commandFolders = fs.readdirSync(commandsPath);

// Loop para entrar em cada subpasta
for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.js'));

  // Loop para ler cada arquivo dentro da subpasta
  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = require(filePath);

    // Adiciona a propriedade 'data' do comando ao array que será registrado
    if ('data' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(
        `[AVISO] O comando em ${filePath} não tem a propriedade "data" para ser registrado.`
      );
    }
  }
}

// O resto do código continua igual...

// Constrói e prepara uma instância do módulo REST
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// E finalmente, registra os comandos!
(async () => {
  try {
    console.log(`Iniciando o registro de ${commands.length} comandos de barra (/).`);

    // O método 'put' registra todos os comandos no servidor (guild)
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log(`Sucesso! ${data.length} comandos de barra (/) foram registrados.`);
  } catch (error) {
    console.error(error);
  }
})();
