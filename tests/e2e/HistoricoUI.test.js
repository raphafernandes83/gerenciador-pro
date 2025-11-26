/**
 * Testes para HistoricoUI
 * Valida novo componente criado e seus métodos
 */

import { test, expect } from '@playwright/test';

test.describe('HistoricoUI - Novo Componente', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
    });

    test('deve carregar HistoricoUI sem erros', async ({ page }) => {
        const historicoExists = await page.evaluate(() => {
            return window.components && window.components.historico !== undefined;
        });

        expect(historicoExists).toBeTruthy();
    });

    test('deve ter método renderDiario', async ({ page }) => {
        const hasMethod = await page.evaluate(() => {
            const historico = window.components?.historico;
            return historico && typeof historico.renderDiario === 'function';
        });

        expect(hasMethod).toBeTruthy();
    });

    test('deve ter método renderTagDiagnostics', async ({ page }) => {
        const hasMethod = await page.evaluate(() => {
            const historico = window.components?.historico;
            return historico && typeof historico.renderTagDiagnostics === 'function';
        });

        expect(hasMethod).toBeTruthy();
    });

    test('deve ter método renderAnalysisResults', async ({ page }) => {
        const hasMethod = await page.evaluate(() => {
            const historico = window.components?.historico;
            return historico && typeof historico.renderAnalysisResults === 'function';
        });

        expect(hasMethod).toBeTruthy();
    });

    test('deve ter método renderGoalOptimizationResults', async ({ page }) => {
        const hasMethod = await page.evaluate(() => {
            const historico = window.components?.historico;
            return historico && typeof historico.renderGoalOptimizationResults === 'function';
        });

        expect(hasMethod).toBeTruthy();
    });

    test('renderDiario deve aceitar filtro', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const historico = window.components?.historico;
            if (!historico) return { success: false };

            try {
                // Chamar com diferentes filtros
                await historico.renderDiario('todas');
                await historico.renderDiario('oficial');
                await historico.renderDiario('simulacao');
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        expect(result.success).toBeTruthy();
    });
});
