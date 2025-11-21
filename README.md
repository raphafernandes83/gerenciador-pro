# 📊 Gerenciador de Operações PRO v9.3

> **Sistema completo de gestão de trading com estratégias avançadas, análise
> estatística e interface moderna**

[![Version](https://img.shields.io/badge/version-9.3-blue.svg)](https://github.com/seu-usuario/gerenciador-pro)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-active-success.svg)]()

---

## 🎯 **O que é este Projeto?**

O **Gerenciador de Operações PRO** é uma aplicação web moderna para traders que
oferece:

- **🎲 2 Estratégias de Trading**: Entrada Fixa e Ciclos de Recuperação
- **📊 Análise Estatística Avançada**: Monte Carlo, drawdown, expectativa
  matemática
- **🎨 Interface Moderna**: 4 temas, modo zen, responsivo
- **🎨 Sistema de Personalização de Cores**: Customize TODAS as cores da
  interface
- **☁️ Sincronização em Nuvem**: Integração completa com Supabase
- **🧪 200+ Testes Automatizados**: Cobertura completa de funcionalidades
- **📱 PWA Ready**: Funciona offline e pode ser instalado

---

## 🚀 **Como Rodar o Projeto**

### Pré-requisitos

- **Navegador moderno** (Chrome 80+, Firefox 75+, Safari 13+)
- **Conexão com internet** (para funcionalidades de sincronização)
- **Editor de código** (VS Code recomendado para desenvolvimento)

### Instalação Rápida

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/gerenciador-pro.git
cd gerenciador-pro

# 2. Configure as variáveis de ambiente (opcional)
cp .env.example .env
# Edite o .env com suas credenciais do Supabase

# 3. Abra o projeto
# Método 1: Servidor local (recomendado)
python -m http.server 8000
# ou
npx http-server

# Método 2: Arquivo direto
# Abra index.html no navegador
```

### Configuração do Supabase (Opcional)

```javascript
// src/constants/AppConstants.js
export const EXTERNAL_CONFIG = {
    SUPABASE_URL: 'sua-url-do-supabase',
    SUPABASE_ANON_KEY: 'sua-chave-anonima',
};
```

---

## 🏗️ **Arquitetura do Projeto**

### Estrutura de Arquivos

```
📂 gerenciador-pro/
├── 📄 index.html              # Interface principal
├── 📄 style.css               # Estilos e temas
├── 📄 README.md               # Este arquivo
├── 📁 src/                    # Código fonte organizado
│   ├── 📁 business/           # Lógica de negócio
│   │   └── TradingStrategy.js # Estratégias de trading
│   ├── 📁 constants/          # Constantes da aplicação
│   │   └── AppConstants.js    # Configurações centralizadas
│   ├── 📁 utils/              # Funções utilitárias
│   │   └── MathUtils.js       # Cálculos matemáticos
│   └── 📁 services/           # Serviços externos
├── 📁 tests/                  # Testes automatizados
│   ├── test-runner.js         # Executor de testes
│   └── test-suites.js         # 200+ casos de teste
├── 📁 docs/                   # Documentação adicional
│   ├── APLICATIVO_BIBLIA.md   # Guia completo do sistema
│   ├── BOAS_PRATICAS_PROGRAMACAO.md
│   └── DESENVOLVIMENTO.md     # Guia para desenvolvedores
└── 📁 scripts/                # Scripts de automação
    └── backup.js              # Sistema de backup
```

### Padrões Arquiteturais

- **🏭 Factory Pattern**: `TradingStrategyFactory` para criação de estratégias
- **🎯 Strategy Pattern**: Classes separadas para cada estratégia de trading
- **📦 Module Pattern**: Organização em módulos ES6
- **🔧 Single Responsibility**: Cada classe/função tem uma responsabilidade
  específica
- **📋 Dependency Injection**: Injeção de dependências nos construtores

---

## 🎮 **Como Usar**

### 1. **Configuração Inicial**

```javascript
// Configure seu capital inicial e estratégia preferida
const config = {
    capitalInicial: 10000, // Capital inicial em R$
    percentualEntrada: 2.0, // % do capital por operação
    estrategiaAtiva: 'ciclos', // 'ciclos' ou 'fixa'
    payout: 87, // % de retorno esperado
};
```

### 2. **Iniciando uma Sessão**

- Clique em **"Iniciar Sessão"**
- Escolha entre **Oficial** (afeta capital real) ou **Simulação**
- Configure stops de ganho e perda

### 3. **Registrando Operações**

- Use os botões **Win** 🎯 ou **Loss** ❌ nas etapas
- Adicione tags para categorizar suas operações
- O sistema calcula automaticamente o próximo passo

### 4. **Análise de Resultados**

- **Aba Dashboard**: Métricas em tempo real
- **Aba Análise**: Simulação Monte Carlo e insights
- **Aba Diário**: Histórico completo de sessões

---

## 🧪 **Testes Automatizados**

### Executando os Testes

```javascript
// No navegador, abra o console e execute:
runTests();

// Ou clique no botão "Executar Testes" na interface
```

### Cobertura de Testes

- **✅ 200+ Casos de Teste**
- **🎯 Lógica de Negócio**: Cálculos, estratégias, validações
- **🎨 Interface do Usuário**: Renderização, interações
- **💾 Persistência**: IndexedDB, localStorage, Supabase
- **🧮 Matemática**: Expectativa, drawdown, sequências
- **🔒 Segurança**: Validação de dados, sanitização

### Categorias de Teste

```
📊 RELATÓRIO DE TESTES
==================================================
✅ Lógica de Negócio      - 15 testes
✅ Gerenciamento Estado   - 12 testes
✅ Interface Usuário      - 18 testes
✅ Banco de Dados        - 10 testes
✅ Simulação Monte Carlo  - 8 testes
✅ Análise de Dados      - 12 testes
✅ Validação de Dados    - 15 testes
✅ Integração Módulos    - 9 testes
✅ Sistema de Eventos    - 11 testes
✅ Performance           - 8 testes
... e mais 102 testes especializados
==================================================
📈 Taxa de sucesso: 98%+
```

---

## 🎨 **Sistema de Personalização de Cores**

### Como Personalizar

1. **Acesse as Configurações** (⚙️)
2. **Clique na aba "🎨 Cores"**
3. **Personalize cada elemento**:
    - Cores principais (vitórias, perdas, destaques)
    - Fundos e superfícies
    - Textos e bordas
    - Elementos específicos (botões, sombras)

### Recursos Disponíveis

- **🎯 Preview em Tempo Real**: Veja as mudanças instantaneamente
- **🎨 Gerador de Paletas**: Crie paletas harmoniosas automaticamente
- **📥 Importar/Exportar**: Salve e compartilhe seus temas
- **🔄 Restaurar Padrão**: Volte às cores originais a qualquer momento

### Exemplo de Tema Personalizado

```json
{
    "name": "Tema Oceano",
    "colors": {
        "primary": "#00bcd4",
        "secondary": "#ff5252",
        "accent": "#ffc107",
        "bgColor": "#0a1420"
    }
}
```

[📖 Guia Completo de Personalização](docs/PERSONALIZACAO_CORES.md)

---

## 📊 **Funcionalidades Detalhadas**

### 🎯 **Estratégias de Trading**

#### **Estratégia 1: Entrada Fixa**

```javascript
// Exemplo de uso
const strategy = new FixedAmountStrategy();
const plan = strategy.calculatePlan({
    baseCapital: 10000,
    entryPercentage: 2.0,
    payout: 87,
});
// Resultado: Sempre 2% do capital (R$ 200,00)
```

#### **Estratégia 2: Ciclos de Recuperação**

```javascript
// Sistema complexo de recuperação progressiva
const strategy = new CycleStrategy();
const plan = strategy.calculatePlan({
    baseCapital: 10000,
    entryPercentage: 2.0,
    payout: 87,
    recoveryDivisor: 35,
});
// Resultado: 23 etapas calculadas matematicamente
```

### 📈 **Análise Estatística**

- **📊 Expectativa Matemática**: Calcula probabilidade de lucro
- **📉 Drawdown Máximo**: Analisa maior sequência de perdas
- **🎲 Simulação Monte Carlo**: 1000 simulações para validar estratégia
- **📈 Profit Factor**: Relação ganhos/perdas
- **🔄 Sequências**: Tracking de streaks de vitórias/derrotas

### 🎨 **Interface e UX**

- **4 Temas**: Moderno, Clássico, Escuro, Neon
- **Modo Zen**: Foco na disciplina, não nos números
- **Responsivo**: Funciona em desktop, tablet e mobile
- **PWA**: Instalável como app nativo
- **Acessibilidade**: Suporte a leitores de tela

---

## 🔧 **Configuração para Desenvolvimento**

### Ambiente de Desenvolvimento

```bash
# Instale um servidor local
npm install -g http-server
# ou
pip install -m http.server

# Execute o servidor
http-server -p 8080
# ou
python -m http.server 8080

# Acesse: http://localhost:8080
```

### Padrões de Código

#### **JavaScript**

```javascript
// ✅ BOM - Nomes autoexplicativos
function calculateTradingPlanForCycleStrategy(config) {
    const { baseCapital, entryPercentage } = config;
    return TradingStrategyFactory.create(
        TRADING_STRATEGIES.CYCLES
    ).calculatePlan(config);
}

// ❌ RUIM - Nomes confusos
function calc(c, p) {
    return factory.get('c').calc(c, p);
}
```

#### **CSS**

```css
/* ✅ BOM - Variáveis CSS organizadas */
:root {
    --primary-color: #1a73e8;
    --secondary-color: #5f6368;
    --success-color: #34a853;
    --danger-color: #ea4335;
}

/* Classes bem nomeadas */
.trading-plan-table__header--active {
    background-color: var(--primary-color);
}
```

### Commits Padronizados

```bash
# Padrão Conventional Commits
git commit -m "feat: adiciona estratégia de entrada fixa"
git commit -m "fix: corrige cálculo de drawdown em séries vazias"
git commit -m "docs: atualiza README com exemplos de uso"
git commit -m "test: adiciona testes para validação de entrada"
git commit -m "refactor: extrai lógica de cálculo para classe separada"
```

---

## 🚀 **Deploy e Produção**

### Hospedagem Recomendada

#### **Opção 1: Vercel (Recomendado)**

```bash
# Instale o CLI do Vercel
npm i -g vercel

# Deploy com um comando
vercel

# Configure domínio customizado
vercel --prod
```

#### **Opção 2: Netlify**

```bash
# Instale o CLI do Netlify
npm install -g netlify-cli

# Deploy direto da pasta
netlify deploy --prod --dir .
```

#### **Opção 3: GitHub Pages**

```bash
# Configure GitHub Pages no repositório
# Settings → Pages → Source: Deploy from branch
# Branch: main, Folder: / (root)
```

### Configuração de Produção

```javascript
// Para produção, configure:
const PRODUCTION_CONFIG = {
    // URLs de produção do Supabase
    SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,

    // Configurações de performance
    CACHE_ENABLED: true,
    DEBUG_MODE: false,
    ANALYTICS_ENABLED: true,
};
```

---

## 🤝 **Contribuição**

### Como Contribuir

1. **Fork** o projeto
2. **Crie** uma branch para sua feature
   (`git checkout -b feature/AmazingFeature`)
3. **Faça** commit das mudanças
   (`git commit -m 'feat: adiciona AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

### Checklist de Pull Request

- [ ] ✅ Testes passando (`npm test`)
- [ ] ✅ Código seguindo padrões do projeto
- [ ] ✅ Documentação atualizada
- [ ] ✅ Commits seguindo Conventional Commits
- [ ] ✅ Code review feito por um maintainer

### Issues e Bugs

Use os templates de issue disponíveis:

- 🐛 **Bug Report**: Para reportar problemas
- 💡 **Feature Request**: Para sugerir melhorias
- 📚 **Documentation**: Para melhorar documentação

---

## 📚 **Documentação Adicional**

### Guias Disponíveis

- **[📖 APLICATIVO_BIBLIA.md](docs/APLICATIVO_BIBLIA.md)**: Guia completo do
  sistema
- **[👨‍💻 BOAS_PRATICAS_PROGRAMACAO.md](docs/BOAS_PRATICAS_PROGRAMACAO.md)**:
  Padrões de desenvolvimento
- **[🔧 DESENVOLVIMENTO.md](docs/DESENVOLVIMENTO.md)**: Setup para
  desenvolvedores
- **[🚀 FUTURAS_ATUALIZACOES.md](docs/FUTURAS_ATUALIZACOES.md)**: Roadmap do
  projeto

### API Reference

```javascript
// Exemplos de uso da API interna

// 1. Calcular estratégia
import {
    TradingStrategyFactory,
    TRADING_STRATEGIES,
} from './src/business/TradingStrategy.js';

const strategy = TradingStrategyFactory.create(TRADING_STRATEGIES.CYCLES);
const plan = strategy.calculatePlan(config);

// 2. Funções matemáticas
import {
    calculateMathematicalExpectancy,
    calculateMaxDrawdown,
} from './src/utils/MathUtils.js';

const expectancy = calculateMathematicalExpectancy(60, 87); // 22.2%
const drawdown = calculateMaxDrawdown(operations); // -150.00
```

---

## 📋 **FAQ - Perguntas Frequentes**

### **Q: Como funciona a estratégia de ciclos?**

**A:** A estratégia de ciclos implementa um sistema de recuperação progressiva:

1. **Mão Fixa**: Entrada baseada no % do capital
2. **Reinvestir**: Entrada + retorno da mão fixa
3. **Recuperação**: Calcula entrada para recuperar perda da mão fixa
4. **N Mãos**: 20 ciclos de recuperação divididos conforme configuração

### **Q: O que é a simulação Monte Carlo?**

**A:** É uma técnica estatística que executa 1000 simulações da sua estratégia
para calcular:

- Probabilidade de atingir stop win/loss
- Drawdown máximo esperado
- Resultado médio esperado
- Dias até atingir meta

### **Q: Como interpretar os gráficos?**

**A:** Cada gráfico mostra:

- **📊 Assertividade**: % de acertos ao longo do tempo
- **💰 Patrimônio**: Evolução do capital
- **📈 Progresso de Metas**: Win/Loss rate vs. metas estabelecidas

### **Q: Posso usar sem conexão com internet?**

**A:** Sim! O sistema funciona 100% offline usando IndexedDB. A sincronização
com Supabase é opcional.

---

## 🔧 **Troubleshooting**

### Problemas Comuns

#### **Erro: "Supabase não conectado"**

```javascript
// Solução: Verifique as credenciais
const config = {
    SUPABASE_URL: 'https://seu-projeto.supabase.co',
    SUPABASE_ANON_KEY: 'sua-chave-aqui',
};
```

#### **Erro: "Testes falhando"**

```bash
# Solução: Limpe o cache do navegador
# Chrome: Ctrl+Shift+R (hard refresh)
# Firefox: Ctrl+F5
```

#### **Erro: "Gráficos não carregam"**

```javascript
// Solução: Verifique se Chart.js foi carregado
if (typeof Chart === 'undefined') {
    console.error('Chart.js não foi carregado');
}
```

---

## 📈 **Roadmap - Próximas Versões**

### v9.4 - **Performance & Mobile** (Q2 2025)

- [ ] 🚀 Service Workers para cache inteligente
- [ ] 📱 App nativo com Capacitor
- [ ] ⚡ Lazy loading de componentes
- [ ] 🎨 Animações otimizadas

### v9.5 - **AI & Analytics** (Q3 2025)

- [ ] 🤖 Recomendações de IA para estratégias
- [ ] 📊 Dashboard analytics avançado
- [ ] 🔍 Detecção automática de padrões
- [ ] 📈 Previsões de mercado

### v9.6 - **Colaboração** (Q4 2025)

- [ ] 👥 Compartilhamento de estratégias
- [ ] 🏆 Ranking de traders
- [ ] 💬 Chat integrado
- [ ] 📚 Biblioteca de estratégias

---

## 📞 **Contato e Suporte**

### Equipe de Desenvolvimento

- **🧑‍💻 Lead Developer**: Seu Nome
  ([email@exemplo.com](mailto:email@exemplo.com))
- **🎨 UI/UX Designer**: Nome Designer
- **📊 Data Analyst**: Nome Analista

### Canais de Suporte

- **💬 Discord**: [Link do servidor](https://discord.gg/seu-servidor)
- **📧 Email**: [suporte@gerenciadorpro.com](mailto:suporte@gerenciadorpro.com)
- **🐛 Issues**:
  [GitHub Issues](https://github.com/seu-usuario/gerenciador-pro/issues)
- **📚 Docs**:
  [Wiki do projeto](https://github.com/seu-usuario/gerenciador-pro/wiki)

---

## 📄 **Licença**

Este projeto está licenciado sob a licença MIT - veja o arquivo
[LICENSE](LICENSE) para detalhes.

```
MIT License

Copyright (c) 2025 Gerenciador PRO Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 🎉 **Agradecimentos**

- **[Chart.js](https://www.chartjs.org/)** - Biblioteca de gráficos incrível
- **[Supabase](https://supabase.io/)** - Backend-as-a-Service fantástico
- **[MDN Web Docs](https://developer.mozilla.org/)** - Referência técnica
- **Comunidade JavaScript** - Por todas as libs e ferramentas

---

**⭐ Se este projeto foi útil, deixe uma estrela no GitHub!**

**🔄 Última atualização**: 28/01/2025  
**📊 Versão**: 9.3  
**👥 Contribuidores**: 1  
**🧪 Testes**: 200+  
**📈 Cobertura**: 98%+
