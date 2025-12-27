// ================================================================
// GOOGLE ANALYTICS 4 - Tracking
// ================================================================

// Initialize dataLayer
window.dataLayer = window.dataLayer || [];

function gtag() {
    dataLayer.push(arguments);
}

// Initialize GA4
gtag('js', new Date());

// IMPORTANTE: Substitua 'G-XXXXXXXXXX' pelo seu Google Analytics ID
// Obtenha em: https://analytics.google.com/
gtag('config', 'G-XXXXXXXXXX');

// ================================================================
// Helper function para track de eventos customizados
// ================================================================
window.trackEvent = function (eventName, params = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, params);
        console.log('📊 Analytics event:', eventName, params);
    }
};

// ================================================================
// Eventos automáticos úteis
// ================================================================

// Track nova sessão
window.addEventListener('load', () => {
    if (typeof window.trackEvent === 'function') {
        trackEvent('app_loaded', {
            timestamp: new Date().toISOString()
        });
    }
});

console.log('📊 Google Analytics inicializado (requer ID válido)');
