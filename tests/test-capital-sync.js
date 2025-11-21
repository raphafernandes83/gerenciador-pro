// 🧪 Teste automatizado: sincronização de Capital Inicial (sidebar → sessão)
// Execução: no console do app, rode: runCapitalSyncTest()

(function () {
	function logOk(msg, extra) {
		console.log(`[TESTE][test-capital-sync.js][runCapitalSyncTest] ✅ ${msg}`, extra || '');
	}
	function logInfo(msg, extra) {
		console.log(`[TESTE][test-capital-sync.js][runCapitalSyncTest] ℹ️ ${msg}`, extra || '');
	}
	function logFail(msg, extra) {
		console.error(`[TESTE][test-capital-sync.js][runCapitalSyncTest] ❌ ${msg}`, extra || '');
	}

	async function wait(ms) {
		return new Promise((r) => setTimeout(r, ms));
	}

	async function ensureSidebarParametersOpen() {
		try {
			if (!window.sidebar || typeof window.sidebar.navigateToSection !== 'function') {
				logInfo('Sidebar não inicializado. Tentando inicializar via botão/menu…');
				const openBtn = document.querySelector('[data-open-sidebar]') || document.querySelector('#sidebar-toggle');
				openBtn && openBtn.click();
				await wait(150);
			}
			if (window.sidebar && typeof window.sidebar.navigateToSection === 'function') {
				window.sidebar.navigateToSection('parameters');
				await wait(200);
				logOk('Sidebar aberto na seção Parâmetros');
				return true;
			}
			logFail('Não foi possível abrir a seção Parâmetros do sidebar');
			return false;
		} catch (e) {
			logFail('Erro ao abrir sidebar', e);
			return false;
		}
	}

	async function typeCapitalAndCommit(value) {
		const input = document.getElementById('sidebar-capital-inicial');
		if (!input) {
			logFail('Campo sidebar-capital-inicial não encontrado');
			return false;
		}
		input.focus();
		input.value = String(value);
		input.dispatchEvent(new Event('input', { bubbles: true }));
		// Pressiona Enter (equivalente ao blur+commit no controller)
		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		input.blur();
		input.dispatchEvent(new Event('change', { bubbles: true }));
		await wait(120);
		logOk('Valor digitado e commit disparado', { value });
		return true;
	}

	async function startSession() {
		try {
			if (window.events && typeof window.events.startNewSession === 'function') {
				window.events.startNewSession('oficial');
			} else if (window.logic && typeof window.logic.startNewSession === 'function') {
				await window.logic.startNewSession('oficial');
			} else {
				logFail('Não foi possível iniciar sessão (events/logic ausentes)');
				return false;
			}
			await wait(200);
			logOk('Sessão iniciada');
			return true;
		} catch (e) {
			logFail('Erro ao iniciar sessão', e);
			return false;
		}
	}

	async function validateCapital(expected) {
		const cfg = window.config && window.config.capitalInicial;
		const stInicio = window.state && window.state.capitalInicioSessao;
		const stAtual = window.state && window.state.capitalAtual;
		const ok = Number(cfg) === Number(expected) && Number(stInicio) === Number(expected) && Number(stAtual) === Number(expected);
		(ok ? logOk : logFail)(`Validação do capital`, { config: cfg, capitalInicioSessao: stInicio, capitalAtual: stAtual, expected });
		return ok;
	}

	async function run() {
		const value = 2222;
		logInfo('Iniciando teste com valor 2222');
		const opened = await ensureSidebarParametersOpen();
		if (!opened) return { passed: 0, failed: 1 };
		const typed = await typeCapitalAndCommit(value);
		if (!typed) return { passed: 0, failed: 1 };
		// Verifica antes da sessão
		const preOk = await validateCapital(value);
		await startSession();
		// Verifica após iniciar sessão
		const postOk = await validateCapital(value);
		const passed = (preOk ? 1 : 0) + (postOk ? 1 : 0);
		const failed = 2 - passed;
		console.log(`[TESTE][test-capital-sync.js][runCapitalSyncTest] RESUMO → total: 2, passaram: ${passed}, falharam: ${failed}`);
		return { passed, failed };
	}

	if (typeof window !== 'undefined') {
		window.runCapitalSyncTest = run;
		logInfo('Carregado. Execute runCapitalSyncTest()');
	}
})();





