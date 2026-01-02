/**
 * Test Helpers - Gerenciador PRO
 * 
 * Utilitários para testes E2E determinísticos (anti-flake).
 * 
 * @version TAREFA 19 - 28/12/2025
 */

import { Page, expect } from '@playwright/test';

/**
 * Aguarda o app estar pronto para interação.
 * Evita waits fixos - espera por elementos/estados reais.
 */
export async function waitForAppReady(page: Page): Promise<void> {
    // 1. Aguarda networkidle (sem requests pendentes)
    await page.waitForLoadState('networkidle');

    // 2. Aguarda elementos essenciais da UI
    await Promise.race([
        // Aguarda header ou container principal
        page.locator('.app-header, header, #header').first().waitFor({
            state: 'visible',
            timeout: 10000
        }),
        page.locator('.app-container, main, #plano-operacao').first().waitFor({
            state: 'visible',
            timeout: 10000
        }),
    ]);

    // 3. Aguarda scripts carregados (verifica se ui existe)
    await page.waitForFunction(() => {
        return typeof (window as any).ui !== 'undefined';
    }, { timeout: 10000 });
}

/**
 * Aguarda um modal aparecer e estar pronto
 */
export async function waitForModal(page: Page, modalSelector: string): Promise<void> {
    const modal = page.locator(modalSelector);
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    await expect(modal).toHaveClass(/show/, { timeout: 3000 });
}

/**
 * Aguarda um modal fechar
 */
export async function waitForModalClose(page: Page, modalSelector: string): Promise<void> {
    const modal = page.locator(modalSelector);
    await expect(modal).not.toHaveClass(/show/, { timeout: 5000 });
}

/**
 * Clica em botão e aguarda resultado esperado
 */
export async function clickAndWait(
    page: Page,
    buttonSelector: string,
    expectedSelector: string
): Promise<void> {
    await page.locator(buttonSelector).click();
    await page.locator(expectedSelector).waitFor({ state: 'visible', timeout: 5000 });
}

/**
 * Verifica se localStorage tem valor esperado
 */
export async function expectLocalStorage(
    page: Page,
    key: string,
    expectedValues: string[]
): Promise<void> {
    const value = await page.evaluate((k) => localStorage.getItem(k), key);
    expect(expectedValues).toContain(value);
}

/**
 * Aguarda elemento ter classe específica
 */
export async function waitForClass(
    page: Page,
    selector: string,
    className: string | RegExp,
    timeout = 5000
): Promise<void> {
    const element = page.locator(selector);
    await expect(element).toHaveClass(className, { timeout });
}

/**
 * Limpa estado para teste isolado
 */
export async function clearAppState(page: Page): Promise<void> {
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
}
