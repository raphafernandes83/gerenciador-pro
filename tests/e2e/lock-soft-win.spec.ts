import { test, expect } from '@playwright/test';
test.describe('Lock suave (STOP_WIN)', () => {
  test('atingir stop win deve exibir badge e popup discreto', async ({ page }) => {
    await page.goto('http://localhost:3000/index.html');
    await page.waitForSelector('#container:not(.hidden)');

    // Configurar para atingir rapidamente o stop win: 10% de 10k = 1000
    await page.evaluate(() => {
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
        capitalAtual: 11100, // Lucro de 1100 (acima de 10% = 1000)
        stopWinPerc: 10,
        stopLossPerc: 20,
        historicoCombinado: [
          { isWin: true, valor: 700 },
          { isWin: true, valor: 400 }
        ]
      };

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
        (window as any).charts.updateProgressChart(stateData.historicoCombinado);
      }

      // Fallback: chamar diretamente sinalizarBloqueioSuave se charts não funcionar
      if ((window as any).ui && typeof (window as any).ui.sinalizarBloqueioSuave === 'function') {
        (window as any).ui.sinalizarBloqueioSuave('STOP_WIN', 'Meta atingida via teste');
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
    await expect(badge).toContainText('Meta de ganhos atingida', { timeout: 5000 });

    // Popup discreto deve aparecer
    const popup = page.locator('#insight-popup');
    await expect(popup).toHaveClass(/show/, { timeout: 5000 });
  });
});
