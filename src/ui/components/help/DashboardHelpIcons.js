/**
 * 🎯 INICIALIZADOR DE ÍCONES DE AJUDA - DASHBOARD PRINCIPAL
 * Injeta ícones (?) nos elementos principais da dashboard ao carregar
 * Fase 6: Plano de Operações (Simplificado - 8 ícones essenciais)
 * 
 * @version 1.0.0
 */

class DashboardHelpIcons {
    constructor() {
        this.iconsInjected = false;
    }

    /**
     * Cria um botão de ajuda (?)
     */
    createHelpIcon(metricId, value = 'default') {
        const button = document.createElement('button');
        button.className = 'help-icon';
        button.setAttribute('data-metric', metricId);
        button.setAttribute('data-value', value);
        button.setAttribute('aria-label', `Ajuda sobre ${metricId}`);
        button.setAttribute('title', 'Clique para mais informações');
        button.setAttribute('type', 'button');

        const span = document.createElement('span');
        span.className = 'icon';
        span.textContent = '?';

        button.appendChild(span);
        return button;
    }

    /**
     * Injeta todos os ícones da dashboard
     */
    injectAll() {
        if (this.iconsInjected) {
            console.log('✅ Ícones da Dashboard já injetados');
            return;
        }

        console.log('🚀 Injetando ícones na Dashboard...');
        let injetados = 0;

        // 1. Capital Atual
        const capitalLabel = document.getElementById('capital-atual-label');
        if (capitalLabel && !capitalLabel.querySelector('.help-icon')) {
            const icon = this.createHelpIcon('dashboard-capital-atual', 'title');
            icon.style.marginLeft = '6px';
            capitalLabel.appendChild(icon);
            injetados++;
            console.log('  ✓ Capital Atual');
        }

        // 2. Resultado do Dia
        const resultadoLabel = document.getElementById('lucro-prejuizo-label');
        if (resultadoLabel && !resultadoLabel.querySelector('.help-icon')) {
            const icon = this.createHelpIcon('dashboard-resultado-dia', 'title');
            icon.style.marginLeft = '6px';
            resultadoLabel.appendChild(icon);
            injetados++;
            console.log('  ✓ Resultado do Dia');
        }

        // 3. Progresso das Metas (título do painel)
        const progressHeader = document.querySelector('#progress-metas-panel .panel-header h2');
        if (progressHeader && !progressHeader.querySelector('.help-icon')) {
            const icon = this.createHelpIcon('dashboard-progresso-metas', 'panel');
            icon.style.marginLeft = '8px';
            progressHeader.appendChild(icon);
            injetados++;
            console.log('  ✓ Progresso Metas');
        }


        // 4. Botão Nova Sessão - REMOVIDO (tooltip em botão prejudica layout)
        /* 
        const btnNova = document.getElementById('new-session-btn');
        if (btnNova && !btnNova.querySelector('.help-icon')) {
            const icon = this.createHelpIcon('dashboard-btn-nova-sessao', 'button');
            icon.style.marginLeft = '6px';
            btnNova.appendChild(icon);
            injetados++;
            console.log('  ✓ Btn Nova Sessão');
        }
        */

        // 5. Botão Finalizar Sessão - REMOVIDO (tooltip em botão prejudica layout)
        /*
        const btnFinalizar = document.getElementById('finish-session-btn');
        if (btnFinalizar && !btnFinalizar.querySelector('.help-icon')) {
            const icon = this.createHelpIcon('dashboard-btn-finalizar', 'button');
            icon.style.marginLeft = '6px';
            btnFinalizar.appendChild(icon);
            injetados++;
            console.log('  ✓ Btn Finalizar');
        }
        */

        // 6. Botão Desfazer - REMOVIDO (tooltip em botão prejudica layout)
        /*
        const btnDesfazer = document.getElementById('undo-btn');
        if (btnDesfazer && !btnDesfazer.querySelector('.help-icon')) {
            const icon = this.createHelpIcon('dashboard-btn-desfazer', 'button');
            icon.style.marginLeft = '6px';
            btnDesfazer.appendChild(icon);
            injetados++;
            console.log('  ✓ Btn Desfazer');
        }
        */

        // 7. Timeline (Histórico Visual)
        const timelineHeader = document.querySelector('.results-panel .panel-header h2');
        if (timelineHeader && timelineHeader.textContent.includes('Histórico Visual')) {
            if (!timelineHeader.querySelector('.help-icon')) {
                const icon = this.createHelpIcon('dashboard-timeline', 'viz');
                timelineHeader.appendChild(document.createTextNode(' '));
                timelineHeader.appendChild(icon);
                injetados++;
                console.log('  ✓ Timeline');
            }
        }

        // 8. Indicadores de Status (área de status)
        const statusGrid = document.querySelector('.progress-status-grid');
        if (statusGrid && !statusGrid.querySelector('.help-icon-status')) {
            // Criar ícone especial para área de status
            const wrapper = document.createElement('div');
            wrapper.style.gridColumn = 'span 2';
            wrapper.style.textAlign = 'center';
            wrapper.style.fontSize = '0.85em';
            wrapper.style.opacity = '0.8';

            const label = document.createElement('span');
            label.textContent = 'Indicadores';
            label.style.marginRight = '4px';

            const icon = this.createHelpIcon('dashboard-status-indicators', 'status');
            icon.classList.add('help-icon-status');
            icon.style.fontSize = '0.9em';

            wrapper.appendChild(label);
            wrapper.appendChild(icon);
            statusGrid.appendChild(wrapper);
            injetados++;
            console.log('  ✓ Status Indicators');
        }

        this.iconsInjected = injetados >= 3; // Agora esperamos 3 ícones (sem botões)
        console.log(`✅ Dashboard: ${injetados} ícones injetados`);

        // Re-anexa listeners dos tooltips
        if (window.metricTooltips) {
            window.metricTooltips.attachHelpIconListeners();
            console.log('✅ Listeners anexados');
        }
    }

    /**
     * Inicialização principal
     */
    init() {
        console.log('🚀 Inicializando DashboardHelpIcons...');

        // Aguarda DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.injectAll(), 1000); // Aguarda outros scripts
            });
        } else {
            setTimeout(() => this.injectAll(), 1000);
        }
    }
}

// Inicializar quando script carregar
window.dashboardHelpIcons = new DashboardHelpIcons();
window.dashboardHelpIcons.init();

console.log('📦 DashboardHelpIcons carregado');
