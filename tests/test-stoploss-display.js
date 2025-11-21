// 🧪 Teste automatizado: exibição do Stop Loss no card Progresso
// Execução: runStopLossDisplayTest()

(function () {
  function log(prefix, level, msg, extra) {
    const tag = `[TESTE][test-stoploss-display.js][${prefix}]`;
    (level === 'error' ? console.error : console.log)(`${tag} ${msg}`, extra || '');
  }
  const L = {
    ok: (p, m, e) => log(p, 'ok', `✅ ${m}`, e),
    info: (p, m, e) => log(p, 'info', `ℹ️ ${m}`, e),
    fail: (p, m, e) => log(p, 'error', `❌ ${m}`, e),
  };

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function ensureProgressRendered() {
    if (window.charts && typeof window.charts.updateProgressChart === 'function') {
      try {
        window.charts.updateProgressChart(Array.isArray(window.state?.historicoCombinado) ? window.state.historicoCombinado : []);
        await wait(120);
      } catch (_) {}
    }
  }

  function parseCurrencyBRL(txt) {
    try {
      if (!txt) return NaN;
      const s = String(txt).replace(/[^0-9,.-]/g, '').replace('.', '').replace(',', '.');
      const n = Number(s);
      return isFinite(n) ? n : NaN;
    } catch {
      return NaN;
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
    await wait(150);
    return true;
  }

  async function maybeStartSession() {
    if (!window.state?.isSessionActive) {
      if (window.events && typeof window.events.startNewSession === 'function') {
        window.events.startNewSession('oficial');
      } else if (window.logic && typeof window.logic.startNewSession === 'function') {
        await window.logic.startNewSession('oficial');
      }
      await wait(200);
    }
  }

  async function validateDisplay() {
    await ensureProgressRendered();
    const lossLimitAmountEl = document.getElementById('loss-limit-amount');
    const expectedPerc = Number(window.state?.stopLossPerc ?? window.config?.stopLossPerc ?? 20);
    const base = Number(window.state?.capitalInicioSessao ?? window.state?.capitalInicial ?? window.config?.capitalInicial ?? 0);
    const expectedAmount = base * (expectedPerc / 100);

    const shownTxt = lossLimitAmountEl?.textContent || '';
    const shownAmount = parseCurrencyBRL(shownTxt);
    const approx = (a, b) => Math.abs(Number(a) - Number(b)) < 0.51;
    const okAmount = approx(Math.abs(shownAmount), expectedAmount);
    (okAmount ? L.ok : L.fail)('validate', `Limite(R$) exibido = ${shownTxt} ~ ${expectedAmount}`);
    return okAmount;
  }

  async function run() {
    try {
      const old = Number(window.config?.stopLossPerc ?? 20);
      const next = old === 20 ? 18 : 20;
      await setStopLossSidebar(next);
      await maybeStartSession();
      const ok = await validateDisplay();
      const total = 1;
      const passed = ok ? 1 : 0;
      const failed = total - passed;
      console.log(`[TESTE][test-stoploss-display.js][runStopLossDisplayTest] RESUMO → total: ${total}, passaram: ${passed}, falharam: ${failed}`);
      return { passed, failed };
    } catch (e) {
      L.fail('run', 'Erro ao executar teste', e);
      console.log(`[TESTE][test-stoploss-display.js][runStopLossDisplayTest] RESUMO → total: 1, passaram: 0, falharam: 1`);
      return { passed: 0, failed: 1 };
    }
  }

  if (typeof window !== 'undefined') {
    window.runStopLossDisplayTest = run;
    L.info('init', 'Carregado. Execute runStopLossDisplayTest()');
  }
})();





