/**
 * 📊 PERFORMANCE DASHBOARD - Interface de Monitoramento
 * Painel interativo para visualizar métricas de performance em tempo real
 */

import { performanceTracker } from './PerformanceTracker.js';
import { logger } from '../utils/Logger.js';

class PerformanceDashboard {
    constructor() {
        this.isVisible = false;
        this.updateInterval = null;
        this.dashboardElement = null;
    }

    /**
     * 🚀 Cria e exibe o dashboard na interface
     */
    show() {
        if (this.isVisible) {
            this.hide();
        }

        this.createDashboardElement();
        this.startAutoUpdate();
        this.isVisible = true;

        logger.info('📊 Performance Dashboard ativado');
    }

    /**
     * 🚫 Oculta o dashboard
     */
    hide() {
        if (this.dashboardElement) {
            document.body.removeChild(this.dashboardElement);
            this.dashboardElement = null;
        }

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        this.isVisible = false;
        logger.info('📊 Performance Dashboard desativado');
    }

    /**
     * 🔄 Alterna visibilidade do dashboard
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * 🎨 Cria o elemento HTML do dashboard
     */
    createDashboardElement() {
        const dashboard = document.createElement('div');
        dashboard.id = 'performanceDashboard';
        dashboard.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            max-height: 600px;
            background: rgba(0, 0, 0, 0.9);
            color: #00e676;
            border: 2px solid #00e676;
            border-radius: 12px;
            padding: 20px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 12px;
            z-index: 10000;
            overflow-y: auto;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 230, 118, 0.3);
        `;

        // Header
        const header = document.createElement('div');
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #00e676;">🚀 Performance Monitor</h3>
                <button id="closeDashboard" style="background: #ff3d00; border: none; color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer;">✕</button>
            </div>
        `;

        // Content container
        const content = document.createElement('div');
        content.id = 'dashboardContent';

        dashboard.appendChild(header);
        dashboard.appendChild(content);
        document.body.appendChild(dashboard);

        // Event listeners
        dashboard.querySelector('#closeDashboard').addEventListener('click', () => this.hide());

        // Draggable functionality
        this.makeDraggable(dashboard);

        this.dashboardElement = dashboard;
        this.updateContent();
    }

    /**
     * 🖱️ Torna o dashboard arrastável
     */
    makeDraggable(element) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        element.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;

            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            isDragging = true;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;

            element.style.transform = `translate(${currentX}px, ${currentY}px)`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    /**
     * 🔄 Atualiza o conteúdo do dashboard
     */
    updateContent() {
        if (!this.dashboardElement) return;

        const report = performanceTracker.getPerformanceReport();
        const contentDiv = this.dashboardElement.querySelector('#dashboardContent');

        contentDiv.innerHTML = this.generateDashboardHTML(report);
    }

    /**
     * 📝 Gera HTML do dashboard
     */
    generateDashboardHTML(report) {
        const { summary, recent, byOperation, thresholds } = report;

        let html = `
            <div style="margin-bottom: 15px;">
                <div style="color: #00e676; font-weight: bold;">📊 Status Geral</div>
                <div>• Operações Ativas: <span style="color: ${summary.activeOperations > 0 ? '#ff9800' : '#4caf50'}">${summary.activeOperations}</span></div>
                <div>• Operações Concluídas: <span style="color: #4caf50">${summary.completedOperations}</span></div>
                <div>• Status: <span style="color: ${summary.trackingStatus === 'active' ? '#ff9800' : '#4caf50'}">${summary.trackingStatus}</span></div>
            </div>
        `;

        if (recent) {
            html += `
                <div style="margin-bottom: 15px;">
                    <div style="color: #00e676; font-weight: bold;">⚡ Último Minuto</div>
                    <div>• Operações: ${recent.totalOperations}</div>
                    <div>• Taxa de Sucesso: <span style="color: ${parseFloat(recent.successRate) > 90 ? '#4caf50' : '#ff9800'}">${recent.successRate}</span></div>
                    <div>• Duração Média: ${recent.duration.avg}ms</div>
                    <div>• P95: ${recent.duration.p95}ms</div>
                </div>
            `;
        }

        if (byOperation.length > 0) {
            html += `
                <div style="margin-bottom: 15px;">
                    <div style="color: #00e676; font-weight: bold;">🎯 Por Operação (5min)</div>
            `;

            byOperation.slice(0, 5).forEach((op) => {
                const avgDuration = parseFloat(op.duration.avg);
                const color =
                    avgDuration > thresholds.critical
                        ? '#ff3d00'
                        : avgDuration > thresholds.warning
                          ? '#ff9800'
                          : '#4caf50';

                html += `
                    <div style="margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.05); border-radius: 4px;">
                        <div style="font-weight: bold;">${op.operation}</div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Avg: <span style="color: ${color}">${op.duration.avg}ms</span></span>
                            <span>Ops: ${op.totalOperations}</span>
                        </div>
                    </div>
                `;
            });

            html += '</div>';
        }

        html += `
            <div style="margin-bottom: 15px;">
                <div style="color: #00e676; font-weight: bold;">⚙️ Limites</div>
                <div>• Info: <span style="color: #4caf50">&lt; ${thresholds.info}ms</span></div>
                <div>• Warning: <span style="color: #ff9800">&lt; ${thresholds.warning}ms</span></div>
                <div>• Critical: <span style="color: #ff3d00">&gt; ${thresholds.critical}ms</span></div>
            </div>
        `;

        html += `
            <div style="margin-top: 15px; text-align: center;">
                <button onclick="window.performanceDashboard.exportReport()" 
                        style="background: #00e676; border: none; color: black; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 2px;">
                    📁 Exportar
                </button>
                <button onclick="window.performanceDashboard.clearMetrics()" 
                        style="background: #ff3d00; border: none; color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 2px;">
                    🧹 Limpar
                </button>
            </div>
        `;

        return html;
    }

    /**
     * ⏰ Inicia atualização automática
     */
    startAutoUpdate() {
        this.updateInterval = setInterval(() => {
            this.updateContent();
        }, 2000); // Atualiza a cada 2 segundos
    }

    /**
     * 📁 Exporta relatório de performance
     */
    exportReport() {
        const report = performanceTracker.getPerformanceReport();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `performance-report-${timestamp}.json`;

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
        logger.info('📁 Relatório de performance exportado', { filename });
    }

    /**
     * 🧹 Limpa métricas armazenadas
     */
    clearMetrics() {
        if (confirm('Limpar todas as métricas de performance?')) {
            performanceTracker.completedMetrics.length = 0;
            this.updateContent();
            logger.info('🧹 Métricas de performance limpas');
        }
    }

    /**
     * 📊 Exibe relatório no console
     */
    logReport() {
        const report = performanceTracker.getPerformanceReport();

        console.group('🚀 RELATÓRIO DE PERFORMANCE');
        console.log('📊 Resumo:', report.summary);

        if (report.recent) {
            console.log('⚡ Último minuto:', report.recent);
        }

        if (report.byOperation.length > 0) {
            console.log('🎯 Por operação:');
            report.byOperation.forEach((op) => {
                console.log(
                    `  • ${op.operation}: ${op.duration.avg}ms avg (${op.totalOperations} ops)`
                );
            });
        }

        console.groupEnd();
        return report;
    }
}

// Instância singleton
export const performanceDashboard = new PerformanceDashboard();

// Disponibiliza globalmente
if (typeof window !== 'undefined') {
    window.performanceDashboard = performanceDashboard;
    window.showPerformanceDashboard = () => performanceDashboard.show();
    window.hidePerformanceDashboard = () => performanceDashboard.hide();
    window.togglePerformanceDashboard = () => performanceDashboard.toggle();
    window.logPerformanceReport = () => performanceDashboard.logReport();
}

console.log(
    '📊 Performance Dashboard carregado! Use: togglePerformanceDashboard() ou logPerformanceReport()'
);
