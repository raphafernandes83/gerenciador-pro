/**
 * 🔍 VALIDADOR DE SINTAXE UNIVERSAL
 * Sistema que detecta e previne erros de sintaxe ANTES que aconteçam
 * Análise estática de código para async/await, setInterval/setTimeout
 */

class SyntaxValidator {
    constructor() {
        this.rules = new Map();
        this.violations = [];
        this.isActive = false;

        console.log('🔍 SyntaxValidator: Inicializando validador...');
        this.setupValidationRules();
        this.isActive = true;
    }

    /**
     * 📋 Configuração das regras de validação
     */
    setupValidationRules() {
        // Regra 1: await sem async
        this.rules.set('await_without_async', {
            pattern: /await\s+\w+/g,
            asyncPattern: /async\s+function|\basync\s+\(/,
            description: 'await usado sem função async',
            severity: 'critical',
        });

        // Regra 2: async sem await na função de callback
        this.rules.set('async_callback_in_timer', {
            pattern: /setInterval\s*\(\s*async\s+/g,
            description: 'async em callback de setInterval',
            severity: 'warning',
        });

        // Regra 3: Vírgula após método em classe
        this.rules.set('comma_after_method', {
            pattern: /}\s*,\s*\n\s*\w+\s*\(/g,
            description: 'Vírgula após método em classe ES6',
            severity: 'critical',
        });

        // Regra 4: Chamada de função async sem await
        this.rules.set('async_call_without_await', {
            pattern: /(\w+\.calcularPlano\(|\w+\.atualizarTudo\(|\w+\.syncPayoutButtons\()/g,
            description: 'Chamada de função async sem await',
            severity: 'high',
        });

        console.log(`✅ ${this.rules.size} regras de validação configuradas`);
    }

    /**
     * 🔍 Valida código fonte
     */
    validateCode(code, filename = 'unknown') {
        if (!this.isActive) return { isValid: true, violations: [] };

        const violations = [];

        this.rules.forEach((rule, ruleName) => {
            const matches = [...code.matchAll(rule.pattern)];

            matches.forEach((match) => {
                const violation = this.analyzeViolation(code, match, rule, ruleName, filename);
                if (violation) {
                    violations.push(violation);
                }
            });
        });

        // Log violations
        if (violations.length > 0) {
            console.warn(`⚠️ SyntaxValidator: ${violations.length} violações em ${filename}`);
            violations.forEach((v) => {
                console.warn(`  ${v.severity}: ${v.description} (linha ${v.line})`);
            });
        }

        return {
            isValid: violations.filter((v) => v.severity === 'critical').length === 0,
            violations,
            filename,
        };
    }

    /**
     * 🔬 Analisa violação específica
     */
    analyzeViolation(code, match, rule, ruleName, filename) {
        const lineNumber = this.getLineNumber(code, match.index);
        const lineContent = this.getLineContent(code, match.index);

        // Análises específicas por regra
        switch (ruleName) {
            case 'await_without_async':
                return this.analyzeAwaitWithoutAsync(
                    code,
                    match,
                    lineNumber,
                    lineContent,
                    filename
                );

            case 'comma_after_method':
                return this.analyzeCommaAfterMethod(code, match, lineNumber, lineContent, filename);

            case 'async_call_without_await':
                return this.analyzeAsyncCallWithoutAwait(
                    code,
                    match,
                    lineNumber,
                    lineContent,
                    filename
                );

            default:
                return {
                    rule: ruleName,
                    description: rule.description,
                    severity: rule.severity,
                    line: lineNumber,
                    content: lineContent,
                    match: match[0],
                    filename,
                };
        }
    }

    /**
     * 🔍 Analisa await sem async
     */
    analyzeAwaitWithoutAsync(code, match, lineNumber, lineContent, filename) {
        // Busca por async na função que contém este await
        const functionStart = this.findFunctionStart(code, match.index);
        const functionCode = code.substring(functionStart, match.index + 100);

        const hasAsync = /async\s+function|\basync\s+\w+\(|\basync\s+\(/g.test(functionCode);

        if (!hasAsync) {
            return {
                rule: 'await_without_async',
                description: 'await usado em função não-async',
                severity: 'critical',
                line: lineNumber,
                content: lineContent,
                match: match[0],
                filename,
                suggestion: 'Adicionar async antes da declaração da função',
            };
        }

        return null;
    }

    /**
     * 🔍 Analisa vírgula após método
     */
    analyzeCommaAfterMethod(code, match, lineNumber, lineContent, filename) {
        // Verifica se está dentro de uma classe
        const classContext = this.findClassContext(code, match.index);

        if (classContext) {
            return {
                rule: 'comma_after_method',
                description: 'Vírgula incorreta após método em classe ES6',
                severity: 'critical',
                line: lineNumber,
                content: lineContent,
                match: match[0],
                filename,
                suggestion: 'Remover vírgula após método',
            };
        }

        return null;
    }

    /**
     * 🔍 Analisa chamada async sem await
     */
    analyzeAsyncCallWithoutAwait(code, match, lineNumber, lineContent, filename) {
        // Verifica se há await antes da chamada
        const beforeMatch = code.substring(Math.max(0, match.index - 10), match.index);
        const hasAwait = /await\s*$/.test(beforeMatch);

        if (!hasAwait && this.isFunctionAsync(code, match.index)) {
            return {
                rule: 'async_call_without_await',
                description: 'Chamada de função async sem await',
                severity: 'high',
                line: lineNumber,
                content: lineContent,
                match: match[0],
                filename,
                suggestion: 'Adicionar await antes da chamada',
            };
        }

        return null;
    }

    /**
     * 🎯 Encontra início da função
     */
    findFunctionStart(code, position) {
        // Busca backward por function, =>, async
        let pos = position;
        while (pos > 0) {
            const char = code[pos];
            if (char === '{') {
                // Busca a declaração da função antes da abertura
                const beforeBrace = code.substring(Math.max(0, pos - 50), pos);
                if (/function|\=\>|\async/.test(beforeBrace)) {
                    return Math.max(0, pos - 50);
                }
            }
            pos--;
        }
        return 0;
    }

    /**
     * 🏛️ Encontra contexto de classe
     */
    findClassContext(code, position) {
        let pos = position;
        let braceCount = 0;

        while (pos > 0) {
            const char = code[pos];
            if (char === '}') braceCount++;
            if (char === '{') braceCount--;

            if (braceCount === 1) {
                // Procura por 'class' antes desta posição
                const before = code.substring(Math.max(0, pos - 100), pos);
                const classMatch = before.match(/class\s+\w+/);
                if (classMatch) {
                    return classMatch[0];
                }
            }
            pos--;
        }
        return null;
    }

    /**
     * ⚡ Verifica se função é async
     */
    isFunctionAsync(code, position) {
        const functionStart = this.findFunctionStart(code, position);
        const functionDeclaration = code.substring(functionStart, position);
        return /async/.test(functionDeclaration);
    }

    /**
     * 📏 Obtém número da linha
     */
    getLineNumber(code, position) {
        return code.substring(0, position).split('\n').length;
    }

    /**
     * 📄 Obtém conteúdo da linha
     */
    getLineContent(code, position) {
        const lines = code.split('\n');
        const lineNumber = this.getLineNumber(code, position);
        return lines[lineNumber - 1] || '';
    }

    /**
     * 🔧 Corrige violações automaticamente
     */
    autoFix(code, violations) {
        let fixedCode = code;

        // Ordena violações por posição (do final para o início)
        const sortedViolations = violations
            .filter((v) => v.severity === 'critical')
            .sort((a, b) => b.line - a.line);

        sortedViolations.forEach((violation) => {
            fixedCode = this.applyFix(fixedCode, violation);
        });

        return fixedCode;
    }

    /**
     * 🛠️ Aplica correção específica
     */
    applyFix(code, violation) {
        const lines = code.split('\n');
        const lineIndex = violation.line - 1;

        if (lineIndex < 0 || lineIndex >= lines.length) return code;

        switch (violation.rule) {
            case 'comma_after_method':
                lines[lineIndex] = lines[lineIndex].replace(/}\s*,/, '}');
                break;

            case 'await_without_async':
                // Procura a declaração da função e adiciona async
                for (let i = lineIndex; i >= 0; i--) {
                    if (lines[i].match(/function\s+\w+\s*\(|^\s*\w+\s*\(/)) {
                        if (!lines[i].includes('async')) {
                            lines[i] = lines[i].replace(/function/, 'async function');
                            lines[i] = lines[i].replace(/^(\s*)(\w+\s*\()/, '$1async $2');
                        }
                        break;
                    }
                }
                break;

            case 'async_call_without_await':
                lines[lineIndex] = lines[lineIndex].replace(
                    /(calcularPlano\(|atualizarTudo\(|syncPayoutButtons\()/,
                    'await $1'
                );
                break;
        }

        return lines.join('\n');
    }

    /**
     * 🔍 Valida arquivo específico
     */
    async validateFile(filepath) {
        try {
            const response = await fetch(filepath);
            const code = await response.text();
            return this.validateCode(code, filepath);
        } catch (error) {
            console.error(`❌ Erro ao validar ${filepath}:`, error);
            return { isValid: false, violations: [], error: error.message };
        }
    }

    /**
     * 🌐 Valida múltiplos arquivos
     */
    async validateFiles(filepaths) {
        const results = await Promise.all(filepaths.map((filepath) => this.validateFile(filepath)));

        const summary = {
            totalFiles: results.length,
            validFiles: results.filter((r) => r.isValid).length,
            invalidFiles: results.filter((r) => !r.isValid).length,
            totalViolations: results.reduce((sum, r) => sum + r.violations.length, 0),
            results,
        };

        console.log(
            `📊 Validação completa: ${summary.validFiles}/${summary.totalFiles} arquivos válidos`
        );

        return summary;
    }

    /**
     * 📊 Relatório de validação
     */
    getValidationReport() {
        return {
            isActive: this.isActive,
            rulesCount: this.rules.size,
            totalViolations: this.violations.length,
            recentViolations: this.violations.slice(-10),
        };
    }

    /**
     * 🚨 Emergency stop
     */
    emergencyStop() {
        console.log('🚨 SyntaxValidator: Emergency stop');
        this.isActive = false;
    }
}

// Inicialização automática
let syntaxValidator = null;

if (typeof window !== 'undefined') {
    window.SyntaxValidator = SyntaxValidator;

    function initializeSyntaxValidator() {
        if (!window.syntaxValidator) {
            syntaxValidator = new SyntaxValidator();
            window.syntaxValidator = syntaxValidator;

            // Funções de debug
            window.validateCurrentCode = (code) => syntaxValidator.validateCode(code);
            window.getValidationReport = () => syntaxValidator.getValidationReport();

            console.log('🔍 SyntaxValidator ativo! Use validateCurrentCode(code) para testar');
        }
    }

    // Inicializa imediatamente
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSyntaxValidator);
    } else {
        initializeSyntaxValidator();
    }
}

export { SyntaxValidator };
