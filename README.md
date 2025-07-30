# 🤖 Delegado Bira - Bot para Discord (v1.3)

Este é o Delegado Bira, um bot de moderação, utilidade e engajamento para a comunidade "Terreiro do Pai Alípio", com uma personalidade única de "guardinha gente fina" e informal.

## ✨ Funcionalidades Principais

### 🛡️ Moderação Completa

- **Kit de Punição:** `/kick`, `/ban`, `/timeout`, `/clear`.
- **Sistema de Perdão:** `/unban` com um sistema de votação para a equipe de moderação e `/untimeout` para remover castigos.
- **Ferramentas Administrativas:** `/enviar-regras` para postar um Código de Conduta customizável e com a "voz" do bot.

### 📜 Logs e Relatórios

- **Vigilância Total:** Logs automáticos e detalhados para mensagens apagadas (individuais e em massa) e editadas.
- **Transparência:** Integração dos logs com os comandos de moderação, registrando quem puniu, quem foi punido e o motivo.

### 🏆 Sistema de XP e Níveis

- **Ganho de XP:** Membros ganham XP automaticamente ao enviar mensagens, com um sistema de cooldown para prevenir spam.
- **Carteira de Identificação:** O comando `/rank` gera um cartão visual (usando Canvacord) com o nível, XP e ranking do membro.
- **Quadro de Honra:** O comando `/leaderboard` mostra um ranking com os 10 membros mais ativos do servidor.
- **Persistência de Dados:** Todo o progresso de XP e níveis é salvo em um banco de dados SQLite, sobrevivendo a reinicializações do bot.

### ⚙️ Utilidade e Interação

- **Manual de Operações:** Um comando `/ajuda` interativo com um menu de seleção por categorias.
- **Consulta de Ficha:** `/userinfo` para ver informações sobre um membro e `/serverinfo` para dados sobre o servidor.

### 📡 Integrações e Personalidade

- **Anunciante da Twitch:** Monitora uma live na Twitch e anuncia automaticamente no Discord quando o streamer fica online.
- **Personalidade Reativa:** O bot reage a palavras-chave no chat, com um sistema organizado para respostas de texto, respostas aleatórias e reações com emojis.
- **Status Dinâmico:** A atividade do bot no Discord muda periodicamente para dar mais vida e personalidade ao personagem.

## ⚙️ Configuração

Para rodar este bot, você precisará criar um arquivo `.env` na raiz do projeto com as seguintes variáveis:
_(Lista de variáveis do .env completa)_

Após configurar o `.env`, rode `npm install` para instalar as dependências e `node deploy-commands.js` para registrar/atualizar os comandos de barra (/).
