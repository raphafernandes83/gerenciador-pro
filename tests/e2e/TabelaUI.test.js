/**
 * Testes para TabelaUI
 * Valida otimizações de performance e funcionalidades básicas
 */

import { test, expect } from '@playwright/test';

test.describe('TabelaUI - Performance e Funcionalidades', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
    });

    test('deve carregar TabelaUI sem erros', async ({ page }) => {
        // Verificar se componente está disponível
        const tabelaExists = await page.evaluate(() => {
            return window.components && window.components.tabela !== undefined;
        });

        expect(tabelaExists).toBeTruthy();
    });

    test('deve ter cache implementado', async ({ page }) => {
        const hasCache = await page.evaluate(() => {
            const tabela = window.components?.tabela;
            return tabela &&
                typeof tabela._cacheHistoricoFiltrado !== 'undefined' &&
                typeof tabela.limparCache === 'function';
        });

        expect(hasCache).toBeTruthy();
    });

    test('deve ter método atualizarTabela', async ({ page }) => {
        const hasMethod = await page.evaluate(() => {
            const tabela = window.components?.tabela;
            return tabela && typeof tabela.atualizarTabela === 'function';
        });

        expect(hasMethod).toBeTruthy();
    });

    test('deve ter paginação configurada', async ({ page }) => {
        const hasPagination = await page.evaluate(() => {
            const tabela = window.components?.tabela;
            return tabela &&
                tabela.itensPorPagina === 10 &&
                typeof tabela.proximaPagina === 'function' &&
                typeof tabela.paginaAnterior === 'function';
        });

        expect(hasPagination).toBeTruthy();
    });

    test('deve aplicar filtros sem erros', async ({ page }) => {
        const filterResult = await page.evaluate(() => {
            const tabela = window.components?.tabela;
            if (!tabela) return { success: false, error: 'Tabela não encontrada' };

            try {
                tabela.setFiltro('win');
                tabela.setFiltro('loss');
                tabela.setFiltro('todos');
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        expect(filterResult.success).toBeTruthy();
    });

    test('cache deve invalidar corretamente', async ({ page }) => {
        const cacheTest = await page.evaluate(() => {
            const tabela = window.components?.tabela;
            if (!tabela) return false;

            // Limpar cache
            tabela.limparCache();

            // Verificar se foi limpo
            return tabela._cacheHistoricoFiltrado === null &&
                tabela._ultimoFiltro === null;
        });

        expect(cacheTest).toBeTruthy();
    });
});
