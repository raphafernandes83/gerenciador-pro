# 📊 Gerenciador de Operações PRO v9.3

> Sistema profissional de gerenciamento e análise de operações de trading com foco em performance, UX moderna e arquitetura escalável.

![Version](https://img.shields.io/badge/version-9.3.1-blue.svg)
![License](https://img.shields.io/badge/license-Proprietário-red.svg)
![Node](https://img.shields.io/badge/node-24%2B-green.svg)
![Status](https://img.shields.io/badge/status-Em%20Desenvolvimento-yellow.svg)

---

## 🎯 Sobre o Projeto

O **Gerenciador PRO** é uma aplicação web completa para traders que desejam:

- 📈 **Gerenciar sessões** de trading (oficiais e simulações)
- 📊 **Analisar performance** com estatísticas avançadas (Win Rate, Drawdown, Profit Factor)
- 🎯 **Definir metas** (Stop Win/Loss) com alertas inteligentes
- 🔬 **Simular cenários** com Risk Lab e análise de Monte Carlo
- 📝 **Registrar operações** com tags, replay e diagnósticos
- 📉 **Visualizar dados** com gráficos interativos (Chart.js)

**Diferencial:** Arquitetura modular, UX moderna, sistema de ajuda contextual com 54 tooltips, e documentação técnica completa.

---

## ✨ Features Principais

### 🎮 Gerenciamento de Sessões
- ✅ Sessões **oficiais** e **simulações** separadas
- ✅ Modo **Zen** (sem visualização de valores)
- ✅ **Stop Win/Loss** automático
- ✅ Sistema de **recuperação** após perdas (Martingale configurável)

### 📊 Análise Avançada
- ✅ **Estatísticas em tempo real**: Win Rate, Loss Rate, Profit Factor
- ✅ **Drawdown** automático
- ✅ **Sequências** (streaks) de vitórias/derrotas
- ✅ **Expectativa matemática** (EV)
- ✅ Análise **multidimensional** (por dia, hora, tag, payout)

### 🔬 Risk Lab
- ✅ **Simulador de Monte Carlo** (1.000-10.000 simulações)
- ✅ Análise de risco com múltiplos cenários
- ✅ Otimização de metas

### 📝 Registro de Operações
- ✅ **Tags personalizadas** para categorização
- ✅ **Replay** de sessões passadas
- ✅ **Timeline visual** de operações
- ✅ **Diagnóstico por tag** (assertividade)

### 🎨 UX Moderna
- ✅ **54 tooltips contextuais** (sistema de ajuda completo)
- ✅ **Toast notifications** modernas com gradientes
- ✅ **Dark mode** nativo
- ✅ **Animações suaves** e responsivas
- ✅ **Acessibilidade** (ARIA, keyboard navigation)

### 🗄️ Persistência de Dados
- ✅ **3 camadas**: Memory → IndexedDB → Supabase
- ✅ **Offline-first** com sincronização automática
- ✅ **Backup/Restore** integrado

---

## 🏗️ Arquitetura

### Estrutura Modular

```
Gerenciador PRO/
├── src/
│   ├── business/          # Lógica de negócio
│   ├── ui/                # Componentes de interface
│   │   ├── components/    # Componentes reutilizáveis
│   │   │   ├── help/      # Sistema de ajuda (tooltips)
│   │   │   └── notifications.css
│   │   └── templates/     # Templates de UI
│   ├── utils/             # Utilitários
│   │   ├── Logger.js      # Sistema de logs
│   │   ├── MathUtils.js   # Funções matemáticas
│   │   └── ...
│   ├── core/              # Core do sistema
│   ├── monitoring/        # Performance & errors
│   └── constants/         # Configurações
├── docs/                  # Documentação
│   ├── ARQUITETURA_MODULAR.md
│   ├── FLUXO_DE_DADOS.md
│   └── COMO_ADICIONAR_COMPONENTE.md
├── tests/                 # Testes
└── deprecated/            # Código legado
```

### Tecnologias

**Frontend:**
- Vanilla JavaScript (ES Modules)
- HTML5 + CSS3 (Grid, Flexbox, Custom Properties)
- Chart.js 4.4+ (visualizações)

**Backend/Dados:**
- Node.js 24+
- Supabase (PostgreSQL)
- IndexedDB (offline)

**Dev Tools:**
- Playwright (testes E2E)
- ESLint + Prettier
- Logger.js (logs estruturados)

**Padrões:**
- Event-Driven Architecture
- Observer Pattern
- Factory Pattern
- Dependency Injection

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 24+ ([Download](https://nodejs.org))
- npm ou yarn

### Passos

```bash
# 1. Clone o repositório
git clone <repo-url>
cd "GERENCIADOR PRO/08 09 2025"

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente (opcional - offline mode)
# Crie .env com credenciais Supabase se quiser sync cloud

# 4. Inicie o servidor
node server.js

# 5. Abra no navegador
# http://localhost:3000
```

**Pronto!** 🎉

---

## 📖 Como Usar

### 1️⃣ Criar Nova Sessão

1. Clique em **"Nova Sessão"**
2. Escolha **Oficial** ou **Simulação**
3. Configure:
   - Capital inicial
   - Payout
   - Meta de Win Rate
   - Stop Win/Loss

### 2️⃣ Registrar Operações

1. Vá para **"Plano de Operações"**
2. Clique **W** (Win) ou **L** (Loss)
3. Adicione tag (opcional)
4. Sistema calcula tudo automaticamente!

### 3️⃣ Analisar Resultados

- **Dashboard**: Visão geral em tempo real
- **Análise**: Estatísticas detalhadas
- **Risk Lab**: Simulações de cenário
- **Replay**: Reveja sessões passadas

### 4️⃣ Sistema de Ajuda

- Passe o mouse sobre **ícone ℹ️** para ver tooltip
- **54 tooltips** explicam cada métrica
- **FAB** no canto inferior direito para ajuda geral

---

## 📚 Documentação

### Guias Técnicos

- [**Arquitetura Modular**](./ARQUITETURA_MODULAR.md) - Estrutura do projeto
- [**Fluxo de Dados**](./FLUXO_DE_DADOS.md) - Como dados fluem
- [**Como Adicionar Componente**](./COMO_ADICIONAR_COMPONENTE.md) - Guia para desenvolvedores

### Changelog

- [**CHANGELOG.md**](./CHANGELOG.md) - Histórico completo de versões

---

## 🎯 Roadmap

### ✅ Completado (v9.3.1 - Dez 2025)

- [x] Sistema de Ajuda Contextual (54 tooltips)
- [x] Sistema de Notificações Moderno
- [x] Documentação de Arquitetura Completa
- [x] Console Cleanup (Logger.js)
- [x] MetasUI Integration (eventos + cache)
- [x] Limpeza de Código

### 🚧 Em Progresso

- [ ] Testes Automatizados (Playwright expansion)
- [ ] Performance Optimization
- [ ] PWA (Service Worker)
- [ ] Analytics Integration

### 📋 Planejado

- [ ] Mobile App (React Native)
- [ ] API REST completa
- [ ] Multi-usuário
- [ ] Dashboards customizáveis

---

## 🧪 Testes

```bash
# Testes E2E (Playwright)
npm test

# Smoke Tests (rápido)
npm run test:smoke

# Testes específicos
npm run test:tabela
npm run test:timeline
npm run test:historico
npm run test:modal
```

**Cobertura atual:** 21+ testes E2E + 4 smoke tests

---

## 🔧 Rotina de Desenvolvimento

### Checagem de Qualidade (obrigatório antes de commit)

```bash
# Executa todas as verificações
npm run check
```

Este comando roda:
1. `npm run lint:check` - ESLint (JavaScript)
2. `npm run lint:css` - Stylelint (CSS)
3. `npm run format:check` - Prettier (formatação)
4. `npm run test:smoke` - Testes de sanidade

### Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run check` | Roda todos os checks (lint + format + smoke tests) |
| `npm run lint` | ESLint com auto-fix |
| `npm run lint:check` | ESLint sem fix (CI) |
| `npm run lint:css` | Stylelint para CSS |
| `npm run format` | Prettier com auto-fix |
| `npm run format:check` | Prettier sem fix (CI) |
| `npm run test:smoke` | Smoke tests rápidos |
| `npm run test` | Todos os testes Playwright |

### Padrão de Branch

Para cada tarefa, criar branch seguindo o padrão:

```
task-<número>-<slug-descritivo>
```

**Exemplos:**
```bash
git checkout -b task-1-csp-compliance
git checkout -b task-2-modularizacao-css
git checkout -b task-3-fix-encoding-charts
```

### Checklist Pré-Commit

- [ ] Executar `npm run check` (deve passar)
- [ ] Testar manualmente as áreas impactadas
- [ ] DevTools: Console sem novos erros
- [ ] Network: 200 OK para assets carregados

### Husky (Automático)

O projeto usa **Husky** para rodar checks automaticamente no pre-commit:
- ESLint nos arquivos JS alterados
- Stylelint nos arquivos CSS alterados
- Prettier em JSON/MD

---

## 🤝 Contribuindo

Este é um projeto **proprietário** em desenvolvimento ativo.

**Para desenvolvedores autorizados:**

1. Fork o projeto
2. Crie branch (`git checkout -b feature/MinhaFeature`)
3. Commit (`git commit -m 'Add: MinhaFeature'`)
4. Push (`git push origin feature/MinhaFeature`)
5. Abra Pull Request

**Code Style:**
- ESLint + Prettier configurados
- JSDoc obrigatório para funções públicas
- Commits semânticos (Add/Fix/Update/Remove)

---

## 📊 Estatísticas do Projeto

**Código:**
- **~15.000 linhas** de JavaScript
- **~5.000 linhas** de CSS
- **~2.000 linhas** de HTML
- **30+ módulos** separados

**Documentação:**
- **1.150+ linhas** de docs técnicos
- **54 tooltips** contextuais
- **CHANGELOG** completo

**Qualidade:**
- **Logger.js** profissional
- **Event-driven** architecture
- **Offline-first** design
- **Acessibilidade** (ARIA)

---

## 📄 Licença

**Proprietário** - Todos os direitos reservados.

**Uso restrito** a desenvolvedores autorizados.

---

## 👤 Autor

**Equipe Gerenciador PRO**

- 📧 Email: [contato]
- 💼 LinkedIn: [perfil]
- 🐙 GitHub: [repo]

---

## 🙏 Agradecimentos

- Chart.js pela biblioteca de gráficos
- Supabase pelo backend
- Node.js pela runtime
- Playwright pelos testes

---

<div align="center">

**Desenvolvido com ❤️ para traders profissionais**

[⬆ Voltar ao topo](#-gerenciador-de-operações-pro-v93)

</div>
