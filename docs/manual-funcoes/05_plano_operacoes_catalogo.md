# Catálogo: Aba "Plano de Operações"

Este documento lista elementos-chave da aba e suas funções relacionadas.

| Elemento                          | Seletor               | Presente no index.html | Propósito                                | Funções Relacionadas                                                        |
| --------------------------------- | --------------------- | ---------------------: | ---------------------------------------- | --------------------------------------------------------------------------- |
| Capital Inicial                   | `#capital-inicial`    |                    Sim | Valor inicial da sessão                  | events.handleNewSession, logic.startNewSession, ui.atualizarDashboardSessao |
| Percentual de Entrada             | `#percentual-entrada` |                    Sim | Percentual do capital por operação       | logic.calculateTradingPlan, TradingOperationsManager.calculateTradingPlan   |
| Stop Win (%)                      | `#stop-win-perc`      |                    Sim | Meta de ganho em %                       | logic.verificarMetas, ui.atualizarDashboardSessao                           |
| Stop Loss (%)                     | `#stop-loss-perc`     |                    Sim | Limite de perda em %                     | logic.verificarMetas, ui.atualizarDashboardSessao                           |
| Botões de Payout                  | `.payout-buttons`     |                    Sim | Seleção de payout                        | sidebar.js (sync payout), ui.atualizarVisualPlano                           |
| Botão WIN (linha do plano)        | `.win-btn-linha`      |                    Não | Registra vitória na etapa correspondente | events.handleWin, logic.finalizarRegistroOperacao                           |
| Botão LOSS (linha do plano)       | `.loss-btn-linha`     |                    Não | Registra derrota na etapa correspondente | events.handleLoss, logic.finalizarRegistroOperacao                          |
| Timeline (Histórico de Operações) | `#timeline-container` |                    Sim | Exibição das operações do dia            | ui.renderizarTimelineCompleta, bloqueador-zeramento-timeline                |
| Botão Nova Sessão                 | `#new-session-btn`    |                    Sim | Inicia nova sessão                       | events.handleNewSession, logic.startNewSession                              |
| Botão Finalizar Sessão            | `#finish-session-btn` |                    Sim | Finaliza sessão ativa                    | events.handleFinishSession, logic.resetSessionState                         |

Observações:

- A coluna "Presente" verifica apenas o index.html atual (heurístico).
- Event handlers detalhados: ver `events.js`, `logic.js`, `ui.js`.
