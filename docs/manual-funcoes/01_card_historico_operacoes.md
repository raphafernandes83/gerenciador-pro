# Função: Card "Histórico de Operações"

Objetivo: exibir a linha do tempo das operações do dia, mantendo consistência
com `state.historicoCombinado` e evitando zeramentos.

Principais atores

- State: `window.state.historicoCombinado`, `state.isSessionActive`
- UI: `ui.renderizarTimelineCompleta(historico, container)`,
  `ui.adicionarItemTimeline(op)`
- TM: `TradingOperationsManager._updateAllUI()`
- Lógica: `logic.finalizarRegistroOperacao()`, `logic.editOperation()`,
  `logic.reprocessarHistorico()`
- Defesa: `bloqueador-zeramento-timeline.js`, `investigador-dados-invalidos.js`

Fluxo de chamadas (alto nível)

```mermaid
flowchart TD
  A[logic.finalizarRegistroOperacao] --> B[Atualiza state.historicoCombinado]
  B --> C[TradingOperationsManager._syncStateFromLegacy]
  C --> D[ui.atualizarTudo/_atualizarTudoInterno]
  D --> E[ui.renderizarTimelineCompleta(historico)]
  E --> F[ui.adicionarItemTimeline(op)]
```

Entradas e saídas

- Entrada: array de operações (`historico`) onde cada item deve conter `valor`
  (ou fallback `resultado`), `isWin`, `entrada`, `timestamp`, `id`.
- Saída: DOM atualizado em `#timeline-container` com itens da timeline.

Pontos de falha comuns e mitigação

- Histórico vazio durante sessão ativa → mitigado por
  `bloqueador-zeramento-timeline` (restaura último válido)
- `op.valor` undefined → `adicionarItemTimeline` usa fallback `op.resultado`;
  investigador corrige
- Reset indevido durante sessão → guarda em `events` + bloqueador permitem
  apenas finalização

Checklist de diagnóstico rápido

- `state.historicoCombinado.length` > 0?
- `historico.map(op => op.valor ?? op.resultado)` todos números?
- `bloqueadorZeramento.obterRelatorio()` → `resetAttempts` sem bloqueios
  recentes indevidos?

Referências

- `ui.js`: `renderizarTimelineCompleta`, `adicionarItemTimeline`
- `logic.js`: `_createOperationObject`, `_processPostOperation`, `editOperation`
- `bloqueador-zeramento-timeline.js`
- `investigador-dados-invalidos.js`
