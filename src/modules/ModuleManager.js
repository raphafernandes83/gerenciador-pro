/**
 * 🎯 MODULE MANAGER
 * Gerencia registro, inicialização e lifecycle de módulos
 * 
 * @module ModuleManager
 * @since Fase 3 - Checkpoint 3.1
 */

class ModuleManager {
    constructor() {
        this.modules = new Map();
        this.initOrder = [];
        console.log('🏗️ ModuleManager criado');
    }

    /**
     * Registra um módulo
     */
    register(name, module) {
        if (this.modules.has(name)) {
            throw new Error(`Módulo ${name} já registrado`);
        }

        this.modules.set(name, module);
        console.log(`✅ Módulo registrado: ${name}`);
        return this;
    }

    /**
     * Obtém módulo registrado
     */
    get(name) {
        if (!this.modules.has(name)) {
            throw new Error(`Módulo não encontrado: ${name}`);
        }
        return this.modules.get(name);
    }

    /**
     * Verifica se módulo existe
     */
    has(name) {
        return this.modules.has(name);
    }

    /**
     * Inicializa todos os módulos na ordem de registro
     */
    async initAll() {
        console.log('🚀 Inicializando todos os módulos...');

        for (const [name, module] of this.modules) {
            try {
                await module.init();
                this.initOrder.push(name);
                console.log(`✅ ${name} inicializado`);
            } catch (error) {
                console.error(`❌ Erro ao inicializar ${name}:`, error);
                throw error;
            }
        }

        console.log(`✅ ${this.modules.size} módulos inicializados`);
    }

    /**
     * Destroi todos os módulos
     */
    destroyAll() {
        console.log('🧹 Destruindo todos os módulos...');

        // Destroi na ordem inversa de inicialização
        for (const name of this.initOrder.reverse()) {
            try {
                const module = this.modules.get(name);
                module?.destroy();
            } catch (error) {
                console.error(`Erro ao destruir ${name}:`, error);
            }
        }

        this.modules.clear();
        this.initOrder = [];
        console.log('✅ Todos os módulos destruídos');
    }

    /**
     * Retorna informações de todos os módulos
     */
    getInfo() {
        const info = {};
        for (const [name, module] of this.modules) {
            info[name] = module.getInfo();
        }
        return info;
    }

    /**
     * Retorna estatísticas
     */
    getStats() {
        return {
            totalModules: this.modules.size,
            initialized: this.initOrder.length,
            modules: Array.from(this.modules.keys())
        };
    }
}

// Singleton
export const moduleManager = new ModuleManager();
export default moduleManager;

// Expõe globalmente para debug
if (typeof window !== 'undefined') {
    window.moduleManager = moduleManager;
}
