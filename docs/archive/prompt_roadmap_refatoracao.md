# PROMPT PARA ROADMAP DE REFATORAÇÃO ETAPA POR ETAPA

## OBJETIVO
Criar um roadmap detalhado para refatorar o card de progresso de metas de forma segura, aplicando correções etapa por etapa para identificar exatamente onde o código quebra.

## INSTRUÇÕES PARA A IA

### BASEADO NA ANÁLISE ANTERIOR
Use os resultados da análise completa do card de metas para criar um plano de refatoração que minimize riscos e permita identificar pontos de falha.

### ESTRUTURA DO ROADMAP

Crie um roadmap seguindo esta estrutura:

```
## ROADMAP DE REFATORAÇÃO - CARD DE PROGRESSO DE METAS

### PREPARAÇÃO (Etapas 0-2)
### LIMPEZA SEGURA (Etapas 3-7)  
### REORGANIZAÇÃO (Etapas 8-12)
### OTIMIZAÇÃO (Etapas 13-15)
### VALIDAÇÃO FINAL (Etapa 16)
```

### FORMATO DE CADA ETAPA

Para cada etapa, forneça:

```
## ETAPA X: [NOME DA ETAPA]

### OBJETIVO
[O que esta etapa pretende alcançar]

### ARQUIVOS AFETADOS
- arquivo1.js (linha X-Y)
- arquivo2.tsx (função específica)
- arquivo3.css (classes específicas)

### AÇÕES ESPECÍFICAS
1. [Ação detalhada 1]
2. [Ação detalhada 2]
3. [Ação detalhada 3]

### COMANDO PARA EXECUÇÃO
```bash
# Comandos específicos se necessário
```

### TESTE DE VERIFICAÇÃO
- [ ] Card de metas ainda renderiza
- [ ] Dados são carregados corretamente
- [ ] Progresso é calculado corretamente
- [ ] Não há erros no console
- [ ] [Outros testes específicos]

### ROLLBACK SE NECESSÁRIO
[Como desfazer esta etapa se algo der errado]

### SINAIS DE QUE DEU ERRADO
- [Lista de sintomas de problemas]

---
```

### ETAPAS SUGERIDAS (ADAPTE CONFORME SUA ANÁLISE)

#### PREPARAÇÃO
- **Etapa 0**: Backup completo e setup de testes
- **Etapa 1**: Documentar estado atual do card
- **Etapa 2**: Criar testes básicos de funcionamento

#### LIMPEZA SEGURA  
- **Etapa 3**: Remover imports não utilizados (mais seguros primeiro)
- **Etapa 4**: Remover variáveis não utilizadas
- **Etapa 5**: Remover funções órfãs (começar pelas menos críticas)
- **Etapa 6**: Limpar comentários e código morto
- **Etapa 7**: Consolidar imports duplicados

#### REORGANIZAÇÃO
- **Etapa 8**: Separar lógica de negócio da UI
- **Etapa 9**: Extrair constantes e configurações
- **Etapa 10**: Reorganizar estrutura de pastas
- **Etapa 11**: Resolver sobrescritas de CSS
- **Etapa 12**: Padronizar nomes de variáveis/funções

#### OTIMIZAÇÃO
- **Etapa 13**: Otimizar re-renders desnecessários
- **Etapa 14**: Melhorar gerenciamento de estado
- **Etapa 15**: Adicionar tratamento de erros

#### VALIDAÇÃO
- **Etapa 16**: Testes finais e documentação

### REGRAS IMPORTANTES

1. **UMA ETAPA POR VEZ**: Nunca execute múltiplas etapas simultaneamente
2. **TESTE APÓS CADA ETAPA**: Sempre verifique se o card ainda funciona
3. **COMMIT APÓS CADA ETAPA**: Para facilitar rollback
4. **PARE SE QUEBRAR**: Identifique exatamente o que causou o problema
5. **DOCUMENTE PROBLEMAS**: Anote onde e por que quebrou

### COMANDOS DE CONTROLE

Forneça também estes comandos para o usuário:

```
COMANDOS PARA O USUÁRIO:

"PRÓXIMA ETAPA" - Execute a próxima etapa do roadmap
"QUEBROU NA ETAPA X" - Analise o que deu errado na etapa X
"ROLLBACK ETAPA X" - Desfaça a etapa X
"STATUS ATUAL" - Mostre em que etapa estamos
"PULAR ETAPA X" - Pule uma etapa específica (com justificativa)
"TESTE COMPLETO" - Execute todos os testes de verificação
```

### MONITORAMENTO CONTÍNUO

Em cada etapa, monitore:
- **Console do navegador** (erros JavaScript)
- **Network tab** (falhas de requisição)
- **Renderização visual** do card
- **Performance** (se aplicável)
- **Responsividade** em diferentes telas

### CRITÉRIOS DE SUCESSO

O roadmap será considerado bem-sucedido quando:
- [ ] Card de metas funciona perfeitamente
- [ ] Código está limpo e organizado
- [ ] Não há códigos órfãos
- [ ] Não há sobrescritas problemáticas
- [ ] Estrutura está bem organizada
- [ ] Performance mantida ou melhorada

Execute este roadmap de forma metódica e cuidadosa, sempre priorizando a estabilidade do sistema.

