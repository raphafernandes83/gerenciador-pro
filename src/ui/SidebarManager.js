/**
 * Gerenciador avançado do Menu Lateral
 * Extensão da classe base para funcionalidades premium
 */

import { sidebar } from '../../sidebar.js';
import { state, config } from '../../state.js';
import { ui } from '../../ui.js';

export class SidebarManager {
    constructor() {
        this.sidebar = sidebar;
        this.contentCache = new Map();
        this.activeModal = null;
    }

    /**
     * Integra sidebar com o sistema de configurações existente
     */
    integrateWithSettings() {
        // Escuta eventos de navegação da sidebar
        document.addEventListener('sidebar:navigate', (event) => {
            this.handleNavigation(event.detail.section);
        });

        // Escuta mudanças de estado
        document.addEventListener('sidebar:expand', () => {
            this.onSidebarExpand();
        });

        document.addEventListener('sidebar:collapse', () => {
            this.onSidebarCollapse();
        });
    }

    /**
     * Manipula navegação entre seções
     */
    handleNavigation(section) {
        console.log(`Navegando para: ${section}`);

        // Se o sidebar raiz já gerencia modais, não criar outro aqui
        if (window.sidebar && typeof window.sidebar.showContentModal === 'function') {
            try {
                // Delegar navegação ao sidebar raiz
                const item = this.container?.querySelector(`.sidebar-nav-item[data-section="${section}"]`);
                if (item && typeof item.click === 'function') item.click();
                return;
            } catch (_) {}
        }

        // Fecha modal se estiver aberto
        this.closeActiveModal();

        // Renderiza conteúdo da seção
        this.renderSectionContent(section);
    }

    /**
     * Renderiza conteúdo de uma seção específica
     */
    renderSectionContent(section) {
        // Verifica cache
        if (this.contentCache.has(section)) {
            this.displayContent(this.contentCache.get(section));
            return;
        }

        // Gera conteúdo baseado na seção
        let content;
        switch (section) {
            case 'profile':
                content = this.renderProfileContent();
                break;
            case 'parameters':
                // Parâmetros já são mostrados no card sempre visível
                content = this.renderParametersDetail();
                break;
            case 'management':
                content = this.renderManagementContent();
                break;
            case 'appearance':
                content = this.renderAppearanceContent();
                break;
            case 'preferences':
                content = this.renderPreferencesContent();
                break;
            default:
                content = '<p>Seção não encontrada</p>';
        }

        // Cacheia e exibe
        this.contentCache.set(section, content);
        this.displayContent(content);
    }

    /**
     * Renderiza conteúdo do perfil
     */
    renderProfileContent() {
        const traderName = config.traderName || 'Trader';
        return `
            <div class="sidebar-content-section">
                <h2>Perfil do Trader</h2>
                <div class="profile-settings">
                    <div class="form-group">
                        <label>Nome do Trader</label>
                        <input type="text" id="sidebar-trader-name" value="${traderName}" />
                    </div>
                    <button class="btn btn-primary" onclick="sidebarManager.saveProfile()">
                        Salvar Perfil
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza detalhes dos parâmetros
     */
    renderParametersDetail() {
        // Espelha o card principal "Parâmetros e Controles" dentro do modal da sidebar
        const originalPanel = document.getElementById('input-panel');
        if (originalPanel) {
            const clonedPanel = originalPanel.cloneNode(true);
            clonedPanel.removeAttribute('id');
            clonedPanel.classList.add('sidebar-content-section');

            // Ajusta IDs para evitar colisão com o card principal e permitir sync bidirecional
            const inputs = [
                { original: 'capital-inicial', new: 'sidebar-capital-inicial' },
                { original: 'percentual-entrada', new: 'sidebar-percentual-entrada' },
                { original: 'stop-win-perc', new: 'sidebar-stop-win-perc' },
                { original: 'stop-loss-perc', new: 'sidebar-stop-loss-perc' },
                { original: 'estrategia-select', new: 'sidebar-estrategia-select' },
            ];

            inputs.forEach(({ original, new: newId }) => {
                const input = clonedPanel.querySelector(`#${original}`);
                if (input) {
                    input.id = newId;
                    const originalInput = document.getElementById(original);
                    if (originalInput) input.value = originalInput.value;
                }
            });

            // Campo hidden de payout
            const hiddenPayout = clonedPanel.querySelector('#payout-ativo');
            if (hiddenPayout) hiddenPayout.id = 'sidebar-payout-ativo';

            // Botões de payout (IDs e atributos exclusivos + refletir estado ativo)
            const payoutContainer = clonedPanel.querySelector('.payout-buttons');
            if (payoutContainer) {
                payoutContainer.id = 'sidebar-payout-buttons';
                const payoutButtons = payoutContainer.querySelectorAll('button');
                payoutButtons.forEach((button, idx) => {
                    const payout = button.textContent.trim();
                    button.id = `sidebar-payout-${payout}`;
                    button.setAttribute('data-payout', payout);
                    button.setAttribute('data-source', 'sidebar');

                    const mainButtons = document.querySelectorAll('.payout-buttons button');
                    const mainBtn = mainButtons && mainButtons[idx];
                    if (mainBtn && mainBtn.classList.contains('active-payout')) {
                        button.classList.add('active-payout');
                    }
                });
            }

            // Removido: indicador de sincronização e botão "Fechar" para abrir diretamente o card

            // Sinaliza que o modal está pronto para os sistemas de sync existentes
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('sidebarModalReady'));
                document.dispatchEvent(new CustomEvent('payoutButtonsReady'));
            }, 100);

            return `<div class=\"sidebar-content-section\">${clonedPanel.innerHTML}</div>`;
        }

        // Fallback mínimo se o painel principal não existir
        return `
            <div class="sidebar-content-section">
                <h2>Parâmetros e Controles</h2>
                <p>Não foi possível localizar o card principal no DOM.</p>
            </div>
        `;
    }

    /**
     * Renderiza conteúdo de gerenciamento
     */
    renderManagementContent() {
        return `
            <div class="sidebar-content-section">
                <h2>Gerenciamento</h2>
                <div class="settings-group">
                    <div class="setting-item">
                        <div class="setting-header">
                            <label for="sidebar-modo-guiado">Modo Guiado</label>
                            <span class="tooltip-icon" title="Trava as operações, permitindo registrar resultados apenas na etapa atual do plano.">?</span>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="sidebar-modo-guiado" ${config.modoGuiado ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-header">
                            <label for="sidebar-incorporar-lucros">Incorporar Lucros</label>
                            <span class="tooltip-icon" title="Soma automaticamente o lucro de ciclos vencedores ao capital, recalculando os próximos aportes (juros compostos).">?</span>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="sidebar-incorporar-lucros" ${config.incorporarLucros ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-header">
                            <label for="sidebar-bloqueio-auto">Bloqueio Automático</label>
                            <span class="tooltip-icon" title="Bloqueia o app por um tempo após atingir a meta de ganho ou perda.">?</span>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="sidebar-bloqueio-auto" ${config.bloqueioAutomatico ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div id="sidebar-lock-duration-container" class="setting-item ${config.bloqueioAutomatico ? '' : 'hidden'}">
                        <label for="sidebar-lock-duration">Duração do Bloqueio</label>
                        <select id="sidebar-lock-duration" class="form-select">
                            <option value="8" ${config.duracaoBloqueioHoras === 8 ? 'selected' : ''}>8 Horas</option>
                            <option value="12" ${config.duracaoBloqueioHoras === 12 ? 'selected' : ''}>12 Horas</option>
                            <option value="16" ${config.duracaoBloqueioHoras === 16 ? 'selected' : ''}>16 Horas</option>
                            <option value="20" ${config.duracaoBloqueioHoras === 20 ? 'selected' : ''}>20 Horas</option>
                        </select>
                    </div>
                    
                    <hr class="divider">
                    
                    <h3>Estratégia de Recuperação</h3>
                    <div class="setting-item">
                        <div class="setting-header">
                            <label for="sidebar-divisor-recuperacao">Divisão de Recuperação</label>
                            <span class="tooltip-icon" title="Defina a agressividade da sua recuperação. Isto ajusta a percentagem do prejuízo que cada um dos dois aportes de recuperação tentará cobrir.">?</span>
                        </div>
                        <div class="slider-control">
                            <button class="slider-btn" onclick="sidebarManager.adjustRecoverySlider(-5)">-</button>
                            <input type="range" 
                                   id="sidebar-divisor-recuperacao" 
                                   min="10" 
                                   max="90" 
                                   value="${config.divisorRecuperacao || 35}" 
                                   step="1"
                                   class="slider-input">
                            <button class="slider-btn" onclick="sidebarManager.adjustRecoverySlider(5)">+</button>
                        </div>
                        <div class="slider-value" id="sidebar-recovery-value">
                            <span>${config.divisorRecuperacao || 35}%</span> / <span>${100 - (config.divisorRecuperacao || 35)}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="settings-actions">
                    <button class="btn btn-primary" onclick="sidebarManager.applyManagementSettings()">
                        Aplicar Configurações
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza conteúdo de aparência
     */
    renderAppearanceContent() {
        return `
            <div class="sidebar-content-section">
                <h2>Aparência</h2>
                <h3>Temas</h3>
                <div class="theme-selector">
                    <div class="theme-card ${config.tema === 'moderno' ? 'active' : ''}" data-theme="moderno">
                        <div class="theme-preview">
                            <div class="theme-preview-col" style="background-color: #1a1c20;"></div>
                            <div class="theme-preview-col" style="background-color: #2b2e34;"></div>
                            <div class="theme-preview-col" style="background-color: #00e676;"></div>
                        </div>
                        <p>Moderno</p>
                    </div>
                    <div class="theme-card ${config.tema === 'claro' ? 'active' : ''}" data-theme="claro">
                        <div class="theme-preview">
                            <div class="theme-preview-col" style="background-color: #f0f2f5;"></div>
                            <div class="theme-preview-col" style="background-color: #ffffff;"></div>
                            <div class="theme-preview-col" style="background-color: #16a34a;"></div>
                        </div>
                        <p>Claro</p>
                    </div>
                    <div class="theme-card ${config.tema === 'matrix' ? 'active' : ''}" data-theme="matrix">
                        <div class="theme-preview">
                            <div class="theme-preview-col" style="background-color: #020b03;"></div>
                            <div class="theme-preview-col" style="background-color: #0a1f0c;"></div>
                            <div class="theme-preview-col" style="background-color: #00ff41;"></div>
                        </div>
                        <p>Matrix</p>
                    </div>
                    <div class="theme-card ${config.tema === 'daltonismo' ? 'active' : ''}" data-theme="daltonismo">
                        <div class="theme-preview">
                            <div class="theme-preview-col" style="background-color: #f5f5f5;"></div>
                            <div class="theme-preview-col" style="background-color: #0072B2;"></div>
                            <div class="theme-preview-col" style="background-color: #D55E00;"></div>
                        </div>
                        <p>Contraste</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza conteúdo de preferências
     */
    renderPreferencesContent() {
        return `
            <div class="sidebar-content-section">
                <h2>Preferências</h2>
                <h3>Preferências Gerais</h3>
                <div class="settings-group">
                    <div class="setting-item">
                        <label for="sidebar-notificacoes">Notificações de Insight</label>
                        <label class="switch">
                            <input type="checkbox" id="sidebar-notificacoes" ${config.notificacoesAtivas ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <label for="sidebar-sons">Sons</label>
                        <label class="switch">
                            <input type="checkbox" id="sidebar-sons" ${config.sonsAtivos ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <label for="sidebar-zen-mode">Modo Zen (Ocultar Valores)</label>
                        <label class="switch">
                            <input type="checkbox" id="sidebar-zen-mode" ${config.zenMode ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-actions">
                    <button class="btn btn-primary" onclick="sidebarManager.applyPreferencesSettings()">
                        Aplicar Preferências
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Exibe conteúdo na área principal
     */
    displayContent(content) {
        // Não abre modal se não houver conteúdo
        if (!content || String(content).trim() === '') return;

        // Evita modal duplicado se o sidebar raiz já gerencia
        if (window.sidebar && typeof window.sidebar.showContentModal === 'function') {
            return;
        }

        // Cria modal flutuante para o conteúdo
        this.createContentModal(content);
    }

    /**
     * Cria modal para exibir conteúdo
     */
    createContentModal(content) {
        // Remove modal anterior se existir
        this.closeActiveModal();

        // Cria novo modal
        const modal = document.createElement('div');
        modal.className = 'sidebar-content-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" onclick="sidebarManager.closeActiveModal()">×</button>
                ${content}
            </div>
        `;

        document.body.appendChild(modal);
        this.activeModal = modal;

        // Anima entrada
        setTimeout(() => {
            modal.classList.add('visible');
            // Configura event listeners após o modal estar visível
            this.setupModalEventListeners();
        }, 10);
    }

    /**
     * Fecha modal ativo
     */
    closeActiveModal() {
        const modalToClose = this.activeModal;
        if (!modalToClose) return;

        modalToClose.classList.remove('visible');
        setTimeout(() => {
            try {
                if (modalToClose && typeof modalToClose.remove === 'function' && modalToClose.parentNode) {
                    modalToClose.remove();
                }
            } finally {
                if (this.activeModal === modalToClose) {
                    this.activeModal = null;
                }
            }
        }, 300);
    }

    /**
     * Salva perfil do trader
     */
    saveProfile() {
        const nameInput = document.getElementById('sidebar-trader-name');
        if (nameInput) {
            config.traderName = nameInput.value;
            localStorage.setItem('traderName', nameInput.value);
            ui.updateTraderNameDisplay();
            ui.showNotification('Perfil salvo com sucesso!', 'success');
        }
    }

    /**
     * Callback quando sidebar expande
     */
    onSidebarExpand() {
        // Ajusta layout principal se necessário
        const container = document.getElementById('container');
        if (container) {
            container.classList.add('sidebar-adjusted');
            container.style.marginLeft = 'var(--sidebar-width-expanded)';
        }
    }

    /**
     * Callback quando sidebar retrai
     */
    onSidebarCollapse() {
        // Ajusta layout principal
        const container = document.getElementById('container');
        if (container) {
            container.classList.add('sidebar-adjusted');
            container.style.marginLeft = 'var(--sidebar-width-collapsed)';
        }

        // Fecha modal se estiver aberto
        this.closeActiveModal();
    }

    /**
     * Atualiza dados em tempo real
     */
    updateRealtimeData() {
        if (this.sidebar && this.sidebar.updateRealtimeData) {
            this.sidebar.updateRealtimeData();
        }
    }

    /**
     * Configura event listeners do modal
     */
    setupModalEventListeners() {
        // Event listeners para gerenciamento
        const modoGuiado = document.getElementById('sidebar-modo-guiado');
        const incorporarLucros = document.getElementById('sidebar-incorporar-lucros');
        const bloqueioAuto = document.getElementById('sidebar-bloqueio-auto');
        const lockDuration = document.getElementById('sidebar-lock-duration');
        const divisorRecuperacao = document.getElementById('sidebar-divisor-recuperacao');

        if (modoGuiado) {
            modoGuiado.checked = config.modoGuiado;
            modoGuiado.addEventListener('change', (e) => {
                config.modoGuiado = e.target.checked;
            });
        }

        if (incorporarLucros) {
            incorporarLucros.checked = config.incorporarLucros;
            incorporarLucros.addEventListener('change', (e) => {
                config.incorporarLucros = e.target.checked;
            });
        }

        if (bloqueioAuto) {
            bloqueioAuto.checked = config.bloqueioAutomatico;
            bloqueioAuto.addEventListener('change', (e) => {
                config.bloqueioAutomatico = e.target.checked;
                const container = document.getElementById('sidebar-lock-duration-container');
                if (container) {
                    container.classList.toggle('hidden', !e.target.checked);
                }
            });
        }

        if (lockDuration) {
            lockDuration.addEventListener('change', (e) => {
                config.duracaoBloqueioHoras = parseInt(e.target.value);
            });
        }

        if (divisorRecuperacao) {
            divisorRecuperacao.addEventListener('input', (e) => {
                config.divisorRecuperacao = parseInt(e.target.value);
                this.updateRecoveryDisplay(e.target.value);
            });
        }

        // Event listeners para temas
        const themeCards = document.querySelectorAll('.sidebar-content-section .theme-card');
        themeCards.forEach((card) => {
            card.addEventListener('click', () => {
                const theme = card.dataset.theme;
                if (theme) {
                    ui.setTema(theme);
                    // Atualiza visual dos cards
                    themeCards.forEach((c) => c.classList.remove('active'));
                    card.classList.add('active');
                }
            });
        });

        // Event listeners para preferências
        const notificacoes = document.getElementById('sidebar-notificacoes');
        const sons = document.getElementById('sidebar-sons');
        const zenMode = document.getElementById('sidebar-zen-mode');

        if (notificacoes) {
            notificacoes.checked = config.notificacoesAtivas;
            notificacoes.addEventListener('change', (e) => {
                config.notificacoesAtivas = e.target.checked;
            });
        }

        if (sons) {
            sons.checked = config.sonsAtivos;
            sons.addEventListener('change', (e) => {
                config.sonsAtivos = e.target.checked;
            });
        }

        if (zenMode) {
            zenMode.checked = config.zenMode;
            zenMode.addEventListener('change', (e) => {
                config.zenMode = e.target.checked;
                ui.toggleZenMode();
            });
        }
    }

    /**
     * Aplica configurações de gerenciamento
     */
    applyManagementSettings() {
        // Salva configurações
        localStorage.setItem('gerenciadorProModoGuiado', JSON.stringify(config.modoGuiado));
        localStorage.setItem(
            'gerenciadorProIncorporarLucros',
            JSON.stringify(config.incorporarLucros)
        );
        localStorage.setItem(
            'gerenciadorProBloqueioAutomatico',
            JSON.stringify(config.bloqueioAutomatico)
        );

        // Atualiza UI
        ui.atualizarTudo();
        ui.showNotification('Configurações de gerenciamento aplicadas!', 'success');

        // Fecha modal após um breve delay
        setTimeout(() => this.closeActiveModal(), 1000);
    }

    /**
     * Aplica configurações de preferências
     */
    applyPreferencesSettings() {
        // Salva configurações
        localStorage.setItem(
            'gerenciadorProNotificacoes',
            JSON.stringify(config.notificacoesAtivas)
        );
        localStorage.setItem('gerenciadorProSons', JSON.stringify(config.sonsAtivos));
        localStorage.setItem('gerenciadorProZenMode', JSON.stringify(config.zenMode));

        // Atualiza UI
        ui.atualizarTudo();
        ui.showNotification('Preferências aplicadas!', 'success');

        // Fecha modal após um breve delay
        setTimeout(() => this.closeActiveModal(), 1000);
    }

    /**
     * Ajusta slider de recuperação
     */
    adjustRecoverySlider(delta) {
        const slider = document.getElementById('sidebar-divisor-recuperacao');
        if (slider) {
            const currentValue = parseInt(slider.value);
            const newValue = Math.max(10, Math.min(90, currentValue + delta));
            slider.value = newValue;
            config.divisorRecuperacao = newValue;
            this.updateRecoveryDisplay(newValue);
        }
    }

    /**
     * Atualiza display de recuperação
     */
    updateRecoveryDisplay(value) {
        const display = document.getElementById('sidebar-recovery-value');
        if (display) {
            display.innerHTML = `<span>${value}%</span> / <span>${100 - value}%</span>`;
        }
    }
}

// Exporta instância única
export const sidebarManager = new SidebarManager();

// Expõe globalmente para permitir chamadas inline
window.sidebarManager = sidebarManager;
