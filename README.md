# 🤖 Delegado Bira - Bot para Discord (v1.1)

Este é o Delegado Bira, um bot de moderação, utilidade e entretenimento para a comunidade "Terreiro do Pai Alípio", com uma personalidade única de "guardinha gente fina".

## ✨ Funcionalidades Principais

### 🛡️ Moderação Completa
- **Kit de Punição:** `/kick`, `/ban`, `/timeout` e `/clear`.
- **Sistema de Perdão:** `/unban` com um sistema de votação para a equipe de moderação.
- **Ferramentas Administrativas:** `/enviar-regras` para postar um Código de Conduta customizável.

### 📜 Logs e Relatórios
- **Vigilância Total:** Logs automáticos e detalhados para mensagens apagadas e editadas.
- **Transparência:** Integração dos logs com os comandos de moderação, registrando quem puniu, quem foi punido e o motivo.

### ⚙️ Utilidade e Interação
- **Manual de Operações:** Um comando `/ajuda` interativo com um menu de seleção por categorias.
- **Consulta de Ficha:** `/userinfo` para ver informações detalhadas sobre qualquer membro.
- **Comandos de Diversão:** Ferramentas para a comunidade interagir, como o `/gado`.

### 📡 Integrações Externas
- **Anunciante da Twitch:** Um sistema que monitora o status de uma live na Twitch e anuncia automaticamente no Discord quando o streamer fica online.

### 🗣️ Personalidade Reativa
- **Listener de Palavras-Chave:** O bot reage a palavras específicas no chat, com um sistema organizado para respostas de texto, respostas aleatórias e reações com emojis.
- **Status Dinâmico:** A atividade do bot no Discord muda periodicamente para dar mais vida e personalidade ao personagem.

## ⚙️ Configuração
Para rodar este bot, você precisará criar um arquivo `.env` na raiz do projeto com as seguintes variáveis:

- `TOKEN` (Token do bot do Discord)
- `CLIENT_ID` (ID do bot do Discord)
- `GUILD_ID` (ID do seu servidor do Discord)
- `WELCOME_CHANNEL_ID` (ID do canal de boas-vindas)
- `MOD_LOG_CHANNEL_ID` (ID do canal de logs da moderação)
- `BAN_REVIEW_CHANNEL_ID` (ID do canal para votação de unban)
- `VOTES_REQUIRED_FOR_UNBAN` (Número de votos para aprovar um unban)
- `TWITCH_CLIENT_ID` (Client ID da sua aplicação da Twitch)
- `TWITCH_CLIENT_SECRET` (Client Secret da sua aplicação da Twitch)
- `TWITCH_USERNAME` (Seu nome de usuário da Twitch em minúsculas)
- `ANNOUNCEMENT_CHANNEL_ID` (ID do canal para os anúncios da Twitch)

Após configurar o `.env`, rode `npm install` para instalar as dependências e `node deploy-commands.js` para registrar/atualizar os comandos de barra (/).
