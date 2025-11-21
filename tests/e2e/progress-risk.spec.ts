import { test, expect } from '@playwright/test';
test.describe('Progresso das Metas - Prejuízo', () => {
    test('simular loss e validar risco utilizado e limite em R$', async ({ page }) => {
        await page.goto('http://localhost:3000/index.html');
        await page.waitForSelector('#container:not(.hidden)');

        // Ativar flags e preparar store com prejuízo
        await page.addScriptTag({
            content: `
      window.Features = window.Features || { FEATURE_goals_v2:false, FEATURE_progress_cards_v2:false, FEATURE_store_pubsub:false };
      window.Features.FEATURE_goals_v2 = true;
      window.Features.FEATURE_progress_cards_v2 = true;
      window.Features.FEATURE_store_pubsub = true;
      (function(){
        const ss = window.sessionStore; if (!ss) return;
        ss.reset({ isSessionActive: true, capitalInicial: 10000, capitalInicioSessao: 10000, capitalAtual: 10000, historicoCombinado: [], stopWinPerc: 10, stopLossPerc: 20 });
        const h = ss.getState().historicoCombinado.slice();
        h.push({ isWin: false, valor: -300 });
        ss.setState({ capitalAtual: 9700, historicoCombinado: h });
      })();
    `,
        });

        // Validar risco utilizado (%) e limite em R$
        const riskUsed = page.locator('#risk-used-display');
        const lossLimit = page.locator('#loss-limit-amount');
        const lossResult = page.locator('#loss-session-result');

        await expect(riskUsed).toBeVisible();
        await expect(riskUsed).toHaveText(/%$/);
        await expect(lossLimit).toBeVisible();
        await expect(lossLimit).toContainText('R$');
        await expect(lossResult).toBeVisible();
        await expect(lossResult).toContainText('R$');
    });
});
