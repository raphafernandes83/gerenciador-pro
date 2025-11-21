/**
 * @fileoverview Plugin de Monitoramento de Performance
 * @description Monitora e otimiza performance dos gráficos em tempo real
 * @version 1.0.0
 */

import { IChartPlugin } from '../UnifiedChartSystem.js';

export class PerformanceMonitorPlugin extends IChartPlugin {
    constructor() {
        super();
        this.metrics = new Map();
        this.performanceObserver = null;
        this.frameCounter = 0;
        this.lastFrameTime = 0;
    }
    
    initialize(chartSystem) {
        this.chartSystem = chartSystem;
        this._initializePerformanceMonitoring();
        console.log('📊 Plugin de Performance inicializado');
    }
    
    _initializePerformanceMonitoring() {
        // Monitora FPS durante animações
        this._startFPSMonitoring();
        
        // Monitora tempo de renderização
        this._startRenderTimeMonitoring();
        
        // Monitora uso de memória
        this._startMemoryMonitoring();
    }
    
    _startFPSMonitoring() {
        const measureFPS = () => {
            const now = performance.now();
            this.frameCounter++;
            
            if (now - this.lastFrameTime >= 1000) {
                const fps = Math.round((this.frameCounter * 1000) / (now - this.lastFrameTime));
                this.metrics.set('fps', fps);
                
                if (fps < 30) {
                    console.warn(`⚠️ FPS baixo detectado: ${fps}fps`);
                    this._optimizePerformance();
                }
                
                this.frameCounter = 0;
                this.lastFrameTime = now;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
    
    _startRenderTimeMonitoring() {
        // Override do método de renderização para medir tempo
        const originalCreateChart = this.chartSystem.createChart.bind(this.chartSystem);
        
        this.chartSystem.createChart = (canvasId, data, options = {}) => {
            const startTime = performance.now();
            
            const result = originalCreateChart(canvasId, data, options);
            
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            
            this.metrics.set(`render_time_${canvasId}`, renderTime);
            
            if (renderTime > 100) {
                console.warn(`⚠️ Renderização lenta detectada para ${canvasId}: ${renderTime.toFixed(2)}ms`);
            }
            
            return result;
        };
    }
    
    _startMemoryMonitoring() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                this.metrics.set('memory_used', memory.usedJSHeapSize);
                this.metrics.set('memory_total', memory.totalJSHeapSize);
                
                const usagePercent = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
                
                if (usagePercent > 80) {
                    console.warn(`⚠️ Alto uso de memória: ${usagePercent.toFixed(1)}%`);
                    this._cleanupMemory();
                }
            }, 5000);
        }
    }
    
    _optimizePerformance() {
        // Reduz qualidade de animação se FPS estiver baixo
        const activeCharts = this.chartSystem.listActiveCharts();
        
        activeCharts.forEach(canvasId => {
            const info = this.chartSystem.getChartInfo(canvasId);
            if (info && info.chart && info.chart.options) {
                info.chart.options.animation.duration = 200; // Reduz duração
                info.chart.update('none');
            }
        });
        
        console.log('🚀 Performance otimizada automaticamente');
    }
    
    _cleanupMemory() {
        // Limpa cache antigo
        const now = Date.now();
        for (const [key, value] of this.chartSystem.cache) {
            if (now - value.timestamp > 10000) { // 10 segundos
                this.chartSystem.cache.delete(key);
            }
        }
        
        // Força garbage collection se disponível
        if (window.gc) {
            window.gc();
        }
        
        console.log('🧹 Limpeza de memória executada');
    }
    
    beforeRender(canvas, data, options) {
        // Otimiza opções baseado na performance atual
        const fps = this.metrics.get('fps') || 60;
        
        if (fps < 30) {
            options.animation = {
                ...options.animation,
                duration: 100,
                easing: 'linear'
            };
        }
        
        return { canvas, data, options };
    }
    
    afterRender(chartInstance, data) {
        // Registra métricas pós-renderização
        const canvasId = chartInstance.canvas.id;
        this.metrics.set(`last_render_${canvasId}`, Date.now());
        
        return chartInstance;
    }
    
    getMetrics() {
        return Object.fromEntries(this.metrics);
    }
    
    destroy() {
        this.metrics.clear();
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
    }
}
