/**
 * 🛡️ PROXY DETECTOR - CHECKPOINT 1.3d
 * 
 * Detecta e loga acessos diretos a window.state que deveriam usar StateManager
 * Usado apenas em desenvolvimento para ajudar na migração
 */

export function createStateAccessDetector() {
    if (!window.state || typeof window.state !== 'object') {
        console.warn('[StateDetector] window.state não encontrado');
        return null;
    }

    // Armazena o state original
    const originalState = window.state;

    // Lista de propriedades que já foram migradas
    const migratedProperties = [
        'capitalAtual',
        'isSessionActive',
        'sessionMode',
        'dashboardFilterMode',
        'dashboardFilterPeriod'
    ];

    // Contador de acessos
    const accessLog = {
        reads: new Map(),
        writes: new Map()
    };

    // Cria o Proxy
    const stateProxy = new Proxy(originalState, {
        get(target, prop) {
            // Ignora propriedades internas e métodos
            if (typeof prop === 'symbol' || prop.startsWith('__')) {
                return Reflect.get(target, prop);
            }

            // Conta o acesso
            const count = accessLog.reads.get(prop) || 0;
            accessLog.reads.set(prop, count + 1);

            // Alerta se é propriedade migrada
            if (migratedProperties.includes(prop)) {
                console.warn(
                    `⚠️ [StateDetector] Leitura direta de state.${prop}`,
                    `\n   Use: stateManager.getState().${prop}`,
                    `\n   Stack:`, new Error().stack
                );
            }

            return Reflect.get(target, prop);
        },

        set(target, prop, value) {
            // Ignora propriedades internas
            if (typeof prop === 'symbol' || prop.startsWith('__')) {
                return Reflect.set(target, prop, value);
            }

            // Conta a modificação
            const count = accessLog.writes.get(prop) || 0;
            accessLog.writes.set(prop, count + 1);

            // Alerta SEMPRE para escritas diretas
            if (migratedProperties.includes(prop)) {
                console.error(
                    `🚨 [StateDetector] Escrita direta em state.${prop} = ${value}`,
                    `\n   Use: stateManager.setState({ ${prop}: ${JSON.stringify(value)} }, 'source')`,
                    `\n   Stack:`, new Error().stack
                );
            } else {
                console.warn(
                    `⚠️ [StateDetector] Escrita em state.${prop} (ainda não migrado)`,
                    `\n   Considere migrar para StateManager`
                );
            }

            // Permite a escrita mas loga
            return Reflect.set(target, prop, value);
        }
    });

    // Expõe funções para análise
    stateProxy.__getAccessLog = () => {
        return {
            reads: Array.from(accessLog.reads.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([prop, count]) => ({ property: prop, count })),
            writes: Array.from(accessLog.writes.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([prop, count]) => ({ property: prop, count }))
        };
    };

    stateProxy.__clearLog = () => {
        accessLog.reads.clear();
        accessLog.writes.clear();
        console.log('[StateDetector] Log limpo');
    };

    return stateProxy;
}

/**
 * Ativa o detector substituindo window.state
 */
export function enableStateDetector() {
    if (typeof window === 'undefined') return;

    const detector = createStateAccessDetector();
    if (detector) {
        window.state = detector;
        console.log('🛡️ [StateDetector] ATIVADO');
        console.log('📊 Para ver o log: window.state.__getAccessLog()');
        console.log('🧹 Para limpar: window.state.__clearLog()');

        // Expõe globalmente para debug
        window.__stateDetector = {
            getLog: () => window.state.__getAccessLog(),
            clearLog: () => window.state.__clearLog()
        };
    }
}

/**
 * Para uso em desenvolvimento - ativa automaticamente se DEV mode
 */
if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    // Não ativar automaticamente - apenas exportar
    console.log('🛡️ [StateDetector] Disponível - use enableStateDetector() para ativar');
}
