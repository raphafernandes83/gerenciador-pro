# Guia de Configuração - Supabase e GitHub

## Novo Projeto

Este guia te ajudará a configurar o Supabase e GitHub no seu novo projeto.

---

## 🗄️ **PASSO 1: Configuração do Supabase**

### 1.1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Escolha sua organização
5. Digite um nome para o projeto
6. Defina uma senha forte para o banco de dados
7. Escolha a região mais próxima
8. Clique em "Create new project"

### 1.2. Obter Credenciais do Projeto

1. No dashboard do seu projeto, vá em "Settings" → "API"
2. Copie a **URL** e a **anon public key**
3. Guarde essas informações - você vai precisar delas

### 1.3. Adicionar Script do Supabase no HTML

No arquivo `index.html`, adicione esta linha na seção `<head>`:

```html
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
```

### 1.4. Configurar o Cliente Supabase no main.js

Adicione este código no **INÍCIO** do arquivo `main.js`:

```javascript
// ================================================================
// SUPABASE INTEGRACAO
// ================================================================

// Substitua pelas suas credenciais reais do Supabase
const supabaseUrl = 'SUA_URL_DO_SUPABASE';
const supabaseAnonKey = 'SUA_ANON_KEY_DO_SUPABASE';

// Inicializa o cliente Supabase
let supabase;

// Aguarda que a biblioteca Supabase esteja disponível
if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    console.log('Cliente Supabase inicializado com sucesso!');
} else {
    console.error(
        'Biblioteca Supabase não foi carregada. Verifique se o script está incluído no HTML.'
    );
}

// Funcao para testar a conexao com o Supabase
async function testSupabaseConnection() {
    console.log('Tentando conectar ao Supabase...');

    if (!supabase) {
        console.error('Cliente Supabase não foi inicializado.');
        return false;
    }

    try {
        const { data: user, error: authError } = await supabase.auth.getUser();

        if (authError && authError.message !== 'Auth session missing!') {
            console.error('Erro na conexão Supabase:', authError.message);
            return false;
        } else {
            console.log('Conexão Supabase bem-sucedida!');
            return true;
        }
    } catch (e) {
        console.error('Exceção na conexão Supabase:', e.message);
        return false;
    }
}

// ================================================================
// FIM DA INTEGRACAO SUPABASE INICIAL
// ================================================================
```

### 1.5. Modificar a função init() no main.js

Na função `init()` da sua aplicação, adicione:

```javascript
async init() {
    console.log("Aplicação iniciando...");

    // Teste de Conexao Supabase
    const supabaseConnected = await testSupabaseConnection();
    if (supabaseConnected) {
        console.log("✅ Supabase conectado e pronto para uso!");
    } else {
        console.warn("⚠️ Falha na conexão com Supabase.");
    }

    // resto do código da inicialização...
}
```

### 1.6. Exportar o cliente Supabase

No **FINAL** do arquivo `main.js`, adicione:

```javascript
// Exporta o cliente Supabase para uso em outros módulos
export { supabase };
```

---

## 🔧 **PASSO 2: Configuração do Git/GitHub**

### 2.1. Inicializar o repositório Git

Abra o PowerShell na pasta do projeto e execute:

```powershell
git init
```

### 2.2. Criar arquivo .gitignore

Renomeie o arquivo `gitignore_template.txt` para `.gitignore` ou crie um novo
arquivo `.gitignore` com este conteúdo:

```
# Dependências
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Builds
dist/
build/

# Arquivos temporários
*.tmp
*.temp
.DS_Store
Thumbs.db

# Logs
*.log

# Backups automáticos
*.bak
*.backup

# IDE
.vscode/
.idea/
*.swp
*.swo

# Sistema
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Arquivos específicos do projeto
*.txt
Novo*Documento*
```

### 2.3. Configurar informações do Git

```powershell
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"
```

### 2.4. Fazer o primeiro commit

```powershell
git add .
git commit -m "Primeiro commit - Novo projeto"
```

### 2.5. Criar repositório no GitHub

1. Acesse [GitHub.com](https://github.com)
2. Clique em "New repository"
3. Escolha um nome para o repositório
4. Deixe público ou privado (sua escolha)
5. **NÃO** inicialize com README, .gitignore ou license
6. Clique em "Create repository"

### 2.6. Conectar ao repositório remoto

Execute estes comandos (substitua pela URL do seu repositório):

```powershell
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

---

## 📋 **PASSO 3: Verificação**

### 3.1. Testar o Supabase

1. Abra o projeto no navegador
2. Abra o Console do Desenvolvedor (F12)
3. Deve aparecer: "✅ Supabase conectado e pronto para uso!"

### 3.2. Testar o Git

Execute no PowerShell:

```powershell
git status
```

Deve mostrar: "On branch main, nothing to commit, working tree clean"

---

## 📝 **Scripts de Backup Úteis**

Use os arquivos `.bat` já criados:

- **`backup_completo.bat`** - Faz backup automático no GitHub
- **`restaurar_versao.bat`** - Restaura última versão do GitHub

---

## 🎯 **Próximos Passos**

Depois de configurar tudo:

1. ✅ Teste a aplicação para garantir que tudo funciona
2. ✅ Faça backups regulares com os scripts .bat
3. ✅ Use o Supabase Dashboard para monitorar os dados
4. ✅ Configure tabelas no Supabase conforme necessário

---

**Criado em:** ${new Date().toLocaleDateString('pt-BR')} **Projeto:** Novo
Projeto
