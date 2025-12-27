/**
 * 💀 Skeleton Loader - Gerenciador PRO v9.3
 * Placeholders animados para feedback visual durante carregamento
 */

export class SkeletonLoader {
    /**
     * Cria skeleton para tabela
     * @param {number} rows - Número de linhas
     * @returns {string} HTML do skeleton
     */
    static createTableSkeleton(rows = 5) {
        const lines = Array(rows)
            .fill('')
            .map(
                () =>
                    `<div class="skeleton-line" style="margin-bottom: 12px; height: 16px;"></div>`
            )
            .join('');

        return `<div class="skeleton-loader">${lines}</div>`;
    }

    /**
     * Cria skeleton para card de estatísticas
     * @returns {string} HTML do skeleton
     */
    static createStatsSkeleton() {
        return `
            <div class="skeleton-loader">
                <div class="skeleton-header"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line"></div>
                </div>
            </div>
        `;
    }

    /**
     * Cria skeleton para timeline/cards
     * @param {number} items - Número de items
     * @returns {string} HTML do skeleton
     */
    static createCardsSkeleton(items = 3) {
        const cards = Array(items)
            .fill('')
            .map(
                () => `
                <div class="skeleton-loader" style="margin-bottom: 16px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    <div class="skeleton-header"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line short"></div>
                    </div>
                </div>
            `
            )
            .join('');

        return `<div>${cards}</div>`;
    }

    /**
     * Mostra skeleton em elemento específico
     * @param {HTMLElement|string} element - Elemento DOM ou seletor
     * @param {string} type - Tipo: 'table', 'stats', 'cards'
     * @param {Object} options - Opções (rows, items)
     */
    static show(element, type = 'table', options = {}) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;

        if (!el) {
            console.warn(`SkeletonLoader: Elemento não encontrado`);
            return;
        }

        // Salvar conteúdo original
        if (!el.dataset.skeletonOriginal) {
            el.dataset.skeletonOriginal = el.innerHTML;
        }

        // Criar skeleton baseado no tipo
        let skeletonHTML = '';

        switch (type) {
            case 'table':
                skeletonHTML = this.createTableSkeleton(options.rows || 5);
                break;
            case 'stats':
                skeletonHTML = this.createStatsSkeleton();
                break;
            case 'cards':
                skeletonHTML = this.createCardsSkeleton(options.items || 3);
                break;
            default:
                skeletonHTML = this.createTableSkeleton(3);
        }

        el.innerHTML = skeletonHTML;
        el.classList.add('skeleton-loading');
    }

    /**
     * Esconde skeleton e restaura conteúdo original
     * @param {HTMLElement|string} element - Elemento DOM ou seletor
     */
    static hide(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;

        if (!el) return;

        // Restaurar conteúdo original
        const original = el.dataset.skeletonOriginal;
        if (original !== undefined) {
            el.innerHTML = original;
            delete el.dataset.skeletonOriginal;
        }

        el.classList.remove('skeleton-loading');
    }

    /**
     * Mostra skeleton durante execução de função assíncrona
     * @param {HTMLElement|string} element - Elemento DOM ou seletor
     * @param {Function} asyncFn - Função assíncrona a executar
     * @param {string} type - Tipo de skeleton
     * @param {Object} options - Opções
     * @returns {Promise} Resultado da função
     */
    static async wrap(element, asyncFn, type = 'table', options = {}) {
        this.show(element, type, options);

        try {
            const result = await asyncFn();
            return result;
        } finally {
            this.hide(element);
        }
    }
}

// Expor globalmente para uso fácil
if (typeof window !== 'undefined') {
    window.SkeletonLoader = SkeletonLoader;
}

export default SkeletonLoader;
