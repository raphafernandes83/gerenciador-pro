// 🧪 Teste automatizado: sincronização de Stop Loss (%) (sidebar ↔ estado/UI)
// Execução: runStopLossSyncTest()

(function () {
  function log(prefix, level, msg, extra) {
    const tag = `[TESTE][test-stoploss-sync.js][${prefix}]`;
    (level === 'error' ? console.error : console.log)(`${tag} ${msg}`, extra || '');
  }
  const L = {
    ok: (p, m, e) => log(p, 'ok', `✅ ${m}`, e),
    info: (p, m, e) => log(p, 'info', `ℹ️ ${m}`, e),
    fail: (p, m, e) => log(p, 'error', `❌ ${m}`, e),
  };

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

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

  async function setStopLossSidebar(value) {
    const el = document.getElementById('sidebar-stop-loss-perc');
    if (!el) { L.fail('set', 'Campo sidebar-stop-loss-perc não encontrado'); return false; }
    el.focus();
    el.value = String(value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
    await wait(120);
    L.ok('set', 'Stop Loss alterado no sidebar', { value });
    return true;
  }

  async function validateStopLoss(expected) {
    const cfg = Number(window.config && window.config.stopLossPerc);
    const st = Number(window.state && window.state.stopLossValor);
    const base = Number(window.state && window.state.capitalInicioSessao);
    const calc = isFinite(base) ? (base * (expected / 100)) : NaN;
    const approx = (a, b) => Math.abs(Number(a) - Number(b)) < 0.5;
    const ok = cfg === Number(expected) && (isFinite(calc) ? approx(st, calc) : true);
    (ok ? L.ok : L.fail)('validate', 'Validação Stop Loss', { config: cfg, stopLossValor: st, esperadoPerc: expected, base });
    return ok;
  }

  async function run() {
    const value = 18;
    await openSidebarParameters();
    await setStopLossSidebar(value);
    await wait(100);
    const pre = await validateStopLoss(value);
    if (!window.state.isSessionActive) {
      if (window.events && typeof window.events.startNewSession === 'function') window.events.startNewSession('oficial');
      else if (window.logic && typeof window.logic.startNewSession === 'function') await window.logic.startNewSession('oficial');
      await wait(200);
    }
    const post = await validateStopLoss(value);
    const passed = (pre ? 1 : 0) + (post ? 1 : 0);
    const failed = 2 - passed;
    console.log(`[TESTE][test-stoploss-sync.js][runStopLossSyncTest] RESUMO → total: 2, passaram: ${passed}, falharam: ${failed}`);
    return { passed, failed };
  }

  if (typeof window !== 'undefined') {
    window.runStopLossSyncTest = run;
    L.info('init', 'Carregado. Execute runStopLossSyncTest()');
  }
})();





