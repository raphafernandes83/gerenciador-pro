// 🧪 Teste automatizado: exibição do Stop Win no card Progresso
// Execução: runStopWinDisplayTest()

(function () {
  function log(prefix, level, msg, extra) {
    const tag = `[TESTE][test-stopwin-display.js][${prefix}]`;
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

  async function setStopWinSidebar(value) {
    const el = document.getElementById('sidebar-stop-win-perc');
    if (!el) { L.fail('set', 'Campo sidebar-stop-win-perc não encontrado'); return false; }
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
    const winTargetAmountEl = document.getElementById('win-target-amount');
    const winRemainingAmountEl = document.getElementById('win-remaining-amount');
    const expectedPerc = Number(window.state?.stopWinPerc ?? window.config?.stopWinPerc ?? 10);
    const base = Number(window.state?.capitalInicioSessao ?? window.state?.capitalInicial ?? window.config?.capitalInicial ?? 0);
    const expectedAmount = base * (expectedPerc / 100);
    const lucro = Number(window.state?.capitalAtual ?? base) - base;
    const expectedRemaining = Math.max(0, expectedAmount - Math.max(0, lucro));

    const shownAmount = parseCurrencyBRL(winTargetAmountEl?.textContent || '');
    const shownRemaining = parseCurrencyBRL(winRemainingAmountEl?.textContent || '');
    const approx = (a, b) => Math.abs(Number(a) - Number(b)) < 0.51;

    const okAmount = approx(shownAmount, expectedAmount);
    const okRemaining = approx(shownRemaining, expectedRemaining);
    (okAmount ? L.ok : L.fail)('validate', `Meta (R$) exibida = ${shownAmount} ~ ${expectedAmount}`);
    (okRemaining ? L.ok : L.fail)('validate', `Restante (R$) exibido = ${shownRemaining} ~ ${expectedRemaining}`);
    return okAmount && okRemaining;
  }

  async function run() {
    try {
      const old = Number(window.config?.stopWinPerc ?? 10);
      const next = old === 10 ? 12 : 10;
      await setStopWinSidebar(next);
      await maybeStartSession();
      const ok = await validateDisplay();
      const total = 2;
      const passed = ok ? 2 : 0;
      const failed = total - passed;
      console.log(`[TESTE][test-stopwin-display.js][runStopWinDisplayTest] RESUMO → total: ${total}, passaram: ${passed}, falharam: ${failed}`);
      return { passed, failed };
    } catch (e) {
      L.fail('run', 'Erro ao executar teste', e);
      console.log(`[TESTE][test-stopwin-display.js][runStopWinDisplayTest] RESUMO → total: 2, passaram: 0, falharam: 2`);
      return { passed: 0, failed: 2 };
    }
  }

  if (typeof window !== 'undefined') {
    window.runStopWinDisplayTest = run;
    L.info('init', 'Carregado. Execute runStopWinDisplayTest()');
  }
})();





