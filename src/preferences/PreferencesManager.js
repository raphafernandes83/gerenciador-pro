/**
 * PreferencesManager - Gerencia persistência de preferências do usuário
 * Armazena toggles e configurações em localStorage
 * 
 * @author Gerenciador Pro
 * @version 1.0.0
 */

const STORAGE_KEY_PREFIX = 'gerenciadorPro_';

export class PreferencesManager {
    /**
     * Salva preferência no localStorage
     * @param {string} key - Chave da preferência
     * @param {any} value - Valor a ser salvo
     * @returns {boolean} true se salvou com sucesso
     */
    static save(key, value) {
        try {
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(value));
            console.log(`✅ Preferência salva: ${key} = ${value}`);
            return true;
        } catch (error) {
            console.error(`❌ Erro ao salvar preferência ${key}:`, error);
            return false;
        }
    }

    /**
     * Carrega preferência do localStorage
     * @param {string} key - Chave da preferência
     * @param {any} defaultValue - Valor padrão se não existir
     * @returns {any} Valor armazenado ou padrão
     */
    static load(key, defaultValue = null) {
        try {
            const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
            return stored !== null ? JSON.parse(stored) : defaultValue;
        } catch (error) {
            console.error(`❌ Erro ao carregar preferência ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Inicializa preferências ao carregar a aplicação
     * Carrega valores salvos e aplica aos toggles e config
     */
    static init() {
        console.log('🔧 Inicializando PreferencesManager...');

        // Carregar toggle "Incorporar Lucros"
        const incorporarLucros = this.load('incorporarLucros', false);
        const toggleIncorporar = document.getElementById('modal-incorporar-lucro-toggle');
        if (toggleIncorporar) {
            toggleIncorporar.checked = incorporarLucros;
            console.log(`  ✓ Incorporar Lucros: ${incorporarLucros}`);
        }
        if (window.config) {
            window.config.incorporarLucros = incorporarLucros;
        }

        // Carregar toggle "Modo Guiado"
        const modoGuiado = this.load('modoGuiado', true); // default ON
        const toggleGuiado = document.getElementById('modal-modo-guiado-toggle');
        if (toggleGuiado) {
            toggleGuiado.checked = modoGuiado;
            console.log(`  ✓ Modo Guiado: ${modoGuiado}`);
        }
        if (window.config) {
            window.config.modoGuiado = modoGuiado;
        }

        console.log('✅ Preferências carregadas do localStorage');
    }

    /**
     * Adiciona listeners aos toggles para salvar automaticamente
     * Configura auto-save quando o usuário altera os toggles
     */
    static bindToggles() {
        console.log('🔧 Registrando listeners de preferências...');

        // Toggle Incorporar Lucros
        const toggleIncorporar = document.getElementById('modal-incorporar-lucro-toggle');
        if (toggleIncorporar) {
            toggleIncorporar.addEventListener('change', (e) => {
                this.save('incorporarLucros', e.target.checked);
                if (window.config) {
                    window.config.incorporarLucros = e.target.checked;
                }
                console.log(`  ✓ Incorporar Lucros alterado: ${e.target.checked}`);
            });
        }

        // Toggle Modo Guiado
        const toggleModoGuiado = document.getElementById('modal-modo-guiado-toggle');
        if (toggleModoGuiado) {
            toggleModoGuiado.addEventListener('change', (e) => {
                this.save('modoGuiado', e.target.checked);
                if (window.config) {
                    window.config.modoGuiado = e.target.checked;
                }
                console.log(`  ✓ Modo Guiado alterado: ${e.target.checked}`);
            });
        }

        console.log('✅ Listeners de preferências registrados');
    }
}

// Expor globalmente para compatibilidade
if (typeof window !== 'undefined') {
    window.PreferencesManager = PreferencesManager;
}
