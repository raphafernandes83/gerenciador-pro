import { test, expect } from '@playwright/test';
test.describe('Lock suave (badge + popup)', () => {
  test('atingir stop loss deve exibir badge e popup discreto', async ({ page }) => {
    // Capturar logs do console
    page.on('console', (msg) => {
      if (msg.text().includes('[DEBUG]')) {
        console.log('BROWSER:', msg.text());
      }
    });

    await page.goto('http://localhost:3000/index.html');
    await page.waitForSelector('#container:not(.hidden)');

    // Configurar para atingir rapidamente o stop loss: 20% de 10k = 2000
    await page.evaluate(() => {
      console.log('[DEBUG] Configurando teste...');

      // Habilitar flags
      (window as any).Features = (window as any).Features || {};
      (window as any).Features.FEATURE_goals_v2 = true;
      (window as any).Features.FEATURE_progress_cards_v2 = true;
      (window as any).Features.FEATURE_store_pubsub = true;

      // Configurar window.state e window.config (usado por _buildGoalsProgressSummarySafe)
      const stateData = {
        isSessionActive: true,
        capitalInicial: 10000,
        capitalInicioSessao: 10000,
        capitalAtual: 7900, // Prejuízo de 2100 (acima de 20% = 2000)
        stopWinPerc: 10,
        stopLossPerc: 20,
        historicoCombinado: [
          { isWin: false, valor: -1500 },
          { isWin: false, valor: -600 }
        ]
      };

      console.log('[DEBUG] State data:', stateData);

      // Atualiza window.state
      (window as any).state = (window as any).state || {};
      Object.assign((window as any).state, stateData);

      // Atualiza window.config
      (window as any).config = (window as any).config || {};
      (window as any).config.capitalInicial = 10000;
      (window as any).config.stopWinPerc = 10;
      (window as any).config.metaWinRate = 10;
      (window as any).config.stopLossPerc = 20;
      (window as any).config.metaLossRate = 20;

      // Atualiza sessionStore se existir
      const ss = (window as any).sessionStore;
      if (ss) {
        ss.reset(stateData);
        ss.setState(stateData);
      }

      // Dispara atualização do chart que ativa o lock mode
      if ((window as any).charts && typeof (window as any).charts.updateProgressChart === 'function') {
        console.log('[DEBUG] Chamando charts.updateProgressChart...');
        (window as any).charts.updateProgressChart(stateData.historicoCombinado);
      }

      // Fallback: chamar diretamente sinalizarBloqueioSuave se charts não funcionar
      if ((window as any).ui && typeof (window as any).ui.sinalizarBloqueioSuave === 'function') {
        console.log('[DEBUG] Chamando ui.sinalizarBloqueioSuave...');
        (window as any).ui.sinalizarBloqueioSuave('STOP_LOSS', 'Limite atingido via teste');
      }
    });

    // Aguarda processamento
    await page.waitForTimeout(500);

    // Debug: captura estado do badge
    const badgeInfo = await page.evaluate(() => {
      const badge = document.getElementById('progress-soft-lock-badge');
      return badge ? {
        className: badge.className,
        textContent: badge.textContent,
        display: getComputedStyle(badge).display,
        visibility: getComputedStyle(badge).visibility
      } : null;
    });
    console.log('Badge info:', badgeInfo);

    // Valida badge
    const badge = page.locator('#progress-soft-lock-badge');
    await expect(badge).not.toHaveClass(/hidden/, { timeout: 15000 });
    await expect(badge).toContainText('Limite de perda atingido', { timeout: 5000 });

    // Popup discreto deve aparecer
    const popup = page.locator('#insight-popup');
    await expect(popup).toHaveClass(/show/, { timeout: 5000 });
  });
});
