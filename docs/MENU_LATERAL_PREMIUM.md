# 📱 Menu Lateral Premium - Documentação

## 🎯 Visão Geral

O menu lateral premium é um componente avançado que oferece acesso rápido às
configurações e parâmetros do sistema de trading.

## ✨ Recursos

### 🎨 Visual Premium

- **Glassmorphism**: Efeito de vidro fosco com blur
- **Animações Suaves**: Transições fluidas com cubic-bezier
- **Micro-interações**: Ripple effects, hover states, glow
- **Temas**: Adaptação automática aos temas dark/light/moderno

### 🔧 Funcionalidades

- **5 Seções Principais**:
    1. 👤 **Perfil**: Configurações do trader
    2. 📊 **Parâmetros e Controles**: Card sempre visível
    3. ⚙️ **Gerenciamento**: Modo guiado, incorporar lucros, bloqueio
    4. 🎨 **Aparência**: Seleção de temas
    5. ⚡ **Preferências**: Notificações, sons, modo Zen

### ⌨️ Atalhos de Teclado

- `Ctrl/Cmd + B`: Abrir/fechar menu
- `1-5`: Navegação rápida (quando expandido)
- `ESC`: Fechar menu
- `Tab`: Navegar entre opções
- `Enter/Space`: Ativar item selecionado

### 🔊 Efeitos Sonoros

- Som suave ao abrir/fechar (respeitando configuração de sons)
- Feedback sonoro nos cliques

### ♿ Acessibilidade

- **ARIA Labels**: Completo suporte para screen readers
- **Navegação por Teclado**: 100% acessível via teclado
- **Estados Dinâmicos**: aria-expanded, aria-current
- **Roles Semânticos**: navigation, button, region

## 📲 Responsividade

### Desktop

- Menu lateral fixo à esquerda
- Estados expandido (280px) e retraído (70px)
- Ajuste automático do container principal

### Mobile

- Menu em overlay com backdrop blur
- Botão de acesso rápido flutuante
- Auto-fechamento após navegação

## 🚀 Como Usar

### Abertura

1. **Clique** no botão ☰ no canto inferior esquerdo
2. **Use** `Ctrl+B` para toggle rápido
3. **Em mobile**: Toque no botão flutuante

### Navegação

1. **Clique** nos itens do menu
2. **Use** teclas numéricas 1-5 para acesso rápido
3. **Tab** para navegar com teclado

### Configurações

- As mudanças são aplicadas imediatamente
- Persistência automática em localStorage
- Feedback visual de sucesso

## 🎯 Estados Visuais

### Loading

- Spinner animado durante transições
- Skeleton loading para conteúdo
- Blur effect durante navegação

### Feedback

- Ripple effect nos cliques
- Success pulse notifications
- Glow no hover e estados ativos

## 🔧 Integração

O menu lateral se integra perfeitamente com:

- Sistema de configurações existente
- Gerenciamento de estado global
- Sistema de notificações
- Temas da aplicação

## 💡 Dicas

1. **Produtividade**: Use os atalhos numéricos para navegação rápida
2. **Mobile**: O menu fecha automaticamente após seleção
3. **Parâmetros**: O card está sempre visível para referência rápida
4. **Sons**: Desative em Preferências se preferir silêncio

## 🐛 Troubleshooting

### Menu não abre

- Verifique se a sidebar foi inicializada corretamente
- Tente usar o atalho `Ctrl+B`

### Botão não aparece

- Recarregue a página
- Verifique o console para erros

### Sons não funcionam

- Verifique se os sons estão ativados nas Preferências
- Alguns navegadores bloqueiam autoplay de áudio

---

**Desenvolvido com ❤️ para traders profissionais**
