import { test, expect } from '@playwright/test';
test.describe('Progresso das Metas', () => {
  test('sessão inativa, ativar flags, simular win e validar R$/%', async ({ page }) => {
    await page.goto('http://localhost:3000/index.html');

    // Aguardar container visível
    await page.waitForSelector('#container:not(.hidden)');

    // Sessão inativa visível (use toContainText instead of toBeVisible for stability)
    const sessionInfo = page.locator('#progress-session-info');
    await expect(sessionInfo).toContainText('Inativa');

    // Ativar flags e preparar store pelo console
    await page.evaluate(() => {
      (window as any).Features = (window as any).Features || { FEATURE_goals_v2: false, FEATURE_progress_cards_v2: false, FEATURE_store_pubsub: false };
      (window as any).Features.FEATURE_goals_v2 = true;
      (window as any).Features.FEATURE_progress_cards_v2 = true;
      (window as any).Features.FEATURE_store_pubsub = true;
      const ss = (window as any).sessionStore;
      if (!ss) return;
      ss.reset({ isSessionActive: true, capitalInicial: 10000, capitalInicioSessao: 10000, capitalAtual: 10000, historicoCombinado: [], stopWinPerc: 10, stopLossPerc: 20 });
      const h = ss.getState().historicoCombinado.slice();
      h.push({ isWin: true, valor: 200 });
      ss.setState({ capitalAtual: 10200, historicoCombinado: h });
    });

    // Validar textos/labels
    const winCurrent = page.locator('#win-current-value');
    const winRemaining = page.locator('#win-remaining-amount');
    const metaDisp = page.locator('#meta-progress-display');

    await expect(winCurrent).toBeVisible();
    await expect(winCurrent).toHaveText(/%$/);
    await expect(winRemaining).toBeVisible();
    await expect(winRemaining).toContainText('R$');
    await expect(metaDisp).toBeVisible();
    await expect(metaDisp).toHaveText(/%$/);
  });
});
