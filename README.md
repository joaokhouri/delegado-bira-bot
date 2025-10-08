# 🤖 Delegado Bira - Bot para Discord (v1.6)

Este é o Delegado Bira, um bot de moderação, utilidade e engajamento para a comunidade "Terreiro do Pai Alípio", com uma personalidade única de "guardinha gente fina" e informal.

## ✨ Funcionalidades Principais

### 🛡️ Moderação e Segurança

- **Kit de Punição Completo:** `/kick`, `/ban`, `/timeout`, `/clear`.
- **Sistema de Perdão Avançado:** `/unban` com votação da equipe e `/untimeout`.
- **Logs e Relatórios:** Logs detalhados para todas as ações de moderação.
- **Automoderação com Supervisão Humana:** O Bira patrulha o chat e alerta a moderação sobre:
  - Palavras Proibidas (com e sem contexto).
  - Spam de Menções e CAPS LOCK.
  - Links de Convite.
  - Os alertas vêm com botões para ação rápida dos moderadores.

### 🏆 Engajamento da Comunidade

- **Sistema de XP/Níveis:** Membros ganham XP ao conversar, com progresso salvo em banco de dados.
- **Comandos de Ranking:** `/rank` com cartão visual e `/leaderboard` com o Top 10.
- **Anunciante da Twitch:** Anuncia automaticamente no Discord quando a live começa.
- **Mural de Destaques (Starboard):** Imortaliza as melhores mensagens do servidor, votadas pela comunidade com o emoji ⭐.

### 🎨 Interação e Diversão

- **Manipulação de Imagem:** Comandos como `/prender`, `/filosofo` e `/tweet`.
- **Comandos Simples:** Ferramentas como `/gado` e `/moeda`.
- **Personalidade Reativa:** Responde a palavras-chave com respostas aleatórias ou reações.
- **Status Dinâmico:** A atividade do bot muda periodicamente.

### ⚙️ Utilidade

- **Manual de Operações:** Comando `/ajuda` interativo por categorias.
- **Consulta de Ficha:** `/userinfo` e `/serverinfo`.

## ⚙️ Configuração

Para rodar o bot, é necessário um arquivo `.env` e um `automodConfig.json`. Após a configuração, rode `npm install` e `node deploy-commands.js`.
