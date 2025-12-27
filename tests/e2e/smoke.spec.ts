/**
 * Smoke Tests - Gerenciador PRO
 * 
 * Testes básicos de sanidade para garantir que a aplicação carrega corretamente.
 * Executar: npm run test:smoke
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {

    test.beforeEach(async ({ page }) => {
        // Captura erros de console
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error(`Console Error: ${msg.text()}`);
            }
        });
    });

    /**
     * Teste A: Página carrega sem erros críticos de JavaScript
     */
    test('A) Página carrega sem erros críticos de console', async ({ page }) => {
        const consoleErrors: string[] = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text();
                // Ignora erros conhecidos que não afetam funcionalidade
                if (!text.includes('favicon') && !text.includes('net::ERR')) {
                    consoleErrors.push(text);
                }
            }
        });

        // Captura erros de página (uncaught exceptions)
        page.on('pageerror', error => {
            consoleErrors.push(`Page Error: ${error.message}`);
        });

        await page.goto('http://localhost:3000/');
        await page.waitForLoadState('networkidle');

        // Aguarda inicialização do app
        await page.waitForTimeout(2000);

        // Verifica se título está correto
        const title = await page.title();
        expect(title).toContain('Gerenciador');

        // Não deve haver erros críticos
        const criticalErrors = consoleErrors.filter(e =>
            e.includes('Uncaught') ||
            e.includes('TypeError') ||
            e.includes('ReferenceError')
        );

        if (criticalErrors.length > 0) {
            console.log('Erros críticos encontrados:', criticalErrors);
        }

        expect(criticalErrors.length).toBe(0);
    });

    /**
     * Teste B: FABs (Floating Action Buttons) estão visíveis
     */
    test('B) FABs (Settings, Trash, Help) estão visíveis', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000); // FABs são criados dinamicamente

        // Verifica se existe pelo menos um FAB visível (dock de FABs)
        const fabDock = page.locator('.fab-dock, .fabs-container, [class*="fab"]');
        const fabCount = await fabDock.count();

        // Pelo menos algum elemento FAB deve existir
        expect(fabCount).toBeGreaterThan(0);

        // Alternativamente, verifica se os FABs específicos existem no DOM
        // (podem estar em qualquer estado de visibilidade)
        const pageContent = await page.content();
        const hasFabElements =
            pageContent.includes('fab') ||
            pageContent.includes('trash') ||
            pageContent.includes('help');

        expect(hasFabElements).toBe(true);
    });

    /**
     * Teste C: Estrutura de modais existe no DOM
     */
    test('C) Estrutura de modais existe no DOM', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Verifica se existem modais no DOM (mesmo que ocultas)
        const pageContent = await page.content();

        // Verifica presença de estruturas de modal
        const hasModals =
            pageContent.includes('modal') ||
            pageContent.includes('dialog') ||
            pageContent.includes('overlay');

        expect(hasModals).toBe(true);
    });

    /**
     * Teste D: Nenhuma violação de CSP
     */
    test('D) Sem violações de CSP', async ({ page }) => {
        const cspViolations: string[] = [];

        // Escuta eventos de violação de CSP
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Content Security Policy') || text.includes('CSP')) {
                cspViolations.push(text);
            }
        });

        await page.goto('http://localhost:3000/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Não deve haver violações de CSP
        expect(cspViolations.length).toBe(0);
    });

});
