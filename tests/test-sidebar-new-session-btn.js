// 🧪 Teste: Botão Nova Sessão no modal da sidebar
// Execução: runSidebarNewSessionBtnTests()

(function () {
  const tag = (fn) => (msg, extra) => console.log(`[TESTE][test-sidebar-new-session-btn.js][${fn}] ${msg}`, extra || '');
  const log = {
    info: tag('run'),
    ok: tag('ok'),
    fail: (...args) => console.error(`[TESTE][test-sidebar-new-session-btn.js][fail]`, ...args),
  };

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function ensureSidebarModalOpen() {
    if (!window.sidebar || typeof window.sidebar.navigateToSection !== 'function') {
      throw new Error('sidebar.navigateToSection indisponível');
    }
    window.sidebar.navigateToSection('parameters');
    await wait(150);
  }

  async function run() {
    let total = 0, passed = 0;
    try {
      await ensureSidebarModalOpen();
      total++;
      const btn = document.getElementById('sidebar-new-session-btn');
      if (!btn) throw new Error('Botão não encontrado no modal');
      log.ok('Botão presente');
      passed++;

      total++;
      const visible = getComputedStyle(btn).display !== 'none' && !btn.classList.contains('hidden');
      log.info(`Visibilidade inicial: ${visible}`);
      passed++;

      total++;
      const ev = window.events;
      if (!ev || typeof ev.handleNewSession !== 'function') throw new Error('events.handleNewSession indisponível');
      let called = false;
      const orig = ev.handleNewSession;
      ev.handleNewSession = function (...args) {
        called = true;
        return orig.apply(this, args);
      };
      btn.click();
      await wait(50);
      if (!called) throw new Error('Clique não acionou handleNewSession');
      log.ok('Clique acionou handleNewSession');
      passed++;
      ev.handleNewSession = orig;

    } catch (e) {
      log.fail(e.message);
    } finally {
      console.log(`[TESTE][test-sidebar-new-session-btn.js][run] RESUMO → total: ${total}, passaram: ${passed}, falharam: ${total - passed}`);
    }
  }

  window.runSidebarNewSessionBtnTests = run;
  console.log('🧪 runSidebarNewSessionBtnTests() disponível');
})();





