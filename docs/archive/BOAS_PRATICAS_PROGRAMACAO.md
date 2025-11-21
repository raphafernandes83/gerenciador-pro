# 👨‍💻 Guia de Boas Práticas de Programação

## 🎯 **A "REGRA DO COZINHEIRO"**

> _"Sempre deixe o código mais limpo do que quando você encontrou"_  
> _"Se você não consegue explicar em 2 minutos o que fez, está mal
> documentado"_  
> _"O próximo programador pode ser VOCÊ daqui 6 meses"_

---

## 📋 **ÍNDICE**

1. [🧹 Código Limpo (Clean Code)](#-código-limpo-clean-code)
2. [📝 Documentação que Funciona](#-documentação-que-funciona)
3. [🔄 Versionamento Inteligente](#-versionamento-inteligente)
4. [🏗️ Arquitetura Organizada](#️-arquitetura-organizada)
5. [👥 Trabalho em Equipe](#-trabalho-em-equipe)
6. [🧪 Testes que Salvam Vidas](#-testes-que-salvam-vidas)
7. [🚀 Deploy e Produção](#-deploy-e-produção)
8. [📊 Gestão de Projeto](#-gestão-de-projeto)

---

## 🧹 **CÓDIGO LIMPO (Clean Code)**

### ✅ **Nomes que Explicam Tudo**

```javascript
// ❌ RUIM - Nomes confusos
const d = new Date();
const u = users.filter((x) => x.a > 18);
function calc(a, b, c) {
    return a * b * c;
}

// ✅ BOM - Nomes autoexplicativos
const currentDate = new Date();
const adultUsers = users.filter((user) => user.age > 18);
function calculateTotalPrice(quantity, unitPrice, taxRate) {
    return quantity * unitPrice * taxRate;
}
```

### ✅ **Funções Pequenas e Focadas**

```javascript
// ❌ RUIM - Função gigante fazendo tudo
function processUser(userData) {
    // 150 linhas de código fazendo validação, salvamento, email, log...
}

// ✅ BOM - Funções pequenas e focadas
function validateUserData(userData) {
    /* validação */
}
function saveUserToDatabase(validatedUser) {
    /* salvar */
}
function sendWelcomeEmail(user) {
    /* email */
}
function logUserRegistration(user) {
    /* log */
}

function processUser(userData) {
    const validatedUser = validateUserData(userData);
    const savedUser = saveUserToDatabase(validatedUser);
    sendWelcomeEmail(savedUser);
    logUserRegistration(savedUser);
    return savedUser;
}
```

### ✅ **Comentários Inteligentes**

```javascript
// ❌ RUIM - Comentário inútil
let price = 100; // Define o preço como 100

// ✅ BOM - Comentário explicando o PORQUÊ
let discountPrice = originalPrice * 0.85; // Desconto de 15% para clientes premium (regra de negócio aprovada em 12/2024)

// ✅ EXCELENTE - Comentário sobre decisão complexa
/**
 * Usamos setTimeout em vez de setInterval porque descobrimos que
 * em dispositivos móveis o setInterval pode pausar quando a aba
 * fica inativa, causando problemas de sincronização.
 *
 * Testado em: iPhone 12, Samsung Galaxy S21, iPad Pro
 * Issue relacionada: #347
 * @author João Silva - 07/01/2025
 */
function scheduleNextApiCall() {
    setTimeout(makeApiCall, 30000);
}
```

---

## 📝 **DOCUMENTAÇÃO QUE FUNCIONA**

### 🎯 **1. README.md - A Porta de Entrada**

```markdown
# 📊 Gerenciador Trading PRO

## 🚀 Como Rodar o Projeto

1. Clone o repositório: `git clone...`
2. Instale dependências: `npm install`
3. Configure .env: `cp .env.example .env`
4. Rode: `npm start`

## 🏗️ Arquitetura

- `main.js` - Entry point e configuração Supabase
- `dom.js` - Manipulação da interface
- `logic.js` - Regras de negócio
- `db.js` - Operações de banco

## 🧪 Como Testar

- `npm test` - Roda todos os testes
- `npm run test:watch` - Testes em modo watch

## 📞 Contato

- **Desenvolvedor:** Seu Nome
- **Email:** seuemail@exemplo.com
- **Última atualização:** 07/01/2025
```

### 🎯 **2. Documentação de Código**

```javascript
/**
 * Calcula o risco de uma operação de trading
 *
 * @param {Object} operation - Dados da operação
 * @param {number} operation.entryPrice - Preço de entrada
 * @param {number} operation.stopLoss - Stop loss definido
 * @param {number} operation.position - Tamanho da posição
 * @param {number} accountBalance - Saldo total da conta
 *
 * @returns {Object} Resultado do cálculo de risco
 * @returns {number} returns.riskPercentage - Porcentagem de risco (0-100)
 * @returns {boolean} returns.isAcceptable - Se o risco é aceitável (<= 2%)
 * @returns {string} returns.recommendation - Recomendação textual
 *
 * @example
 * const risk = calculateRisk(
 *   { entryPrice: 100, stopLoss: 95, position: 1000 },
 *   50000
 * );
 * console.log(risk.riskPercentage); // 10
 */
function calculateRisk(operation, accountBalance) {
    // implementação...
}
```

### 🎯 **3. Diário de Desenvolvimento** _(como nosso DESENVOLVIMENTO.md)_

- **Decisões tomadas e porquê**
- **Problemas encontrados e soluções**
- **Arquitetura e mudanças**
- **TODOs e próximos passos**

---

## 🔄 **VERSIONAMENTO INTELIGENTE**

### ✅ **Commits que Contam Histórias**

```bash
# ❌ RUIM - Mensagens inúteis
git commit -m "fix"
git commit -m "mudanças"
git commit -m "arrumei o bug"

# ✅ BOM - Mensagens claras
git commit -m "fix: corrige cálculo de stop loss em operações longas"
git commit -m "feat: adiciona autenticação com Google OAuth"
git commit -m "docs: atualiza README com instruções de deploy"
git commit -m "refactor: reorganiza estrutura de pastas do projeto"
```

### ✅ **Padrão de Commit (Conventional Commits)**

```bash
feat: nova funcionalidade
fix: correção de bug
docs: mudanças na documentação
style: formatação de código
refactor: refatoração sem mudança de funcionalidade
test: adicionar ou modificar testes
chore: mudanças de build/ferramentas
```

### ✅ **Branches Organizadas**

```bash
main/master     # Produção - SEMPRE estável
develop         # Desenvolvimento - integração contínua
feature/login   # Nova funcionalidade específica
hotfix/critical-bug  # Correção urgente para produção
release/v2.0    # Preparação para release
```

---

## 🏗️ **ARQUITETURA ORGANIZADA**

### 📁 **Estrutura de Pastas Padrão**

```
📂 projeto/
├── 📁 src/                    (Código fonte)
│   ├── 📁 components/         (Componentes reutilizáveis)
│   ├── 📁 pages/             (Páginas/telas)
│   ├── 📁 services/          (APIs e serviços externos)
│   ├── 📁 utils/             (Funções utilitárias)
│   ├── 📁 constants/         (Constantes do projeto)
│   └── 📁 assets/            (Imagens, ícones, etc.)
├── 📁 tests/                 (Testes automatizados)
├── 📁 docs/                  (Documentação adicional)
├── 📁 scripts/               (Scripts de automação)
├── 📄 README.md              (Documentação principal)
├── 📄 package.json           (Dependências)
├── 📄 .env.example           (Exemplo de variáveis)
└── 📄 .gitignore             (Arquivos ignorados)
```

### ✅ **Separação de Responsabilidades**

```javascript
// ❌ RUIM - Tudo misturado
const app = {
    userData: {},
    apiKey: 'abc123',

    login(user, pass) {
        // validação + API + UI + storage tudo junto
    },

    renderDashboard() {
        // lógica + HTML + CSS + dados misturados
    },
};

// ✅ BOM - Responsabilidades separadas
const AuthService = {
    async login(credentials) {
        /* só autenticação */
    },
};

const UserInterface = {
    renderDashboard(data) {
        /* só interface */
    },
};

const DataStorage = {
    saveUser(user) {
        /* só persistência */
    },
};

const BusinessLogic = {
    calculateRisk(operation) {
        /* só lógica de negócio */
    },
};
```

---

## 👥 **TRABALHO EM EQUIPE**

### ✅ **Code Review - Revisão de Código**

```markdown
## Checklist de Code Review

### Funcionalidade

- [ ] O código faz o que deveria fazer?
- [ ] A lógica está correta?
- [ ] Trata todos os casos edge?

### Legibilidade

- [ ] Nomes de variáveis são claros?
- [ ] Funções são pequenas e focadas?
- [ ] Comentários explicam o PORQUÊ, não o QUE?

### Performance

- [ ] Não há loops desnecessários?
- [ ] Consultas ao banco estão otimizadas?
- [ ] Não há vazamentos de memória?

### Segurança

- [ ] Inputs são validados?
- [ ] Senhas não estão hardcoded?
- [ ] APIs estão protegidas?
```

### ✅ **Comunicação Clara**

```markdown
## Template de Pull Request

### 🎯 O que esta PR faz?

Implementa autenticação com Supabase para permitir login de usuários.

### 🔄 Como testar?

1. Acesse a página de login
2. Use email: test@test.com, senha: 123456
3. Verifique se redireciona para o dashboard

### 📸 Screenshots/GIFs

[Anexar imagens se necessário]

### ⚠️ Pontos de atenção

- Mudou a estrutura do banco de dados
- Requer variável SUPABASE_KEY no .env
- Quebra compatibilidade com versão anterior

### 📋 Checklist

- [x] Testes passando
- [x] Documentação atualizada
- [x] Code review feito
- [ ] QA aprovado
```

---

## 🧪 **TESTES QUE SALVAM VIDAS**

### ✅ **Tipos de Teste**

```javascript
// 1. TESTE UNITÁRIO - Testa função isolada
test('calculateRisk deve retornar 2% para operação conservadora', () => {
    const operation = {
        entryPrice: 100,
        stopLoss: 98,
        position: 1000,
    };
    const accountBalance = 100000;

    const result = calculateRisk(operation, accountBalance);

    expect(result.riskPercentage).toBe(2);
    expect(result.isAcceptable).toBe(true);
});

// 2. TESTE DE INTEGRAÇÃO - Testa fluxo completo
test('fluxo completo de login deve funcionar', async () => {
    // 1. Usuário digita credenciais
    // 2. Sistema valida
    // 3. Chama API
    // 4. Salva sessão
    // 5. Redireciona
});

// 3. TESTE E2E - Testa da interface até o banco
test('usuário consegue fazer login via interface', async () => {
    await page.goto('/login');
    await page.fill('#email', 'test@test.com');
    await page.fill('#password', '123456');
    await page.click('#login-button');
    await expect(page).toHaveURL('/dashboard');
});
```

---

## 🚀 **DEPLOY E PRODUÇÃO**

### ✅ **Ambientes Separados**

```bash
development  # Seu computador - pode quebrar à vontade
staging      # Cópia da produção - testes finais
production   # Site real - NUNCA quebra
```

### ✅ **CI/CD - Automação**

```yaml
# .github/workflows/deploy.yml
name: Deploy Automático

on:
    push:
        branches: [main]

jobs:
    deploy:
        runs-on: ubuntu-latest
        steps:
            - name: 📥 Baixar código
              uses: actions/checkout@v2

            - name: 🧪 Rodar testes
              run: npm test

            - name: 🏗️ Build do projeto
              run: npm run build

            - name: 🚀 Deploy para produção
              run: npm run deploy
```

---

## 📊 **GESTÃO DE PROJETO**

### ✅ **Metodologia Ágil (Scrum/Kanban)**

```markdown
## Sprint Planning - O que vamos fazer nas próximas 2 semanas

### 🎯 Objetivo do Sprint

Implementar autenticação completa e migração para Supabase

### 📋 Backlog (To Do)

- [ ] Configurar Supabase Auth
- [ ] Criar telas de login/registro
- [ ] Migrar localStorage para Supabase Database
- [ ] Testes de integração

### 🔄 Em Andamento (Doing)

- [ ] Documentação da API

### ✅ Concluído (Done)

- [x] Setup inicial do projeto
- [x] Integração básica com Supabase
```

### ✅ **Estimation - Estimativa de Tempo**

```markdown
## Story Points (Poker Planning)

1 ponto = 1 hora simples 2 pontos = meio dia 3 pontos = 1 dia 5 pontos = 2-3
dias 8 pontos = 1 semana 13 pontos = precisa quebrar em tarefas menores

### Exemplo:

- Criar botão de login: 1 ponto
- Integrar com API: 3 pontos
- Sistema completo de autenticação: 8 pontos
```

### ✅ **Retrospectiva - O que Aprendemos**

```markdown
## Retrospectiva Sprint 1

### ✅ O que funcionou bem?

- Documentação automática salvou tempo
- Commits padronizados facilitaram o histórico
- Code review pegou 3 bugs antes de produção

### ❌ O que pode melhorar?

- Testes demoram muito para rodar
- Falta comunicação sobre mudanças na API
- Ambiente de staging está instável

### 🎯 Ações para próximo sprint:

- Configurar testes paralelos
- Criar canal #api-changes no Slack
- Resetar ambiente de staging
```

---

## 🎯 **RESUMO - AS 10 REGRAS DE OURO**

### 1. **👀 LEGIBILIDADE ACIMA DE TUDO**

Código é lido 10x mais que escrito

### 2. **📝 DOCUMENTE AS DECISÕES, NÃO O ÓBVIO**

Explique o PORQUÊ, não o QUE

### 3. **🔄 COMMITS PEQUENOS E FREQUENTES**

1 funcionalidade = 1 commit

### 4. **🧪 TESTE ANTES DE DEPLOYAR**

"Funciona na minha máquina" não é teste

### 5. **👥 CODE REVIEW É OBRIGATÓRIO**

Quatro olhos veem mais que dois

### 6. **📁 ORGANIZAÇÃO É PRODUTIVIDADE**

Lugar de cada coisa, cada coisa em seu lugar

### 7. **⚡ AUTOMATIZE TUDO QUE DÁ**

Humanos erram, robôs não

### 8. **🔒 SEGURANÇA NÃO É OPCIONAL**

Sempre valide, nunca confie

### 9. **📊 MEÇA E MONITORE**

Se não mede, não gerencia

### 10. **🎓 APRENDA CONTINUAMENTE**

Tecnologia muda, princípios ficam

---

## 🔗 **FERRAMENTAS ESSENCIAIS**

### 📝 **Documentação**

- **README.md** - Porta de entrada
- **CHANGELOG.md** - Histórico de versões
- **API.md** - Documentação de endpoints
- **SETUP.md** - Guia de instalação

### 🔄 **Versionamento**

- **Git** - Controle de versão
- **GitHub/GitLab** - Hospedagem de código
- **Conventional Commits** - Padrão de commits

### 🧪 **Testes**

- **Jest** - Testes unitários JavaScript
- **Cypress** - Testes E2E
- **Postman** - Testes de API

### 🚀 **Deploy**

- **Vercel/Netlify** - Deploy frontend
- **Heroku/Railway** - Deploy backend
- **GitHub Actions** - CI/CD

### 📊 **Gestão**

- **Trello/Notion** - Gestão de tarefas
- **Slack/Discord** - Comunicação
- **Figma** - Design e protótipos

---

_"O código é como uma receita: se você não consegue explicar para sua avó, está
complicado demais."_

**Última atualização:** 07/01/2025  
**Criado durante:** Sessão 1 - Setup Supabase
