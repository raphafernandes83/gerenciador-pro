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
        await page.addScriptTag({
            content: `
      console.log('[DEBUG] Configurando teste...');
      window.Features = window.Features || { FEATURE_goals_v2:false, FEATURE_progress_cards_v2:false, FEATURE_store_pubsub:false };
      window.Features.FEATURE_goals_v2 = true;
      window.Features.FEATURE_progress_cards_v2 = true;
      window.Features.FEATURE_store_pubsub = true;
      
      console.log('[DEBUG] Features configuradas:', window.Features);
      console.log('[DEBUG] GoalsUtils disponível:', {
        computeStopGoals: typeof window.computeStopGoals,
        computeLockMode: typeof window.computeLockMode
      });
      
      (function(){
        const ss = window.sessionStore; 
        if (!ss) {
          console.log('[DEBUG] sessionStore não encontrado');
          return;
        }
        console.log('[DEBUG] Resetando sessionStore...');
        ss.reset({ isSessionActive: true, capitalInicial: 10000, capitalInicioSessao: 10000, capitalAtual: 10000, historicoCombinado: [], stopWinPerc: 10, stopLossPerc: 20 });
        
        const h = ss.getState().historicoCombinado.slice();
        // Perda acumulada >= 2000 (atinge limite)
        h.push({ isWin: false, valor: -1500 });
        ss.setState({ capitalAtual: 8500, historicoCombinado: h });
        h.push({ isWin: false, valor: -600 });
        ss.setState({ capitalAtual: 7900, historicoCombinado: h });
        
        console.log('[DEBUG] Estado final:', ss.getState());
        
        if (window.charts && typeof window.charts.updateProgressChart === 'function') {
          console.log('[DEBUG] Atualizando charts...');
          window.charts.updateProgressChart(ss.getState().historicoCombinado);
        }
      })();
    `,
        });

        // Pequeno respiro para processamento do update
        await page.waitForTimeout(50);

        const badge = page.locator('#progress-soft-lock-badge');
        await page.waitForFunction(() => {
            const el = document.getElementById('progress-soft-lock-badge');
            return el && el.classList.contains('show');
        });
        await expect(badge).toBeVisible();
        await expect(badge).toContainText('Limite de perda atingido');

        // Popup discreto deve aparecer
        const popup = page.locator('#insight-popup');
        await expect(popup).toHaveClass(/show/);
    });
});
