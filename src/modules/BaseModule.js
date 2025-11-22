/**
 * 🏗️ BASE MODULE
 * Classe base para todos os módulos do sistema
 * 
 * @module BaseModule
 * @since Fase 3 - Checkpoint 3.1
 */

export class BaseModule {
    constructor(name) {
        this.name = name;
        this.initialized = false;
        this._dependencies = new Map();
        console.log(`📦 Módulo ${name} criado`);
    }

    /**
     * Registra dependência de outro módulo
     */
    registerDependency(key, module) {
        this._dependencies.set(key, module);
        console.log(`🔗 ${this.name}: Dependência registrada - ${key}`);
    }

    /**
     * Obtém dependência registrada
     */
    getDependency(key) {
        if (!this._dependencies.has(key)) {
            throw new Error(`${this.name}: Dependência não encontrada - ${key}`);
        }
        return this._dependencies.get(key);
    }

    /**
     * Inicialização do módulo (deve ser sobrescrito)
     */
    async init() {
        if (this.initialized) {
            console.warn(`⚠️ ${this.name} já foi inicializado`);
            return;
        }

        console.log(`🚀 Inicializando ${this.name}...`);
        this.initialized = true;
    }

    /**
     * Verifica se módulo está pronto
     */
    isReady() {
        return this.initialized;
    }

    /**
     * Cleanup do módulo
     */
    destroy() {
        console.log(`🧹 Destruindo ${this.name}...`);
        this._dependencies.clear();
        this.initialized = false;
    }

    /**
     * Retorna informações do módulo
     */
    getInfo() {
        return {
            name: this.name,
            initialized: this.initialized,
            dependencies: Array.from(this._dependencies.keys())
        };
    }
}

export default BaseModule;
