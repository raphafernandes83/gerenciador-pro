import { test, expect } from '@playwright/test';
test.describe('Lock suave (STOP_WIN)', () => {
    test('atingir stop win deve exibir badge e popup discreto', async ({ page }) => {
        await page.goto('http://localhost:3000/index.html');
        await page.waitForSelector('#container:not(.hidden)');

        // Configurar para atingir rapidamente o stop win: 10% de 10k = 1000
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
        // Lucro acumulado >= 1000 (atinge meta de ganho)
        h.push({ isWin: true, valor: 700 });
        ss.setState({ capitalAtual: 10700, historicoCombinado: h });
        h.push({ isWin: true, valor: 400 });
        ss.setState({ capitalAtual: 11100, historicoCombinado: h });
        if (window.charts && typeof window.charts.updateProgressChart === 'function') {
          window.charts.updateProgressChart(ss.getState().historicoCombinado);
        }
      })();
    `,
        });

        await page.waitForTimeout(50);

        const badge = page.locator('#progress-soft-lock-badge');
        await page.waitForFunction(() => {
            const el = document.getElementById('progress-soft-lock-badge');
            return el && el.classList.contains('show');
        });
        await expect(badge).toBeVisible();
        await expect(badge).toContainText('Meta de ganhos atingida');

        // Popup discreto deve aparecer
        const popup = page.locator('#insight-popup');
        await expect(popup).toHaveClass(/show/);
    });
});
