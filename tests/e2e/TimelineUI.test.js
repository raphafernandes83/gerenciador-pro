/**
 * Testes para TimelineUI
 * Valida métodos expandidos e funcionalidades avançadas
 */

import { test, expect } from '@playwright/test';

test.describe('TimelineUI - Métodos Avançados', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
    });

    test('deve carregar TimelineUI sem erros', async ({ page }) => {
        const timelineExists = await page.evaluate(() => {
            return window.components && window.components.timeline !== undefined;
        });

        expect(timelineExists).toBeTruthy();
    });

    test('deve ter método renderizarCompleta', async ({ page }) => {
        const hasMethod = await page.evaluate(() => {
            const timeline = window.components?.timeline;
            return timeline && typeof timeline.renderizarCompleta === 'function';
        });

        expect(hasMethod).toBeTruthy();
    });

    test('deve ter método adicionarItem', async ({ page }) => {
        const hasMethod = await page.evaluate(() => {
            const timeline = window.components?.timeline;
            return timeline && typeof timeline.adicionarItem === 'function';
        });

        expect(hasMethod).toBeTruthy();
    });

    test('deve ter método removerUltimoItem', async ({ page }) => {
        const hasMethod = await page.evaluate(() => {
            const timeline = window.components?.timeline;
            return timeline && typeof timeline.removerUltimoItem === 'function';
        });

        expect(hasMethod).toBeTruthy();
    });

    test('renderizarCompleta deve aceitar parâmetros opcionais', async ({ page }) => {
        const result = await page.evaluate(() => {
            const timeline = window.components?.timeline;
            if (!timeline) return { success: false };

            try {
                // Chamar sem  parâmetros (deve usar defaults)
                timeline.renderizarCompleta();
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        expect(result.success).toBeTruthy();
    });

    test('adicionarItem deve validar operação', async ({ page }) => {
        const result = await page.evaluate(() => {
            const timeline = window.components?.timeline;
            if (!timeline) return { success: false };

            // Tentar adicionar item inválido (sem op)
            timeline.adicionarItem(null, 0, false);

            // Não deve gerar erro, apenas retornar silenciosamente
            return { success: true };
        });

        expect(result.success).toBeTruthy();
    });
});
