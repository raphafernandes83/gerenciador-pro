/**
 * Console/Exception Gate - Playwright Utility
 * 
 * Captura console events e pageerror, falhando testes se detectar:
 * - console.error (exceto allowlist)
 * - Mensagens de CSP
 * - Uncaught/TypeError/ReferenceError
 * - PageError (exceções não tratadas)
 * 
 * @version TAREFA 17 - 27/12/2025
 */

import { Page, ConsoleMessage } from '@playwright/test';

/**
 * Allowlist de erros/mensagens conhecidos que NÃO devem falhar o teste
 * Cada item deve ter justificativa
 */
export const CONSOLE_ERROR_ALLOWLIST: string[] = [
    // Erros de rede/404 para recursos não-críticos (favicon, fontes externas)
    'Failed to load resource',
    'net::ERR',
    'favicon.ico',
    // Service Worker offline
    'service-worker.js',
];

/**
 * Padrões que indicam erro crítico
 */
export const CRITICAL_ERROR_PATTERNS: RegExp[] = [
    /Content Security Policy/i,
    /Refused to execute/i,
    /Refused to load/i,
    /CSP/i,
    /Uncaught/i,
    /TypeError/i,
    /ReferenceError/i,
    /SyntaxError/i,
];

/**
 * Interface para armazenar erros capturados
 */
export interface CapturedError {
    type: 'console.error' | 'CSP' | 'exception' | 'pageerror';
    message: string;
    timestamp: number;
}

/**
 * Classe para gerenciar captura de erros em testes
 */
export class ConsoleGate {
    private errors: CapturedError[] = [];
    private page: Page;
    private allowlist: string[];

    constructor(page: Page, customAllowlist: string[] = []) {
        this.page = page;
        this.allowlist = [...CONSOLE_ERROR_ALLOWLIST, ...customAllowlist];
        this.setupListeners();
    }

    private setupListeners(): void {
        // Captura mensagens de console
        this.page.on('console', (msg: ConsoleMessage) => {
            const text = msg.text();

            // Ignora mensagens na allowlist
            if (this.isAllowlisted(text)) {
                return;
            }

            // Verifica console.error
            if (msg.type() === 'error') {
                this.errors.push({
                    type: 'console.error',
                    message: text,
                    timestamp: Date.now(),
                });
            }

            // Verifica violações de CSP
            if (this.isCSPViolation(text)) {
                this.errors.push({
                    type: 'CSP',
                    message: text,
                    timestamp: Date.now(),
                });
            }
        });

        // Captura exceções não tratadas
        this.page.on('pageerror', (error) => {
            const message = error.message || error.toString();

            if (!this.isAllowlisted(message)) {
                this.errors.push({
                    type: 'pageerror',
                    message: message,
                    timestamp: Date.now(),
                });
            }
        });
    }

    private isAllowlisted(text: string): boolean {
        return this.allowlist.some(pattern => text.includes(pattern));
    }

    private isCSPViolation(text: string): boolean {
        return CRITICAL_ERROR_PATTERNS.some(pattern => pattern.test(text));
    }

    /**
     * Retorna todos os erros capturados
     */
    getErrors(): CapturedError[] {
        return [...this.errors];
    }

    /**
     * Verifica se há erros críticos
     */
    hasCriticalErrors(): boolean {
        return this.errors.some(e => e.type === 'CSP' || e.type === 'pageerror');
    }

    /**
     * Verifica se há qualquer erro
     */
    hasErrors(): boolean {
        return this.errors.length > 0;
    }

    /**
     * Limpa erros capturados
     */
    clear(): void {
        this.errors = [];
    }

    /**
     * Gera relatório de erros
     */
    getErrorReport(): string {
        if (this.errors.length === 0) {
            return '✅ Nenhum erro capturado';
        }

        const report = this.errors.map(e =>
            `[${e.type}] ${e.message}`
        ).join('\n');

        return `❌ ${this.errors.length} erro(s) capturado(s):\n${report}`;
    }

    /**
     * Assertion: falha o teste se houver erros críticos
     */
    assertNoCriticalErrors(): void {
        const criticalErrors = this.errors.filter(
            e => e.type === 'CSP' || e.type === 'pageerror'
        );

        if (criticalErrors.length > 0) {
            throw new Error(
                `Erros críticos detectados:\n${criticalErrors.map(e => e.message).join('\n')}`
            );
        }
    }

    /**
     * Assertion: falha o teste se houver qualquer erro (exceto allowlist)
     */
    assertNoErrors(): void {
        if (this.errors.length > 0) {
            throw new Error(this.getErrorReport());
        }
    }
}

/**
 * Helper para criar ConsoleGate em fixture
 */
export function createConsoleGate(page: Page, allowlist?: string[]): ConsoleGate {
    return new ConsoleGate(page, allowlist);
}
