/*
 * Runtime Monitor (injeção não persistente)
 * Uso no console do navegador após a página carregar:
 *   await loadRuntimeMonitor();
 *   monitor.wrapSuspectsFromReport('RELATORIO_FUNCOES_FORTE.json'); // opcional se relatório existir no mesmo host
 *   // ou
 *   monitor.wrapByName(['logic.finalizarRegistroOperacao', 'ui.renderizarTimelineCompleta']);
 */

(function () {
    const seen = new WeakMap();
    const registry = new Map();

    function isFunction(value) {
        return typeof value === 'function';
    }

    function createWrapper(fn, meta) {
        // Evita duplo-encapsulamento: se já é um wrapper nosso, não re-encapar
        const existing = registry.get(meta.name);
        if (existing && fn === existing.wrapped) {
            return existing.wrapped;
        }
        // Evita re-wrapping do mesmo original
        if (seen.has(fn)) return seen.get(fn);
        const wrapped = function (...args) {
            try {
                const err = new Error();
                const stack = err.stack?.split('\n').slice(1).join('\n');
                const payload = {
                    nome: meta.name,
                    arquivo: meta.file,
                    linha: meta.startLine,
                    parametros: args,
                    timestamp: new Date().toISOString(),
                };
                console.warn(
                    '\n⚠️ ALERTA: Função suspeita executada!\n' +
                        `Nome: ${payload.nome}\n` +
                        `Arquivo: ${payload.arquivo}:${payload.linha}\n` +
                        `Parâmetros: ${JSON.stringify(payload.parametros)}\n` +
                        `Stack Trace: \n${stack}\n`
                );

                // Bônus: alertas extras
                if (args.some((a) => a === null || a === undefined)) {
                    console.warn('🔎 Parâmetros contêm null/undefined');
                }
                const start = performance.now();
                const res = fn.apply(this, args);
                const end = performance.now();
                if (end - start > 50) {
                    // heurística de lentidão
                    console.warn(`🐢 Execução lenta (${Math.round(end - start)}ms): ${meta.name}`);
                }
                return res;
            } catch (e) {
                console.warn('🚨 Erro durante monitoramento da função:', meta.name, e);
                return fn.apply(this, args);
            }
        };
        seen.set(fn, wrapped);
        registry.set(meta.name, { meta, wrapped, original: fn });
        return wrapped;
    }

    function resolvePath(name) {
        // suporta caminhos como 'ui.renderizarTimelineCompleta' ou 'window.logic.finalizarRegistroOperacao'
        const parts = name.replace(/^window\./, '').split('.');
        let ctx = window;
        for (let i = 0; i < parts.length - 1; i++) {
            ctx = ctx?.[parts[i]];
            if (!ctx) return {};
        }
        const key = parts[parts.length - 1];
        return { ctx, key };
    }

    function wrapByName(names) {
        const installed = [];
        names.forEach((n) => {
            const { ctx, key } = resolvePath(n);
            if (!ctx || !ctx[key] || !isFunction(ctx[key])) return;
            const current = ctx[key];
            const existing = registry.get(n);
            if (existing && current === existing.wrapped) {
                // já encapado
                installed.push(n);
                return;
            }
            const meta = { name: n, file: 'desconhecido', startLine: 'n/d' };
            ctx[key] = createWrapper(current, meta);
            installed.push(n);
        });
        console.log('✅ Monitor: wrappers instalados para', installed);
    }

    async function wrapSuspectsFromReport(jsonPath) {
        try {
            const res = await fetch(jsonPath, { cache: 'no-store' });
            const report = await res.json();
            const names = new Set();
            (report.suspects || []).forEach((s) => {
                const def = s.fn || (s.defs && s.defs[0]);
                const name = def?.name || s.name;
                if (name) names.add(name);
            });
            wrapByName([...names]);
        } catch (e) {
            console.warn('⚠️ Monitor: não foi possível carregar o relatório:', e);
        }
    }

    function unwrapByName(names) {
        const restored = [];
        names.forEach((n) => {
            const rec = registry.get(n);
            if (!rec) return;
            const { ctx, key } = resolvePath(n);
            if (ctx && ctx[key] === rec.wrapped) {
                ctx[key] = rec.original;
                restored.push(n);
            }
            registry.delete(n);
        });
        if (restored.length) console.log('🧹 Wrappers removidos:', restored);
        return restored;
    }

    function unwrapAll() {
        const entries = Array.from(registry.entries());
        const restored = [];
        entries.forEach(([name, rec]) => {
            const { ctx, key } = resolvePath(name);
            if (ctx && ctx[key] === rec.wrapped) {
                ctx[key] = rec.original;
                restored.push(name);
            }
            registry.delete(name);
        });
        console.log('🧹 Wrappers removidos (total):', restored.length);
        return restored;
    }

    function getNames() {
        return Array.from(registry.keys());
    }

    function status() {
        const names = getNames();
        console.table(names.map((n) => ({ name: n })));
        return { total: names.length, names };
    }

    function wrapCriticalFlow() {
        // modo leve sugerido
        wrapByName([
            'ui.renderizarTimelineCompleta',
            'ui._atualizarTudoInterno',
            'events.handleFinishSession',
            'logic.finalizarRegistroOperacao',
            'TradingOperationsManager._updateAllUI',
        ]);
    }

    window.monitor = {
        wrapByName,
        wrapSuspectsFromReport,
        unwrapByName,
        unwrapAll,
        getNames,
        status,
        wrapCriticalFlow,
        registry,
    };
    window.loadRuntimeMonitor = async () => {
        console.log(
            '🛡️ Runtime monitor carregado. Exemplos:\n' +
                ' - monitor.wrapByName(["ui.renderizarTimelineCompleta"])\n' +
                ' - monitor.wrapSuspectsFromReport("RELATORIO_FUNCOES_FORTE.json")\n' +
                ' - monitor.unwrapAll()\n' +
                ' - monitor.wrapCriticalFlow() // modo leve'
        );
    };
})();
