# 🤖 Delegado Bira - v2.0

Bot multifuncional para o servidor "Terreiro do Pai Alípio".

---

## 🛡️ Comandos de Moderação

- `/kick`, `/ban`, `/timeout`, `/clear`: Ações de punição básicas.
- `/untimeout`, `/unban`: Ações para remover punições (unban via votação da staff).
- `/warn`: Aplica uma advertência a um membro.
- `/warnings`: Mostra o histórico de advertências de um membro.
- `/report`: Permite que qualquer membro envie uma denúncia confidencial para a moderação.
- `/enviar-regas`, `/painel-comandos`: Comandos de ADM para postar mensagens oficiais.

---

## ⚙️ Comandos de Utilidade

- `/ajuda`: Menu interativo com a lista de todos os comandos públicos.
- `/userinfo`: Mostra a "ficha" de um membro.
- `/serverinfo`: Mostra as estatísticas do servidor.
- `/rank`: Gera um cartão visual com o nível e XP do membro.
- `/leaderboard`: Mostra o ranking dos membros mais ativos.
- `/sortear`: Sorteia um número.

---

## 🎉 Comandos de Diversão e Interação

- `/gado`, `/moeda`, `/comedia`, `/abraçar`: Comandos de interação social.
- `/prender`, `/filosofo`, `/tweet`: Comandos que geram imagens customizadas.

---

## 🤖 Sistemas Automáticos e Personalidade

- **Anunciante da Twitch:** Anuncia no Discord quando a live na Twitch começa.
- **Sistema de XP & Cargos por Nível:** Membros ganham XP ao conversar e recebem cargos automaticamente ao atingir certos níveis.
- **Mural de Destaques (Starboard):** Imortaliza mensagens que recebem muitas reações ⭐.
- **Automoderação com Supervisão Humana:**
  - Detecta e alerta a moderação sobre: palavras proibidas (com e sem contexto), spam de menções e CAPS, e links de convite.
- **Listener de Palavras-Chave:** O Bira reage e responde a gírias e frases específicas no chat.
- **Status Dinâmico:** A atividade do bot muda periodicamente.
- **Portão de Verificação:** Novos membros precisam aceitar as regras clicando em um botão para ganhar acesso ao servidor.

---

## 🚀 Setup

- Configurar os arquivos `.env`, `automodConfig.json` e `levelRolesConfig.json`.
- Rodar `npm install`.
- Rodar `node deploy-commands.js` para registrar os comandos.
