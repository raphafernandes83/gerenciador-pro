/**
 * 📊 INICIALIZADOR DE ÍCONES DE AJUDA - ABA ANÁLISE
 * Injeta ícones (?) dinamicamente via JavaScript
 * Solução para contornar cache do servidor
 * 
 * @version 1.0.0
 */

class AnalysisHelpIcons {
    constructor() {
        this.iconsInjected = false;
    }

    /**
     * Cria um botão de ajuda (?)
     */
    createHelpIcon(metricId, value = 'default') {
        const button = document.createElement('button');
        button.className = 'help-icon';
        button.setAttribute('data-metric', metricId);
        button.setAttribute('data-value', value);
        button.setAttribute('aria-label', `Ajuda sobre ${metricId}`);
        button.setAttribute('title', 'Clique para mais informações');

        const span = document.createElement('span');
        span.className = 'icon';
        span.textContent = '?';

        button.appendChild(span);
        return button;
    }

    /**
     * Injeta ícone no seletor de dimensões
     */
    injectDimensionSelectorIcon() {
        const selector = document.getElementById('analise-dimension-select');
        if (!selector) {
            console.warn('⚠️ Seletor de dimensões não encontrado');
            return false;
        }

        // Verifica se já existe ícone
        const parent = selector.parentElement;
        if (parent.querySelector('.help-icon[data-metric="analise-dimensao-selector"]')) {
            console.log('✅ Ícone do seletor já existe');
            return true;
        }

        // Cria wrapper flexbox se ainda não existir
        if (parent.style.display !== 'flex') {
            parent.style.display = 'flex';
            parent.style.alignItems = 'center';
            parent.style.gap = '8px';
            selector.style.flex = '1';
        }

        // Cria e injeta ícone
        const icon = this.createHelpIcon('analise-dimensao-selector', 'selector');
        parent.appendChild(icon);

        console.log('✅ Ícone do seletor de dimensões injetado');
        return true;
    }

    /**
     * Injeta ícone no cabeçalho da tabela
     */
    injectTableHeaderIcon() {
        const tableContainer = document.querySelector('#analise-desempenho .overflow-x-auto');
        if (!tableContainer) {
            console.warn('⚠️ Container da tabela não encontrado');
            return false;
        }

        // Verifica se já existe cabeçalho com ícone
        let header = tableContainer.querySelector('h3');
        if (header && header.querySelector('.help-icon')) {
            console.log('✅ Ícone da tabela já existe');
            return true;
        }

        // Cria cabeçalho se não existir
        if (!header) {
            header = document.createElement('h3');
            header.style.marginBottom = '12px';
            header.style.display = 'flex';
            header.style.alignItems = 'center';
            header.style.gap = '8px';

            const title = document.createTextNode('Resultados por Categoria');
            header.appendChild(title);

            // Insere antes da tabela
            const table = tableContainer.querySelector('table');
            if (table) {
                tableContainer.insertBefore(header, table);
            } else {
                tableContainer.prepend(header);
            }
        } else {
            // Ajusta estilo do cabeçalho existente
            header.style.display = 'flex';
            header.style.alignItems = 'center';
            header.style.gap = '8px';
        }

        // Cria e injeta ícone
        const icon = this.createHelpIcon('analise-tabela-categoria', 'table');
        header.appendChild(icon);

        console.log('✅ Ícone do cabeçalho da tabela injetado');
        return true;
    }

    /**
     * Inicializa todos os ícones da aba Análise
     */
    init() {
        // Só executa se estiver na aba Análise
        const analiseTab = document.getElementById('analise-content');
        if (!analiseTab || !analiseTab.classList.contains('active')) {
            console.log('📋 Aba Análise não está ativa, aguardando...');
            return false;
        }

        if (this.iconsInjected) {
            console.log('✅ Ícones da Análise já foram injetados');
            return true;
        }

        console.log('🚀 Injetando ícones de ajuda na aba Análise...');

        const selectorOk = this.injectDimensionSelectorIcon();
        const tableOk = this.injectTableHeaderIcon();

        if (selectorOk && tableOk) {
            this.iconsInjected = true;
            console.log('✅ Todos os ícones da Análise injetados com sucesso!');

            // Re-inicializa os tooltips para pegar os novos ícones
            if (window.metricTooltips) {
                window.metricTooltips.attachHelpIconListeners();
                console.log('✅ Listeners dos tooltips re-anexados');
            }

            return true;
        } else {
            console.warn('⚠️ Alguns ícones não puderam ser injetados');
            return false;
        }
    }

    /**
     * Injeta ícones quando a aba Análise é aberta
     */
    initOnTabSwitch() {
        // Observer para detectar quando a aba Análise fica ativa
        const observer = new MutationObserver(() => {
            const analiseTab = document.getElementById('analise-content');
            if (analiseTab && analiseTab.classList.contains('active')) {
                setTimeout(() => this.init(), 100);
            }
        });

        // Observa mudanças nas classes das abas
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(tab => {
            observer.observe(tab, { attributes: true, attributeFilter: ['class'] });
        });

        // Tenta injetar imediatamente se a aba já estiver ativa
        setTimeout(() => this.init(), 500);

        console.log('👀 Observer de aba Análise ativado');
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.analysisHelpIcons = new AnalysisHelpIcons();
        window.analysisHelpIcons.initOnTabSwitch();
    });
} else {
    // DOM já está pronto
    window.analysisHelpIcons = new AnalysisHelpIcons();
    window.analysisHelpIcons.initOnTabSwitch();
}

console.log('📦 AnalysisHelpIcons carregado');
