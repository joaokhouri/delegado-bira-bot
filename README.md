# 🤖 Delegado Bira - Bot para Discord (v2.1)

Bot multifuncional para o servidor "Terreiro do Pai Alípio", com uma personalidade única de "guardinha gente fina" e informal.

---

## ✨ Funcionalidades Principais

### 🛡️ Moderação e Segurança

- **Kit de Punição Completo:** `/kick`, `/ban`, `/timeout`, `/clear`.
- **Sistema de Perdão Avançado:** `/unban` com votação da staff e `/untimeout`.
- **Sistema de Advertências:** `/warn` para aplicar advertências e `/warnings` para consultar o histórico de um membro.
- **Sistema de Denúncias:** `/report` permite que qualquer membro envie uma denúncia confidencial para a moderação.
- **Logs e Relatórios:** Logs detalhados para todas as ações de moderação (incluindo DMs para os punidos), mensagens apagadas e editadas, e saídas de membros.
- **Automoderação com Supervisão Humana:** O Bira patrulha o chat e alerta a moderação sobre:
  - Palavras Proibidas (com e sem contexto).
  - Spam de Menções e CAPS LOCK (com memória).
  - Links de Convite.

### 🏆 Engajamento da Comunidade

- **Sistema de XP & Cargos por Nível:** Membros ganham XP ao conversar e recebem cargos de "patente" automaticamente ao atingir certos níveis.
- **Comandos de Ranking:** `/rank` com um cartão visual profissional e dinâmico, e `/leaderboard` com o Top 10.
- **Anunciante da Twitch:** Anuncia automaticamente no Discord quando a live começa.
- **Mural de Destaques (Starboard):** Imortaliza as melhores mensagens do servidor, votadas pela comunidade.
- **Caixa de Sugestões:** O comando `/sugestao` permite que membros enviem ideias anonimamente para votação.

### 🎨 Interação e Diversão

- **Manipulação de Imagem:** Comandos que geram imagens customizadas como `/prender`, `/filosofo` e `/tweet`.
- **Comandos Sociais:** Ferramentas de interação como `/gado`, `/moeda`, `/abraçar` e `/comedia`.
- **Personalidade Reativa:** Responde a dezenas de gírias e frases específicas no chat com respostas aleatórias ou reações.
- **Status Dinâmico:** A atividade do bot muda periodicamente para dar mais vida ao personagem.

### ⚙️ Utilidade & Servidor

- **Manual de Operações:** Comando `/ajuda` interativo e filtrado por permissão.
- **Consulta de Ficha:** `/userinfo` e `/serverinfo`.
- **Comandos Administrativos:** `/enviar-regras` e `/painel-comandos`.
- **Portão de Verificação:** Novos membros precisam aceitar as regras clicando em um botão para ganhar acesso ao servidor.

---

## 🚀 Setup

- Configurar os arquivos `.env`, `automodConfig.json` e `levelRolesConfig.json`.
- Rodar `npm install` para instalar as dependências.
- Rodar `node deploy-commands.js` para registrar/atualizar os comandos de barra (/).
