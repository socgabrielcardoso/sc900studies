# SC-900 • Security Academy 🛡️

Plataforma de microaprendizagem gamificada para **Microsoft Security, Compliance and Identity Fundamentals (SC-900)**.

## Jornada
- **30 dias, 90 fases** (Reconhecimento, Implementação e Resposta);
- fundamentos, Microsoft Entra, Azure Security, Microsoft Defender XDR, Sentinel e Purview;
- desafios por cenário, conectar pares, corrigir a brecha e chefões cronometrados;
- XP, SecCoins, ofensivas diárias, bloqueio de ofensiva, vidas, skins e conquistas;
- repetição espaçada personalizada e caderno com memória dos erros;
- interface responsiva com animações e opção de reduzir movimento.

## Privacidade
O MVP usa **localStorage no dispositivo**, sem login e sem enviar suas respostas a servidores. Dados **não sincronizam entre dispositivos** e podem ser perdidos ao limpar o navegador. Exporte um backup JSON em `Meu progresso` regularmente.

## Conteúdo
Baseado nos objetivos do Microsoft Learn, incluindo mudanças em 21/10/2026:
https://learn.microsoft.com/pt-br/credentials/certifications/resources/study-guides/sc-900

Projeto independente, não afiliado à Microsoft. Perguntas autorais de treino; não são itens oficiais. Uma pontuação interna não equivale à nota escalonada de certificação.

## Execução local
Site estático: abra `index.html` via servidor HTTP (por exemplo `python3 -m http.server 8000`). Hospedagem: Vercel, preset Other / no build, output raiz.

## Estrutura
- `index.html` marcação acessível
- `styles.css` design responsivo
- `content.js` objetivos, conteúdo, cronograma
- `app.js` persistência, jogos, gamificação e análises
