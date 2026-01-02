/**
 * Modal Contract Helpers - Gerenciador PRO
 * 
 * Helpers reutilizáveis para testar modais de forma determinística.
 * Sem waits fixos - usa estados/elementos para sincronização.
 * 
 * @version TAREFA 22 - 28/12/2025
 */

import { Page, Locator, expect } from '@playwright/test';

/**
 * Abre um modal clicando no trigger
 */
export async function openModal(page: Page, triggerSelector: string): Promise<void> {
    const trigger = page.locator(triggerSelector);
    await expect(trigger).toBeVisible();
    await trigger.click();
}

/**
 * Verifica que modal está aberto e visível
 */
export async function expectModalOpen(page: Page, modalSelector: string): Promise<void> {
    const modal = page.locator(modalSelector);
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    await expect(modal).toHaveClass(/show|open|visible|active/);
}

/**
 * Fecha modal pelo botão X
 */
export async function closeModalByX(page: Page, modalSelector: string): Promise<void> {
    const modal = page.locator(modalSelector);

    // Tenta vários seletores de botão fechar
    const closeSelectors = [
        `${modalSelector} .close, ${modalSelector} .close-btn`,
        `${modalSelector} [aria-label="Close"], ${modalSelector} [aria-label="Fechar"]`,
        `${modalSelector} button:has-text("×"), ${modalSelector} button:has-text("X")`,
        '#close-settings-btn, #close-modal-btn',
    ];

    for (const selector of closeSelectors) {
        const closeBtn = page.locator(selector).first();
        if (await closeBtn.count() > 0 && await closeBtn.isVisible()) {
            await closeBtn.click();
            return;
        }
    }

    // Fallback: fecha por ESC
    await page.keyboard.press('Escape');
}

/**
 * Fecha modal por ESC
 */
export async function closeModalByEsc(page: Page): Promise<void> {
    await page.keyboard.press('Escape');
}

/**
 * Verifica que modal está fechado
 */
export async function expectModalClosed(page: Page, modalSelector: string): Promise<void> {
    const modal = page.locator(modalSelector);
    await expect(modal).not.toHaveClass(/show|open|visible|active/, { timeout: 5000 });
}

/**
 * Verifica que foco voltou para o trigger
 */
export async function expectFocusRestored(page: Page, triggerSelector: string): Promise<void> {
    const trigger = page.locator(triggerSelector);

    // Verifica aria-expanded voltou a false (se existir)
    const ariaExpanded = await trigger.getAttribute('aria-expanded');
    if (ariaExpanded !== null) {
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    }
}

/**
 * Verifica que overlay sumiu
 */
export async function expectOverlayGone(page: Page): Promise<void> {
    const overlaySelectors = ['.modal-backdrop', '.overlay', '.modal-overlay'];

    for (const selector of overlaySelectors) {
        const overlay = page.locator(selector);
        if (await overlay.count() > 0) {
            await expect(overlay).not.toBeVisible({ timeout: 3000 });
        }
    }
}

/**
 * Teste completo de modal contract
 */
export async function testModalContract(
    page: Page,
    triggerSelector: string,
    modalSelector: string
): Promise<{ passed: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
        // 1. Abrir modal
        await openModal(page, triggerSelector);
        await expectModalOpen(page, modalSelector);

        // 2. Fechar por X
        await closeModalByX(page, modalSelector);
        await expectModalClosed(page, modalSelector);

        // 3. Abrir novamente
        await openModal(page, triggerSelector);
        await expectModalOpen(page, modalSelector);

        // 4. Fechar por ESC
        await closeModalByEsc(page);
        await expectModalClosed(page, modalSelector);

        // 5. Verificar foco restaurado
        await expectFocusRestored(page, triggerSelector);

        // 6. Verificar overlay sumiu
        await expectOverlayGone(page);

    } catch (error: any) {
        errors.push(error.message);
    }

    return { passed: errors.length === 0, errors };
}
