const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

// Variável para guardar a nossa conexão com o banco de dados
let db;

// Função assíncrona para conectar ao banco de dados e criar a tabela se ela não existir
const initializeDatabase = async () => {
  try {
    // Abre (ou cria, se não existir) o arquivo do banco de dados
    db = await open({
      filename: path.join(__dirname, '..', 'delegado_bira_db.sqlite'), // O '..' volta uma pasta para a raiz do projeto
      driver: sqlite3.Database,
    });

    console.log('[Banco de Dados] Conectado ao arquivo SQLite com sucesso.');

    // Cria a tabela de usuários se ela ainda não existir
    // Esta tabela guardará o progresso de cada membro
    await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                userId TEXT PRIMARY KEY,
                guildId TEXT NOT NULL,
                xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1
            )
        `);

    console.log('[Banco de Dados] Tabela "users" verificada e pronta para uso.');
  } catch (error) {
    console.error('[Banco de Dados] Erro ao inicializar o banco de dados:', error);
  }
};

// Função para pegar as informações de um usuário no banco de dados
const getUser = async (userId, guildId) => {
  if (!db) await initializeDatabase(); // Garante que o DB está conectado
  return await db.get('SELECT * FROM users WHERE userId = ? AND guildId = ?', [userId, guildId]);
};

// Função para criar ou atualizar as informações de um usuário
const updateUser = async (userId, guildId, xp, level) => {
  if (!db) await initializeDatabase();

  // O comando 'INSERT OR REPLACE' é muito útil:
  // Se o usuário não existe, ele cria. Se já existe, ele atualiza.
  await db.run('INSERT OR REPLACE INTO users (userId, guildId, xp, level) VALUES (?, ?, ?, ?)', [
    userId,
    guildId,
    xp,
    level,
  ]);
};

// Função para pegar o ranking (leaderboard)
const getLeaderboard = async (guildId, limit = 10) => {
  if (!db) await initializeDatabase();
  return await db.all(
    'SELECT userId, xp, level FROM users WHERE guildId = ? ORDER BY xp DESC LIMIT ?',
    [guildId, limit]
  );
};

// Exportamos as funções para que outros arquivos possam usá-las
module.exports = {
  initializeDatabase,
  getUser,
  updateUser,
  getLeaderboard,
};
