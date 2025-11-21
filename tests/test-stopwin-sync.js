// 🧪 Teste automatizado: sincronização de Stop Win (%) (sidebar ↔ estado/UI)
// Execução: no console do app, rode: runStopWinSyncTest()

(function () {
	function log(prefix, level, msg, extra) {
		const tag = `[TESTE][test-stopwin-sync.js][${prefix}]`;
		(level === 'error' ? console.error : console.log)(`${tag} ${msg}`, extra || '');
	}
	const L = {
		ok: (p, m, e) => log(p, 'ok', `✅ ${m}`, e),
		info: (p, m, e) => log(p, 'info', `ℹ️ ${m}`, e),
		fail: (p, m, e) => log(p, 'error', `❌ ${m}`, e),
	};

	async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

	async function openSidebarParameters() {
		try {
			if (window.sidebar && typeof window.sidebar.navigateToSection === 'function') {
				window.sidebar.navigateToSection('parameters');
				await wait(150);
				L.ok('open', 'Sidebar/Parâmetros aberto');
				return true;
			}
			L.fail('open', 'Sidebar não disponível');
			return false;
		} catch (e) {
			L.fail('open', 'Erro ao abrir sidebar', e);
			return false;
		}
	}

	async function setStopWinSidebar(value) {
		const el = document.getElementById('sidebar-stop-win-perc');
		if (!el) { L.fail('set', 'Campo sidebar-stop-win-perc não encontrado'); return false; }
		el.focus();
		el.value = String(value);
		el.dispatchEvent(new Event('input', { bubbles: true }));
		el.dispatchEvent(new Event('change', { bubbles: true }));
		el.blur();
		await wait(120);
		L.ok('set', 'Stop Win alterado no sidebar', { value });
		return true;
	}

	async function validateStopWin(expected) {
		const cfg = Number(window.config && window.config.stopWinPerc);
		const st = Number(window.state && window.state.stopWinValor);
		// stopWinValor é calculado sobre capital início da sessão
		const base = Number(window.state && window.state.capitalInicioSessao);
		const calc = isFinite(base) ? (base * (expected / 100)) : NaN;
		const approx = (a, b) => Math.abs(Number(a) - Number(b)) < 0.5; // tolerância
		const ok = cfg === Number(expected) && (isFinite(calc) ? approx(st, calc) : true);
		(ok ? L.ok : L.fail)('validate', 'Validação Stop Win', { config: cfg, stopWinValor: st, esperadoPerc: expected, base });
		return ok;
	}

	async function run() {
		const value = 12;
		await openSidebarParameters();
		await setStopWinSidebar(value);
		await wait(100);
		const pre = await validateStopWin(value);
		// Em seguida, iniciar sessão (caso precise recalcular com base da sessão)
		if (!window.state.isSessionActive) {
			if (window.events && typeof window.events.startNewSession === 'function') window.events.startNewSession('oficial');
			else if (window.logic && typeof window.logic.startNewSession === 'function') await window.logic.startNewSession('oficial');
			await wait(200);
		}
		const post = await validateStopWin(value);
		const passed = (pre ? 1 : 0) + (post ? 1 : 0);
		const failed = 2 - passed;
		console.log(`[TESTE][test-stopwin-sync.js][runStopWinSyncTest] RESUMO → total: 2, passaram: ${passed}, falharam: ${failed}`);
		return { passed, failed };
	}

	if (typeof window !== 'undefined') {
		window.runStopWinSyncTest = run;
		L.info('init', 'Carregado. Execute runStopWinSyncTest()');
	}
})();





