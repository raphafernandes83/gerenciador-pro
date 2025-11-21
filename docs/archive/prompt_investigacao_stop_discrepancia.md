# 🔍 PROMPT DE INVESTIGAÇÃO - DISCREPÂNCIA STOP WIN/LOSS

## 🎯 PROBLEMA IDENTIFICADO

**Discrepância entre configurações e exibição:**
- **Configuração Stop Win**: 30%
- **Exibição no Card**: 10.0%
- **Configuração Stop Loss**: 15%
- **Exibição no Card**: 15.0%

## 📋 INVESTIGAÇÃO NECESSÁRIA

### 1. **ANÁLISE DE FLUXO DE DADOS**
- Verificar como os valores de Stop Win/Loss são capturados das configurações
- Rastrear o caminho dos dados desde a configuração até a exibição
- Identificar onde pode estar ocorrendo a transformação/perda de dados

### 2. **PONTOS DE VERIFICAÇÃO**
- **Captura de Configuração**: Como `window.config` ou similar captura os valores
- **Processamento de Dados**: Transformações aplicadas aos valores
- **Cálculos Intermediários**: Se há conversões ou normalizações
- **Renderização Final**: Como os valores chegam ao DOM

### 3. **ARQUIVOS A INVESTIGAR**
- `progress-card/business/calculator.js` - Cálculos de metas
- `progress-card/business/logic.js` - Lógica de determinação de valores
- `progress-card/ui/renderer.js` - Renderização dos valores
- `progress-card/ui/updater.js` - Orquestração de atualizações
- `progress-card/utils/monetary.js` - Cálculos monetários
- `charts.js` - Se há processamento no gráfico

### 4. **CENÁRIOS POSSÍVEIS**
- **Conversão de Unidade**: Valores sendo convertidos de % para decimal
- **Fonte de Dados Incorreta**: Card lendo de fonte diferente das configurações
- **Cache Desatualizado**: Valores antigos sendo mantidos em cache
- **Cálculo Incorreto**: Lógica de cálculo com erro
- **Mapeamento Errado**: Campos sendo mapeados incorretamente

### 5. **TESTES A EXECUTAR**
- Verificar `window.config` vs valores exibidos
- Rastrear fluxo de dados step-by-step
- Testar com diferentes valores de configuração
- Verificar se problema persiste após refresh
- Validar se outros campos têm o mesmo problema

## 🎯 OBJETIVO DA INVESTIGAÇÃO

Identificar exatamente onde e por que os valores de Stop Win estão sendo alterados de 30% para 10%, mantendo o Stop Loss correto em 15%.

## 📊 RESULTADO ESPERADO

- Localização precisa do problema
- Correção da discrepância
- Validação de que outros valores não são afetados
- Documentação da causa raiz para evitar reincidência




