/**
 * 📚 DOCUMENTAÇÃO DINÂMICA INTERATIVA
 * Sistema avançado de documentação auto-gerada e interativa
 *
 * @module DynamicDocs
 * @author Sistema de Qualidade Avançada
 * @version 3.0.0
 */

/**
 * Gerador de documentação dinâmica
 */
export class DynamicDocumentationGenerator {
    constructor() {
        this.modules = new Map();
        this.examples = new Map();
        this.usage = new Map();
        this.performance = new Map();
        this.relationships = new Map();
    }

    /**
     * Registra módulo para documentação automática
     *
     * @param {string} moduleName - Nome do módulo
     * @param {Object} moduleObject - Objeto do módulo
     * @param {Object} metadata - Metadados adicionais
     */
    registerModule(moduleName, moduleObject, metadata = {}) {
        const moduleDoc = this._analyzeModule(moduleObject, metadata);
        this.modules.set(moduleName, moduleDoc);

        // Auto-detecta relacionamentos
        this._detectRelationships(moduleName, moduleDoc);

        return moduleDoc;
    }

    /**
     * Adiciona exemplo de uso
     *
     * @param {string} methodPath - Caminho do método (módulo.método)
     * @param {Object} example - Exemplo com código e resultado
     */
    addExample(methodPath, example) {
        if (!this.examples.has(methodPath)) {
            this.examples.set(methodPath, []);
        }

        this.examples.get(methodPath).push({
            ...example,
            id: `example_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            verified: false,
        });
    }

    /**
     * Registra uso de método em tempo real
     *
     * @param {string} methodPath - Caminho do método
     * @param {Object} usageData - Dados de uso
     */
    recordUsage(methodPath, usageData) {
        if (!this.usage.has(methodPath)) {
            this.usage.set(methodPath, {
                callCount: 0,
                totalTime: 0,
                averageTime: 0,
                errors: 0,
                lastUsed: null,
                popularArgs: new Map(),
            });
        }

        const usage = this.usage.get(methodPath);
        usage.callCount++;
        usage.totalTime += usageData.executionTime || 0;
        usage.averageTime = usage.totalTime / usage.callCount;
        usage.lastUsed = new Date().toISOString();

        if (usageData.error) {
            usage.errors++;
        }

        // Rastreia argumentos populares
        if (usageData.args) {
            const argsKey = JSON.stringify(usageData.args);
            usage.popularArgs.set(argsKey, (usage.popularArgs.get(argsKey) || 0) + 1);
        }
    }

    /**
     * Gera documentação completa
     *
     * @param {string} format - Formato de saída ('html', 'markdown', 'json')
     * @returns {string} Documentação gerada
     */
    generateDocumentation(format = 'html') {
        const docData = this._buildDocumentationData();

        switch (format) {
            case 'html':
                return this._generateHTML(docData);
            case 'markdown':
                return this._generateMarkdown(docData);
            case 'json':
                return JSON.stringify(docData, null, 2);
            default:
                throw new Error(`Formato não suportado: ${format}`);
        }
    }

    /**
     * Gera documentação interativa
     *
     * @returns {HTMLElement} Elemento DOM com documentação interativa
     */
    generateInteractiveDoc() {
        const container = document.createElement('div');
        container.className = 'dynamic-docs-container';

        // Adiciona estilos CSS inline
        this._injectStyles(container);

        // Constrói interface
        const nav = this._buildNavigation();
        const content = this._buildContent();
        const examples = this._buildExamplesPanel();

        container.appendChild(nav);
        container.appendChild(content);
        container.appendChild(examples);

        // Adiciona funcionalidades interativas
        this._attachInteractivity(container);

        return container;
    }

    /**
     * Analisa módulo e extrai metadados
     *
     * @private
     */
    _analyzeModule(moduleObject, metadata) {
        const analysis = {
            name: metadata.name || 'Módulo sem nome',
            description: metadata.description || '',
            version: metadata.version || '1.0.0',
            methods: [],
            properties: [],
            dependencies: [],
            complexity: 0,
            coverage: 0,
        };

        // Analisa métodos
        for (const [key, value] of Object.entries(moduleObject)) {
            if (typeof value === 'function') {
                analysis.methods.push(this._analyzeMethod(key, value));
            } else {
                analysis.properties.push(this._analyzeProperty(key, value));
            }
        }

        // Calcula complexidade
        analysis.complexity = this._calculateComplexity(analysis);

        return analysis;
    }

    /**
     * Analisa método individual
     *
     * @private
     */
    _analyzeMethod(name, method) {
        const methodStr = method.toString();

        return {
            name,
            signature: this._extractSignature(methodStr),
            parameters: this._extractParameters(methodStr),
            returnType: this._detectReturnType(methodStr),
            isAsync: method.constructor.name === 'AsyncFunction',
            complexity: this._calculateMethodComplexity(methodStr),
            lines: methodStr.split('\n').length,
            documentation: this._extractJSDoc(methodStr),
            examples: [],
            usage: null,
        };
    }

    /**
     * Analisa propriedade
     *
     * @private
     */
    _analyzeProperty(name, value) {
        return {
            name,
            type: typeof value,
            value: this._safeStringify(value),
            isConstant: Object.isFrozen(value),
            documentation: '',
        };
    }

    /**
     * Detecta relacionamentos entre módulos
     *
     * @private
     */
    _detectRelationships(moduleName, moduleDoc) {
        if (!this.relationships.has(moduleName)) {
            this.relationships.set(moduleName, {
                imports: [],
                exports: [],
                usedBy: [],
                uses: [],
            });
        }

        // Analisa imports através de comentários e código
        const relationships = this.relationships.get(moduleName);

        // Detecta dependências através de análise estática
        moduleDoc.methods.forEach((method) => {
            const methodStr = method.signature;

            // Procura por chamadas de outros módulos
            this.modules.forEach((otherModule, otherName) => {
                if (otherName !== moduleName) {
                    otherModule.methods.forEach((otherMethod) => {
                        if (methodStr.includes(otherMethod.name)) {
                            if (!relationships.uses.includes(otherName)) {
                                relationships.uses.push(otherName);
                            }

                            // Adiciona relacionamento reverso
                            if (!this.relationships.has(otherName)) {
                                this.relationships.set(otherName, {
                                    imports: [],
                                    exports: [],
                                    usedBy: [],
                                    uses: [],
                                });
                            }

                            const otherRel = this.relationships.get(otherName);
                            if (!otherRel.usedBy.includes(moduleName)) {
                                otherRel.usedBy.push(moduleName);
                            }
                        }
                    });
                }
            });
        });
    }

    /**
     * Constrói dados completos de documentação
     *
     * @private
     */
    _buildDocumentationData() {
        const modules = [];

        for (const [name, moduleDoc] of this.modules) {
            const enhancedModule = {
                ...moduleDoc,
                relationships: this.relationships.get(name) || {
                    imports: [],
                    exports: [],
                    usedBy: [],
                    uses: [],
                },
                examples: [],
                usageStats: {},
            };

            // Adiciona exemplos
            enhancedModule.methods.forEach((method) => {
                const methodPath = `${name}.${method.name}`;
                method.examples = this.examples.get(methodPath) || [];
                method.usage = this.usage.get(methodPath) || null;
            });

            modules.push(enhancedModule);
        }

        return {
            generated: new Date().toISOString(),
            modules,
            statistics: this._generateStatistics(),
            coverage: this._calculateCoverage(),
        };
    }

    /**
     * Gera documentação HTML
     *
     * @private
     */
    _generateHTML(docData) {
        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentação Dinâmica - Sistema UI</title>
    <style>
        ${this._getDocumentationCSS()}
    </style>
</head>
<body>
    <header class="doc-header">
        <h1>📚 Documentação Dinâmica</h1>
        <p>Gerado em: ${new Date(docData.generated).toLocaleString('pt-BR')}</p>
        <div class="stats">
            <span>Módulos: ${docData.modules.length}</span>
            <span>Cobertura: ${docData.coverage.percentage}%</span>
            <span>Métodos: ${docData.statistics.totalMethods}</span>
        </div>
    </header>
    
    <nav class="doc-nav">
        ${this._generateModuleNavigation(docData.modules)}
    </nav>
    
    <main class="doc-content">
        ${docData.modules.map((module) => this._generateModuleHTML(module)).join('')}
    </main>
    
    <script>
        ${this._getDocumentationJS()}
    </script>
</body>
</html>`;
    }

    /**
     * Extrai assinatura de método
     *
     * @private
     */
    _extractSignature(methodStr) {
        const lines = methodStr.split('\n');
        return lines[0].trim();
    }

    /**
     * Extrai parâmetros
     *
     * @private
     */
    _extractParameters(methodStr) {
        const match = methodStr.match(/\(([^)]*)\)/);
        if (!match) return [];

        return match[1]
            .split(',')
            .map((param) => param.trim())
            .filter((param) => param.length > 0)
            .map((param) => {
                const [name, defaultValue] = param.split('=').map((p) => p.trim());
                return {
                    name: name.replace(/\.\.\./g, ''),
                    hasDefault: param.includes('='),
                    defaultValue: defaultValue || null,
                    isSpread: param.includes('...'),
                };
            });
    }

    /**
     * Detecta tipo de retorno
     *
     * @private
     */
    _detectReturnType(methodStr) {
        if (methodStr.includes('async ')) return 'Promise';
        if (methodStr.includes('return ')) {
            // Análise simples de tipo de retorno
            const returnMatches = methodStr.match(/return\s+([^;]+)/g);
            if (returnMatches && returnMatches.length > 0) {
                const firstReturn = returnMatches[0];
                if (firstReturn.includes('true') || firstReturn.includes('false')) return 'boolean';
                if (firstReturn.includes('"') || firstReturn.includes("'")) return 'string';
                if (firstReturn.includes('[') || firstReturn.includes('Array')) return 'Array';
                if (firstReturn.includes('{') || firstReturn.includes('Object')) return 'Object';
            }
        }
        return 'unknown';
    }

    /**
     * Calcula complexidade de método
     *
     * @private
     */
    _calculateMethodComplexity(methodStr) {
        let complexity = 1; // Base complexity

        // Conta estruturas de controle
        const patterns = [
            /if\s*\(/g,
            /else\s+if\s*\(/g,
            /while\s*\(/g,
            /for\s*\(/g,
            /switch\s*\(/g,
            /case\s+/g,
            /catch\s*\(/g,
            /\?\s*[^:]+:/g, // ternary
        ];

        patterns.forEach((pattern) => {
            const matches = methodStr.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        });

        return complexity;
    }

    /**
     * Segurança para stringify
     *
     * @private
     */
    _safeStringify(value) {
        try {
            if (typeof value === 'function') {
                return value.toString().substring(0, 100) + '...';
            }
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }

    /**
     * CSS para documentação
     *
     * @private
     */
    _getDocumentationCSS() {
        return `
            * { box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; background: #f5f7fa; }
            .doc-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; }
            .doc-header h1 { margin: 0; font-size: 2.5rem; }
            .stats { margin-top: 1rem; display: flex; justify-content: center; gap: 2rem; }
            .stats span { background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 20px; }
            .doc-nav { background: white; padding: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .doc-content { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; }
            .module-section { background: white; margin: 2rem 0; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .method-card { border: 1px solid #e1e8ed; margin: 1rem 0; padding: 1rem; border-radius: 8px; }
            .method-signature { font-family: 'Monaco', 'Courier New', monospace; background: #f8f9fa; padding: 0.5rem; border-radius: 4px; }
            .usage-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 1rem 0; }
            .stat-card { background: #f8f9fa; padding: 1rem; border-radius: 6px; text-align: center; }
            .examples { margin-top: 1rem; }
            .example { background: #f8f9fa; padding: 1rem; margin: 0.5rem 0; border-radius: 4px; border-left: 4px solid #007bff; }
            .interactive-btn { background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
            .interactive-btn:hover { background: #0056b3; }
        `;
    }

    /**
     * JavaScript para interatividade
     *
     * @private
     */
    _getDocumentationJS() {
        return `
            document.addEventListener('DOMContentLoaded', function() {
                // Navegação suave
                document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                    anchor.addEventListener('click', function (e) {
                        e.preventDefault();
                        const target = document.querySelector(this.getAttribute('href'));
                        target.scrollIntoView({ behavior: 'smooth' });
                    });
                });
                
                // Busca interativa
                const searchInput = document.getElementById('doc-search');
                if (searchInput) {
                    searchInput.addEventListener('input', function() {
                        const query = this.value.toLowerCase();
                        const sections = document.querySelectorAll('.module-section, .method-card');
                        
                        sections.forEach(section => {
                            const text = section.textContent.toLowerCase();
                            section.style.display = text.includes(query) ? 'block' : 'none';
                        });
                    });
                }
                
                // Expansão/colapso de seções
                document.querySelectorAll('.collapsible').forEach(element => {
                    element.addEventListener('click', function() {
                        this.classList.toggle('active');
                        const content = this.nextElementSibling;
                        content.style.display = content.style.display === 'none' ? 'block' : 'none';
                    });
                });
                
                console.log('📚 Documentação interativa carregada!');
            });
        `;
    }
}

/**
 * Auto-documentador que intercepta execuções
 */
export class AutoDocumenter {
    constructor(docGenerator) {
        this.docGenerator = docGenerator;
        this.interceptedMethods = new Map();
    }

    /**
     * Intercepta método para documentação automática
     *
     * @param {Object} target - Objeto alvo
     * @param {string} methodName - Nome do método
     * @param {string} moduleName - Nome do módulo
     */
    intercept(target, methodName, moduleName) {
        const original = target[methodName];

        if (typeof original !== 'function') {
            return;
        }

        const methodPath = `${moduleName}.${methodName}`;

        target[methodName] = (...args) => {
            const start = performance.now();

            try {
                const result = original.apply(target, args);

                // Se é promise, intercepta resolução
                if (result && typeof result.then === 'function') {
                    return result
                        .then((value) => {
                            this._recordUsage(methodPath, {
                                args,
                                executionTime: performance.now() - start,
                                success: true,
                                result: value,
                            });
                            return value;
                        })
                        .catch((error) => {
                            this._recordUsage(methodPath, {
                                args,
                                executionTime: performance.now() - start,
                                success: false,
                                error: error.message,
                            });
                            throw error;
                        });
                }

                // Execução síncrona
                this._recordUsage(methodPath, {
                    args,
                    executionTime: performance.now() - start,
                    success: true,
                    result,
                });

                return result;
            } catch (error) {
                this._recordUsage(methodPath, {
                    args,
                    executionTime: performance.now() - start,
                    success: false,
                    error: error.message,
                });
                throw error;
            }
        };

        this.interceptedMethods.set(methodPath, { target, methodName, original });
    }

    /**
     * Remove interceptação
     *
     * @param {string} methodPath - Caminho do método
     */
    restore(methodPath) {
        const intercepted = this.interceptedMethods.get(methodPath);
        if (intercepted) {
            intercepted.target[intercepted.methodName] = intercepted.original;
            this.interceptedMethods.delete(methodPath);
        }
    }

    /**
     * Registra uso do método
     *
     * @private
     */
    _recordUsage(methodPath, usageData) {
        this.docGenerator.recordUsage(methodPath, usageData);

        // Auto-gera exemplos baseados no uso real
        if (usageData.success && usageData.args.length > 0) {
            this._generateExample(methodPath, usageData);
        }
    }

    /**
     * Gera exemplo automático baseado no uso
     *
     * @private
     */
    _generateExample(methodPath, usageData) {
        const example = {
            title: 'Uso real capturado',
            description: 'Exemplo gerado automaticamente baseado no uso real',
            code: this._generateExampleCode(methodPath, usageData.args),
            result: this._safeStringify(usageData.result),
            executionTime: usageData.executionTime,
            auto: true,
        };

        this.docGenerator.addExample(methodPath, example);
    }

    /**
     * Gera código de exemplo
     *
     * @private
     */
    _generateExampleCode(methodPath, args) {
        const argsStr = args.map((arg) => this._safeStringify(arg)).join(', ');
        return `${methodPath}(${argsStr})`;
    }

    /**
     * Stringify seguro
     *
     * @private
     */
    _safeStringify(value) {
        try {
            if (typeof value === 'string') return `"${value}"`;
            if (typeof value === 'function') return 'function()';
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }
}

/**
 * Instâncias globais
 */
export const globalDocGenerator = new DynamicDocumentationGenerator();
export const globalAutoDocumenter = new AutoDocumenter(globalDocGenerator);

export default {
    DynamicDocumentationGenerator,
    AutoDocumenter,
    globalDocGenerator,
    globalAutoDocumenter,
};
