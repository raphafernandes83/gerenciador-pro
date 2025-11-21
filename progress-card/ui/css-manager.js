/**
 * 🎨 CSS Manager - Gerenciador de Estilos Dinâmicos
 * 
 * Sistema para aplicar estilos dinamicamente sem conflitos,
 * substituindo manipulação inline por classes CSS organizadas.
 * 
 * @author Sistema de Gerenciamento PRO
 * @version 1.0.0
 */

// ============================================================================
// IMPORTS - Organizados por categoria
// ============================================================================

// Constants
import { CSS_CLASSES, COLORS } from '../config/constants.js';

// Utilities
import { logger } from '../../src/utils/Logger.js';

// ============================================================================
// GERENCIAMENTO DE CLASSES CSS
// ============================================================================

/**
 * 🎨 Aplica estado visual usando classes CSS em vez de estilos inline
 * @param {HTMLElement} element - Elemento DOM
 * @param {Object} visualState - Estado visual determinado
 */
export function applyVisualState(element, visualState) {
    if (!element) return;
    
    try {
        // Remove classes anteriores
        element.classList.remove(
            CSS_CLASSES.TEXT_NEUTRAL,
            CSS_CLASSES.TEXT_POSITIVE,
            CSS_CLASSES.TEXT_NEGATIVE
        );
        
        // Remove atributos de dados anteriores
        element.removeAttribute('data-trend');
        element.removeAttribute('data-magnitude');
        
        // Aplica nova classe base
        element.className = visualState.className;
        
        // Define variáveis CSS customizadas em vez de estilos inline
        element.style.setProperty('--metric-color', visualState.color);
        element.style.setProperty('--metric-weight', visualState.fontWeight);
        
        // Aplica atributos de dados
        Object.entries(visualState.dataAttributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        
        // Aplica título
        element.setAttribute('title', visualState.title);
        
        logger.debug('🎨 Estado visual aplicado via CSS Manager:', {
            element: element.id || element.className,
            state: visualState.className
        });
        
    } catch (error) {
        logger.error('❌ Erro ao aplicar estado visual:', { error: String(error) });
    }
}

/**
 * 🏷️ Gerencia exibição de badges usando classes CSS
 * @param {HTMLElement} badge - Elemento do badge
 * @param {Object} badgeState - Estado do badge
 */
export function manageBadgeDisplay(badge, badgeState) {
    if (!badge) return;
    
    try {
        if (badgeState.show) {
            // Remove classes anteriores
            badge.classList.remove(CSS_CLASSES.BADGE_POSITIVE, CSS_CLASSES.BADGE_NEGATIVE);
            
            // Aplica conteúdo e classes
            badge.textContent = badgeState.value;
            badge.className = `${CSS_CLASSES.BADGE} ${badgeState.className} show`;
            badge.setAttribute('title', badgeState.title);
            
            // Define display via variável CSS
            badge.style.setProperty('--badge-display', 'inline-flex');
            
        } else {
            // Oculta badge
            badge.classList.remove('show');
            badge.style.setProperty('--badge-display', 'none');
        }
        
    } catch (error) {
        logger.error('❌ Erro ao gerenciar badge:', { error: String(error) });
    }
}

/**
 * 🎨 Aplica tema dinâmico usando classes CSS
 * @param {Object} colorScheme - Esquema de cores
 */
export function applyTheme(colorScheme) {
    const cardElement = document.querySelector('.progress-card');
    if (!cardElement) return;
    
    try {
        // Remove temas anteriores
        cardElement.classList.remove(
            'theme-neutral',
            'theme-success',
            'theme-danger',
            'theme-warning'
        );
        
        // Aplica novo tema
        cardElement.classList.add(`theme-${colorScheme.theme}`);
        
        // Define variáveis CSS customizadas para o tema
        cardElement.style.setProperty('--primary-color', colorScheme.primary);
        cardElement.style.setProperty('--secondary-color', colorScheme.secondary);
        cardElement.style.setProperty('--accent-color', colorScheme.accent);
        
        logger.debug('🎨 Tema aplicado via CSS Manager:', {
            theme: colorScheme.theme,
            colors: colorScheme
        });
        
    } catch (error) {
        logger.error('❌ Erro ao aplicar tema:', { error: String(error) });
    }
}

/**
 * 🧹 Limpa todos os estilos dinâmicos e reseta para estado neutro
 */
export function resetStyles() {
    try {
        const cardElement = document.querySelector('.progress-card');
        if (cardElement) {
            // Remove temas
            cardElement.classList.remove(
                'theme-success',
                'theme-danger', 
                'theme-warning'
            );
            cardElement.classList.add('theme-neutral');
            
            // Remove variáveis CSS customizadas
            cardElement.style.removeProperty('--primary-color');
            cardElement.style.removeProperty('--secondary-color');
            cardElement.style.removeProperty('--accent-color');
        }
        
        // Reset elementos de métricas
        const metricElements = document.querySelectorAll('.metric-value');
        metricElements.forEach(element => {
            element.className = `${CSS_CLASSES.METRIC_VALUE} ${CSS_CLASSES.TEXT_NEUTRAL}`;
            element.style.removeProperty('--metric-color');
            element.style.removeProperty('--metric-weight');
            element.removeAttribute('data-trend');
            element.removeAttribute('data-magnitude');
        });
        
        // Reset badges
        const badges = document.querySelectorAll('.badge');
        badges.forEach(badge => {
            badge.classList.remove('show');
            badge.style.setProperty('--badge-display', 'none');
        });
        
        logger.debug('🧹 Estilos resetados via CSS Manager');
        
    } catch (error) {
        logger.error('❌ Erro ao resetar estilos:', { error: String(error) });
    }
}

/**
 * 🎭 Aplica animação usando classes CSS
 * @param {HTMLElement} element - Elemento a animar
 * @param {string} animationClass - Classe de animação
 * @param {number} duration - Duração em ms (opcional)
 */
export function applyAnimation(element, animationClass, duration = 500) {
    if (!element) return;
    
    try {
        element.classList.add(animationClass);
        
        // Remove a classe após a duração
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, duration);
        
    } catch (error) {
        logger.error('❌ Erro ao aplicar animação:', { error: String(error) });
    }
}

/**
 * 📱 Aplica estilos responsivos baseados no viewport
 */
export function applyResponsiveStyles() {
    const cardElement = document.querySelector('.progress-card');
    if (!cardElement) return;
    
    try {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            cardElement.classList.add('mobile-layout');
        } else {
            cardElement.classList.remove('mobile-layout');
        }
        
    } catch (error) {
        logger.error('❌ Erro ao aplicar estilos responsivos:', { error: String(error) });
    }
}

/**
 * 🔍 Verifica e resolve conflitos de CSS
 */
export function resolveStyleConflicts() {
    try {
        // Remove estilos inline conflitantes
        const elementsWithInlineStyles = document.querySelectorAll('[style*="color"], [style*="font-weight"]');
        
        elementsWithInlineStyles.forEach(element => {
            if (element.classList.contains('metric-value')) {
                // Preserva apenas as variáveis CSS customizadas
                const color = element.style.getPropertyValue('--metric-color');
                const weight = element.style.getPropertyValue('--metric-weight');
                
                // Remove todos os estilos inline
                element.removeAttribute('style');
                
                // Reaplica apenas as variáveis necessárias
                if (color) element.style.setProperty('--metric-color', color);
                if (weight) element.style.setProperty('--metric-weight', weight);
            }
        });
        
        logger.debug('🔍 Conflitos de CSS resolvidos');
        
    } catch (error) {
        logger.error('❌ Erro ao resolver conflitos:', { error: String(error) });
    }
}

// ============================================================================
// INICIALIZAÇÃO E EVENTOS
// ============================================================================

/**
 * 🚀 Inicializa o CSS Manager
 */
export function initializeCSSManager() {
    try {
        // Carrega o CSS do módulo se não estiver carregado
        if (!document.querySelector('link[href*="progress-card.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = './progress-card/styles/progress-card.css';
            document.head.appendChild(link);
        }
        
        // Aplica estilos responsivos iniciais
        applyResponsiveStyles();
        
        // Resolve conflitos existentes
        resolveStyleConflicts();
        
        // Adiciona listener para redimensionamento
        window.addEventListener('resize', applyResponsiveStyles);
        
        logger.debug('🚀 CSS Manager inicializado');
        
    } catch (error) {
        logger.error('❌ Erro ao inicializar CSS Manager:', { error: String(error) });
    }
}

// ============================================================================
// EXPOSIÇÃO GLOBAL DAS FUNÇÕES
// ============================================================================

if (typeof window !== 'undefined') {
    window.applyVisualState = applyVisualState;
    window.manageBadgeDisplay = manageBadgeDisplay;
    window.applyTheme = applyTheme;
    window.resetStyles = resetStyles;
    window.applyAnimation = applyAnimation;
    window.resolveStyleConflicts = resolveStyleConflicts;
    window.initializeCSSManager = initializeCSSManager;
    
    logger.debug('🎨 CSS Manager disponível globalmente');
}




