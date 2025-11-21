# Guia Rápido: Ativação de RLS e Políticas no Supabase

Este guia descreve os passos para habilitar Row Level Security (RLS) e criar
políticas mínimas de acesso seguro no Supabase para o projeto Gerenciador PRO.

## 1) Ativar RLS

1. Abra o Dashboard do Supabase → Project → Database → Table Editor
2. Selecione a tabela relevante (ex.: `sessions`)
3. Vá em "RLS" e clique em "Enable RLS"

## 2) Políticas de Acesso (exemplos)

Crie políticas explícitas para leitura e escrita. Adapte os nomes de
tabelas/colunas conforme seu schema.

- Leitura pública restrita (apenas linhas sem dados sensíveis):

```sql
create policy "public read only non-sensitive" on public.sessions
for select
using (true);
```

- Escrita apenas para usuários autenticados (se usar auth.uid() no schema):

```sql
create policy "authenticated insert" on public.sessions
for insert
with check (auth.role() = 'authenticated');
```

- Atualização apenas do próprio dono (se a tabela tiver coluna `user_id`):

```sql
create policy "owner can update" on public.sessions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

- Exclusão apenas do próprio dono:

```sql
create policy "owner can delete" on public.sessions
for delete
using (auth.uid() = user_id);
```

## 3) Práticas Recomendadas

- Nunca exponha `service_role` no frontend. Use apenas `anon key` no cliente.
- Valide a sessão (refresh tokens) e trate `JWT_EXPIRED` com
  `auth.refreshSession()`.
- Use schemas e nomes claros para evitar confusão de permissões.
- Logue erros sem vazar tokens/headers sensíveis.

## 4) Testes

- Use o SQL Editor para testar `select/insert/update/delete` com o "RLS Enabled"
  ativado.
- Verifique se usuários não autenticados não conseguem escrever/alterar dados.
- Garanta que o usuário A não acesse dados do usuário B.

## 5) Integração no Código

- O cliente frontend usa `anon key`. Regras de RLS devem proteger os dados.
- Em chamadas autenticadas, inclua o JWT do usuário via Supabase Auth.

---

Observação: Este guia é genérico e deve ser adaptado ao schema real de tabelas
do projeto.
