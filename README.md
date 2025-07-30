# 🤖 Delegado Bira - Bot de Moderação para Discord

Este é o Delegado Bira, um bot de moderação e entretenimento para a comunidade da minha stream.

## ✨ Funcionalidades Principais

- Sistema de Moderação Completo (`/kick`, `/ban`, `/timeout`, `/clear`)
- Sistema de Revisão de Bans com Votação
- Logs automáticos de ações de moderação e mensagens apagadas/editadas.
- Comandos de Utilidade (`/userinfo`, `/serverinfo`, `/ajuda`)
- Comandos de Diversão (`/gado`)
- Listener de palavras-chave para interação.

## ⚙️ Configuração

Para rodar este bot, você precisará criar um arquivo `.env` na raiz do projeto com as seguintes variáveis:

- `TOKEN`
- `CLIENT_ID`
- `GUILD_ID`
- `WELCOME_CHANNEL_ID`
- `MOD_LOG_CHANNEL_ID`
- `BAN_REVIEW_CHANNEL_ID`
- `VOTES_REQUIRED_FOR_UNBAN`

Depois, rode `npm install` para instalar as dependências e `node deploy-commands.js` para registrar os comandos.
