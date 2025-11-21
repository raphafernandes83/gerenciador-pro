# Fluxo de Sessões (Nova/Finalizar)

Objetivo: descrever como iniciar/encerrar sessões com segurança, evitando resets
indevidos.

Atores

- `events.js`: `handleNewSession`, `quickNewSession`, `startNewSession`,
  `handleFinishSession`
- `logic.js`: `startNewSession(mode)`, `resetSessionState()`
- Guarda: bloqueio de nova sessão durante sessão ativa (salvo
  `__forceNewSession`)
- Flags: `window.__finishingSession`, `window.__suppressPersistedTimeline`

Fluxos

```mermaid
sequenceDiagram
  participant EV as events
  participant LG as logic
  participant UI as ui

  Note over EV: Início de nova sessão (auto)
  EV->>EV: checar guarda (isSessionActive && !force) → aborta
  EV->>LG: startNewSession(mode)
  LG-->>LG: resetSessionState() (permitido pois inativa)
  LG-->>LG: state.isSessionActive = true; calcularPlano()
  EV->>UI: syncUIFromState/atualizarTudo

  Note over EV: Finalizar sessão
  EV-->>EV: __finishingSession = true; __suppressPersistedTimeline = true
  EV->>LG: resetSessionState() (permitido)
  EV->>UI: syncUIFromState/visibilidadeBotoes
  EV-->>EV: __finishingSession = false; __suppressPersistedTimeline = false
```

Pontos de falha e mitigação

- Reset durante sessão ativa: guarda em `events` + bloqueador (somente
  finalização permite)
- Timeline não limpar ao finalizar: flags e limpeza explícita
- Sessão não ativar no início: `events.handleNewSession({auto:true})` chama
  `logic.startNewSession` + sync UI

Checklist

- `state.isSessionActive` verdadeiro após start; falso após finish
- `historicoCombinado` ajustado conforme fluxo
- Sem resets bloqueados indevidos no relatório do bloqueador
