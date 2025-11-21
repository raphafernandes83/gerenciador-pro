# Manual Técnico de Funções e Fluxos

Este diretório contém manuais independentes, focados por fluxo crítico do app.
Cada manual explica: objetivo, entradas/saídas, funções envolvidas, ordem das
chamadas, dados trafegados e pontos de falha comuns, com gráficos de chamada
(Mermaid).

Arquivos principais:

- 01_card_historico_operacoes.md
- 02_fluxo_botao_win.md
- 03_renderizacao_graficos.md
- 04_fluxo_sessoes.md

Índice automatizado (opcional):

- Gere um índice de funções e referências com:

```
node tools/doc-index.js
```

- Saída: `docs/manual-funcoes/index.json` (mapa consultável) e
  `docs/manual-funcoes/index.md` (sumário legível).

Convenções:

- Nomes de funções sempre citados com o caminho do arquivo quando relevante
  (ex.: `ui.renderizarTimelineCompleta`).
- Fluxos usam Mermaid (pode colar o bloco em um visualizador Mermaid para
  diagrama).
