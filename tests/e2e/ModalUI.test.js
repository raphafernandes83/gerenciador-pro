/**
 * Testes para ModalUI  
 * Valida método show() de compatibilidade
 */

import { test, expect } from '@playwright/test';

test.describe('ModalUI - Compatibilidade', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
    });

    test('deve carregar ModalUI sem erros', async ({ page }) => {
        const modalExists = await page.evaluate(() => {
            return window.components && window.components.modal !== undefined;
        });

        expect(modalExists).toBeTruthy();
    });

    test('deve ter método show', async ({ page }) => {
        const hasMethod = await page.evaluate(() => {
            const modal = window.components?.modal;
            return modal && typeof modal.show === 'function';
        });

        expect(hasMethod).toBeTruthy();
    });

    test('deve ter métodos legados', async ({ page }) => {
        const hasLegacyMethods = await page.evaluate(() => {
            const modal = window.components?.modal;
            return modal &&
                typeof modal.mostrarModal === 'function' &&
                typeof modal.mostrarConfirmacao === 'function' &&
                typeof modal.mostrarAlerta === 'function';
        });

        expect(hasLegacyMethods).toBeTruthy();
    });
});
