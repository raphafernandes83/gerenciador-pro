// ================================================================
// EnvProvider.js - Fornece variáveis de ambiente de forma segura
// ================================================================

/**
 * Lê variáveis de ambiente de múltiplas fontes sem vazar segredos em logs.
 * Prioridade:
 * 1) window.__ENV__ (configurado via script inline)
 * 2) <meta name="supabase-url" content="..."> e <meta name="supabase-anon-key" content="...">
 * 3) localStorage: SUPABASE_URL, SUPABASE_ANON_KEY (apenas em dev)
 * 4) process.env (quando disponível em bundlers)
 * 5) Fallback vazio (requer configuração externa)
 */
export function getSupabaseEnv() {
    let url = '';
    let anonKey = '';
    const isDevelopment =
        typeof location !== 'undefined' &&
        (location.hostname === 'localhost' ||
            location.hostname === '127.0.0.1' ||
            location.hostname === '0.0.0.0');

    try {
        // 1) window.__ENV__ (Configuração de produção)
        if (typeof window !== 'undefined' && window.__ENV__) {
            url = window.__ENV__.SUPABASE_URL || url;
            anonKey = window.__ENV__.SUPABASE_ANON_KEY || anonKey;
        }

        // 2) <meta> tags (Configuração de deploy)
        if (typeof document !== 'undefined') {
            const urlMeta = document.querySelector('meta[name="supabase-url"]');
            const keyMeta = document.querySelector('meta[name="supabase-anon-key"]');
            if (urlMeta && urlMeta.content) url = url || urlMeta.content;
            if (keyMeta && keyMeta.content) anonKey = anonKey || keyMeta.content;
        }

        // 3) localStorage (desenvolvimento)
        if (isDevelopment && typeof localStorage !== 'undefined') {
            url = url || localStorage.getItem('SUPABASE_URL') || '';
            anonKey = anonKey || localStorage.getItem('SUPABASE_ANON_KEY') || '';
        }

        // 4) process.env (bundlers) - com proteção
        try {
            if (typeof process !== 'undefined' && process.env) {
                url = url || process.env.SUPABASE_URL || '';
                anonKey = anonKey || process.env.SUPABASE_ANON_KEY || '';
            }
        } catch (processError) {
            // process não disponível no browser - ignorar silenciosamente
        }

        // 5) Fallback para desenvolvimento local
        if (isDevelopment && (!url || !anonKey)) {
            url = url || 'http://localhost:54321';
            anonKey =
                anonKey ||
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
            console.info('🔧 Usando configuração Supabase de desenvolvimento local');
        }
    } catch (error) {
        console.warn('⚠️ Erro ao carregar configuração Supabase:', error.message);
    }

    // 🛡️ Validação final
    if (!url || !anonKey) {
        console.warn('⚠️ Configuração Supabase incompleta. Sistema funcionará em modo offline.');
        return {
            url: url || 'offline',
            anonKey: anonKey || 'offline',
            isOfflineMode: true,
        };
    }

    return { url, anonKey, isOfflineMode: false };
}

/**
 * Máscara uma chave para logs seguros.
 */
export function maskKey(key) {
    if (!key || typeof key !== 'string') return '';
    if (key.length <= 8) return '****';
    return `${key.slice(0, 4)}****${key.slice(-4)}`;
}

/**
 * Detecta com segurança se estamos em ambiente de desenvolvimento.
 * - Suporta Node (process.env)
 * - Suporta browser (window.__ENV__)
 * - Fallback por hostname local
 */
export function isDevelopment() {
    try {
        try {
            if (
                typeof process !== 'undefined' &&
                process.env &&
                typeof process.env.NODE_ENV === 'string'
            ) {
                return process.env.NODE_ENV === 'development';
            }
        } catch (processError) {
            // process não disponível no browser - usar fallback
        }
        if (
            typeof window !== 'undefined' &&
            window.__ENV__ &&
            typeof window.__ENV__.NODE_ENV === 'string'
        ) {
            return window.__ENV__.NODE_ENV === 'development';
        }
        if (typeof location !== 'undefined' && typeof location.hostname === 'string') {
            return /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
        }
    } catch (_) {
        // silencioso por segurança
    }
    return false;
}
