# Instruções para IA: Catalogação e Registro Contínuo

Objetivo

- Manter documentação viva dos fluxos críticos, elementos da UI e funções do app
  para consulta rápida e debugging forense.
- Gerar e atualizar catálogos automatizados sem alterar o código de produção.

Escopo de Documentação

- Fluxos críticos (um arquivo por fluxo) em `docs/manual-funcoes/`:
    - 01_card_historico_operacoes.md
    - 02_fluxo_botao_win.md
    - 03_renderizacao_graficos.md
    - 04_fluxo_sessoes.md
    - 05_plano_operacoes_catalogo.md (gerado automaticamente)
- Índice/Mapa de funções: `index.json` e `index.md` (gerados)

Ferramentas Disponíveis

- Gerar índice de funções e usos (heurístico):
    - Comando: `node tools/doc-index.js`
    - Saída: `docs/manual-funcoes/index.json` (máquina) e `index.md` (humano)
- Catalogar elementos da aba Plano de Operações:
    - Comando: `node tools/generate-plan-tab-doc.js`
    - Saída: `docs/manual-funcoes/05_plano_operacoes_catalogo.md`

Padrões e Convenções

- Um fluxo por arquivo, nomeado com prefixo numérico para ordenação.
- Descrever sempre: objetivo, atores, sequência (Mermaid), entradas/saídas,
  pontos de falha e mitigação, checklist e referências (arquivo/ função).
- Citar funções com caminho/nome completo quando possível (ex.:
  `ui.renderizarTimelineCompleta`).
- Evitar referência a código experimental removido; registrar somente estados
  correntes.

Modelo de Manual (copiar/colar)

````
# [Título do Fluxo]

Objetivo: [o que resolve]

Atores
- [módulo/arquivo]: [funções]

Sequência (alto nível)
```mermaid
[diagrama]
````

Entradas e saídas

- Entrada: [...]
- Saída: [...]

Pontos de falha e mitigação

- [risco] → [como detectar/mitigar]

Checklist

- [itens verificáveis]

Referências

- [arquivos e funções]

```

Procedimento de Atualização (cada PR ou correção relevante)
1) Rodar geradores:
   - `node tools/doc-index.js`
   - `node tools/generate-plan-tab-doc.js`
2) Verificar diffs em `docs/manual-funcoes/` e ajustar textos dos manuais afetados.
3) Se novas funções/fluxos foram criados, adicionar novo arquivo seguindo o modelo.
4) Conferir que o Mermaid dos diagramas está válido (pré-visualize se possível).

Boas Práticas
- Não duplicar informação: referenciar manuais existentes.
- Manter linguagem clara, focada em diagnóstico rápido.
- Documentar flags/guardas globais relevantes (ex.: `__finishingSession`, `__suppressPersistedTimeline`, `__forceNewSession`).
- Registrar heurísticas/ fallback (ex.: `op.valor` vs `op.resultado`).

Critérios de Conclusão por Fluxo
- Fluxo mapeado de ponta a ponta (entrada do usuário → atualização da UI/estado).
- Pontos de falha listados com instruções de verificação.
- Checklists acionáveis.

Como Decidir o que Documentar
- Priorizar: áreas de maior incidência de bugs, alto impacto na UI (timeline, sessões, gráficos, eventos Win/Loss), integrações (DB/Cache/IndexedDB), guardas/bloqueadores.

Anotações Importantes do Sistema Atual
- Reset de sessão: permitido apenas em finalização (`__finishingSession=true`), bloqueado no meio da sessão (guarda + bloqueador).
- Timeline: usa `state.historicoCombinado`; fallback para `resultado` quando `valor` ausente; bloqueador evita zeramento.
- Sessões: `events.handleNewSession({auto:true})` inicia e sincroniza UI.
- Gráficos: atualizados via `ui.updateProgressChartsUI()` → `charts.js` com validação/performance logs.

Validação Rápida (antes de encerrar a atualização)
- `node tools/doc-index.js` gerou com sucesso?
- `node tools/generate-plan-tab-doc.js` gerou com sucesso?
- Manuais atualizados refletem as mudanças do código?

Contato entre Módulos (resumo)
- events.js ↔ logic.js ↔ TradingOperationsManager ↔ ui.js ↔ charts.js
- Defesas: bloqueador-zeramento-timeline.js, investigador-dados-invalidos.js

Notas Finais
- Este guia destina-se a qualquer IA ou humano continuar a documentação sem conhecimento prévio do histórico. Priorize consistência e rastreabilidade.
```
