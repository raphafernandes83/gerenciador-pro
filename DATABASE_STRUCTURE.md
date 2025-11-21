# Estrutura do Banco de Dados

## 📋 Visão Geral

Este documento descreve a estrutura do banco de dados do projeto.

## 🗄️ Tabelas Principais

### 1. users (Usuários)

```sql
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos:**

- `id` - Identificador único do usuário
- `email` - Email do usuário (único)
- `name` - Nome completo do usuário
- `created_at` - Data de criação
- `updated_at` - Data da última atualização

### 2. profiles (Perfis)

```sql
CREATE TABLE profiles (
    id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
    avatar_url TEXT,
    bio TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos:**

- `id` - Referência ao usuário
- `avatar_url` - URL da foto de perfil
- `bio` - Biografia do usuário
- `preferences` - Preferências em formato JSON
- `created_at` - Data de criação
- `updated_at` - Data da última atualização

## 🔐 Políticas de Segurança (RLS)

### Habilitar RLS

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### Políticas de Usuários

```sql
-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own data" ON users
FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "Users can update own data" ON users
FOR UPDATE USING (auth.uid() = id);

-- Usuários podem inserir apenas seus próprios dados
CREATE POLICY "Users can insert own data" ON users
FOR INSERT WITH CHECK (auth.uid() = id);
```

### Políticas de Perfis

```sql
-- Usuários podem ver apenas seus próprios perfis
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar apenas seus próprios perfis
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Usuários podem inserir apenas seus próprios perfis
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);
```

## 🔄 Triggers

### Atualizar updated_at

```sql
-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para users
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 📊 Índices

### Índices Recomendados

```sql
-- Índice para busca por email
CREATE INDEX idx_users_email ON users(email);

-- Índice para busca por data de criação
CREATE INDEX idx_users_created_at ON users(created_at);

-- Índice para JSONB (preferences)
CREATE INDEX idx_profiles_preferences ON profiles USING GIN(preferences);
```

## 🔍 Queries Úteis

### Buscar Usuário com Perfil

```sql
SELECT
    u.id,
    u.email,
    u.name,
    u.created_at,
    p.avatar_url,
    p.bio,
    p.preferences
FROM users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.id = auth.uid();
```

### Atualizar Preferências

```sql
UPDATE profiles
SET preferences = preferences || '{"theme": "dark"}'::jsonb
WHERE id = auth.uid();
```

### Buscar Usuários por Data

```sql
SELECT
    id,
    email,
    name,
    created_at
FROM users
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

## 🛠️ Funções Úteis

### Função para Criar Perfil Automaticamente

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Função para Buscar Estatísticas

```sql
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS TABLE(
    total_users BIGINT,
    active_users BIGINT,
    new_users_today BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN updated_at >= NOW() - INTERVAL '7 days' THEN 1 END) as active_users,
        COUNT(CASE WHEN created_at >= NOW()::date THEN 1 END) as new_users_today
    FROM users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📈 Monitoramento

### Views para Analytics

```sql
-- View para estatísticas diárias
CREATE VIEW daily_stats AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as new_users,
    COUNT(DISTINCT DATE_TRUNC('hour', created_at)) as active_hours
FROM users
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View para usuários ativos
CREATE VIEW active_users AS
SELECT
    id,
    email,
    name,
    created_at,
    updated_at,
    CASE
        WHEN updated_at >= NOW() - INTERVAL '7 days' THEN 'active'
        WHEN updated_at >= NOW() - INTERVAL '30 days' THEN 'inactive'
        ELSE 'very_inactive'
    END as status
FROM users;
```

## 🔧 Manutenção

### Limpeza de Dados Antigos

```sql
-- Remover usuários inativos há mais de 1 ano
DELETE FROM users
WHERE updated_at < NOW() - INTERVAL '1 year'
AND created_at < NOW() - INTERVAL '1 year';
```

### Backup de Dados

```sql
-- Exportar dados para CSV
COPY (
    SELECT
        u.id,
        u.email,
        u.name,
        u.created_at,
        p.avatar_url,
        p.bio
    FROM users u
    LEFT JOIN profiles p ON u.id = p.id
) TO '/tmp/users_backup.csv' WITH CSV HEADER;
```

## 🚨 Considerações de Segurança

### Boas Práticas

1. **Sempre use RLS** - Nunca desabilite Row Level Security
2. **Valide dados** - Use CHECK constraints quando possível
3. **Audite mudanças** - Mantenha logs de alterações importantes
4. **Backup regular** - Faça backup dos dados regularmente
5. **Teste políticas** - Teste as políticas de segurança regularmente

### Exemplo de Validação

```sql
-- Adicionar validação de email
ALTER TABLE users
ADD CONSTRAINT valid_email
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Adicionar validação de nome
ALTER TABLE users
ADD CONSTRAINT valid_name
CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 100);
```

---

**Última atualização:** ${new Date().toLocaleDateString('pt-BR')}
