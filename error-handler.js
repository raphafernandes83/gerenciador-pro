// ================================================================
// GLOBAL ERROR HANDLER
// Captura erros não tratados para debugging
// ================================================================

// Handler para erros síncronos
window.addEventListener('error', (event) => {
    if (typeof logger !== 'undefined') {
        logger.error('❌ Uncaught Error:', {
            message: event.message,
            file: event.filename,
            line: event.lineno,
            column: event.colno,
            stack: event.error?.stack
        });
    } else {
        console.error('❌ Uncaught Error:', event.message);
    }
});

// Handler para Promise rejections
window.addEventListener('unhandledrejection', (event) => {
    if (typeof logger !== 'undefined') {
        logger.error('❌ Unhandled Promise Rejection:', {
            reason: event.reason,
            promise: event.promise
        });
    } else {
        console.error('❌ Unhandled Promise:', event.reason);
    }

    // Previne erro não tratado no console
    event.preventDefault();
});

console.log('✅ Global error handler ativo');
