/**
 * 🎨 LAYOUTS ALTERNATIVOS PARA O CENTRO DO GRÁFICO
 * 
 * Diferentes opções de design para exibir acertos e erros
 * de forma mais apresentável e profissional
 */

console.log('🎨 LAYOUTS ALTERNATIVOS PARA CENTRO DO GRÁFICO');

/**
 * 🎨 Layout 1: Compacto com ícones
 */
function layoutCompactoIcones() {
    console.log('🎨 Aplicando Layout 1: Compacto com ícones');
    
    const canvas = document.querySelector('#progress-pie-chart');
    const chart = canvas?.chart;
    
    if (!chart) return;
    
    // Remove plugin anterior
    try { Chart.unregister('centerText'); } catch (e) {}
    
    const layoutPlugin = {
        id: 'centerText',
        afterDraw(chart) {
            const { ctx, chartArea } = chart;
            if (!chartArea) return;
            
            const stats = chart.$currentStats || { wins: 0, losses: 0 };
            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.top + chartArea.bottom) / 2;
            
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (stats.wins + stats.losses > 0) {
                // Fundo sutil arredondado
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.beginPath();
                ctx.roundRect(centerX - 32, centerY - 16, 64, 32, 8);
                ctx.fill();
                
                // ✓ Acertos
                ctx.fillStyle = '#00e676';
                ctx.font = 'bold 13px Inter, Arial';
                ctx.fillText(`✓ ${stats.wins}`, centerX, centerY - 7);
                
                // ✗ Erros
                ctx.fillStyle = '#ff3d00';
                ctx.font = 'bold 13px Inter, Arial';
                ctx.fillText(`✗ ${stats.losses}`, centerX, centerY + 7);
            } else {
                // Estado vazio
                ctx.fillStyle = '#6b7280';
                ctx.font = '20px Inter, Arial';
                ctx.fillText('📈', centerX, centerY);
            }
            
            ctx.restore();
        }
    };
    
    Chart.register(layoutPlugin);
    chart.update('none');
}

/**
 * 🎨 Layout 2: Estilo Badge
 */
function layoutBadge() {
    console.log('🎨 Aplicando Layout 2: Estilo Badge');
    
    const canvas = document.querySelector('#progress-pie-chart');
    const chart = canvas?.chart;
    
    if (!chart) return;
    
    try { Chart.unregister('centerText'); } catch (e) {}
    
    const badgePlugin = {
        id: 'centerText',
        afterDraw(chart) {
            const { ctx, chartArea } = chart;
            if (!chartArea) return;
            
            const stats = chart.$currentStats || { wins: 0, losses: 0 };
            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.top + chartArea.bottom) / 2;
            
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (stats.wins + stats.losses > 0) {
                // Badge superior (Acertos)
                ctx.fillStyle = '#00e676';
                ctx.beginPath();
                ctx.roundRect(centerX - 25, centerY - 20, 50, 16, 8);
                ctx.fill();
                
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 11px Inter, Arial';
                ctx.fillText(`${stats.wins} Acertos`, centerX, centerY - 12);
                
                // Badge inferior (Erros)
                ctx.fillStyle = '#ff3d00';
                ctx.beginPath();
                ctx.roundRect(centerX - 25, centerY + 4, 50, 16, 8);
                ctx.fill();
                
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 11px Inter, Arial';
                ctx.fillText(`${stats.losses} Erros`, centerX, centerY + 12);
            } else {
                ctx.fillStyle = '#6b7280';
                ctx.font = '18px Inter, Arial';
                ctx.fillText('⚡', centerX, centerY);
            }
            
            ctx.restore();
        }
    };
    
    Chart.register(badgePlugin);
    chart.update('none');
}

/**
 * 🎨 Layout 3: Minimalista
 */
function layoutMinimalista() {
    console.log('🎨 Aplicando Layout 3: Minimalista');
    
    const canvas = document.querySelector('#progress-pie-chart');
    const chart = canvas?.chart;
    
    if (!chart) return;
    
    try { Chart.unregister('centerText'); } catch (e) {}
    
    const minimalistaPlugin = {
        id: 'centerText',
        afterDraw(chart) {
            const { ctx, chartArea } = chart;
            if (!chartArea) return;
            
            const stats = chart.$currentStats || { wins: 0, losses: 0 };
            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.top + chartArea.bottom) / 2;
            
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (stats.wins + stats.losses > 0) {
                // Formato: "5:3" (wins:losses)
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 24px Inter, Arial';
                ctx.fillText(`${stats.wins}:${stats.losses}`, centerX, centerY - 5);
                
                // Label pequeno
                ctx.fillStyle = '#9aa0a6';
                ctx.font = '10px Inter, Arial';
                ctx.fillText('W : L', centerX, centerY + 15);
            } else {
                ctx.fillStyle = '#6b7280';
                ctx.font = '16px Inter, Arial';
                ctx.fillText('0:0', centerX, centerY);
            }
            
            ctx.restore();
        }
    };
    
    Chart.register(minimalistaPlugin);
    chart.update('none');
}

/**
 * 🎨 Layout 4: Estilo Dashboard
 */
function layoutDashboard() {
    console.log('🎨 Aplicando Layout 4: Estilo Dashboard');
    
    const canvas = document.querySelector('#progress-pie-chart');
    const chart = canvas?.chart;
    
    if (!chart) return;
    
    try { Chart.unregister('centerText'); } catch (e) {}
    
    const dashboardPlugin = {
        id: 'centerText',
        afterDraw(chart) {
            const { ctx, chartArea } = chart;
            if (!chartArea) return;
            
            const stats = chart.$currentStats || { wins: 0, losses: 0 };
            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.top + chartArea.bottom) / 2;
            
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (stats.wins + stats.losses > 0) {
                // Container com borda
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(centerX - 30, centerY - 20, 60, 40, 6);
                ctx.stroke();
                
                // Números grandes
                ctx.fillStyle = '#00e676';
                ctx.font = 'bold 18px Inter, Arial';
                ctx.fillText(stats.wins, centerX - 12, centerY - 5);
                
                ctx.fillStyle = '#ff3d00';
                ctx.font = 'bold 18px Inter, Arial';
                ctx.fillText(stats.losses, centerX + 12, centerY - 5);
                
                // Separador
                ctx.fillStyle = '#6b7280';
                ctx.font = 'bold 14px Inter, Arial';
                ctx.fillText('|', centerX, centerY - 5);
                
                // Labels
                ctx.fillStyle = '#9aa0a6';
                ctx.font = '9px Inter, Arial';
                ctx.fillText('W    L', centerX, centerY + 12);
            } else {
                ctx.fillStyle = '#6b7280';
                ctx.font = '20px Inter, Arial';
                ctx.fillText('📈', centerX, centerY);
            }
            
            ctx.restore();
        }
    };
    
    Chart.register(dashboardPlugin);
    chart.update('none');
}

/**
 * 🎨 Layout 5: Circular (Recomendado)
 */
function layoutCircular() {
    console.log('🎨 Aplicando Layout 5: Circular (Recomendado)');
    
    const canvas = document.querySelector('#progress-pie-chart');
    const chart = canvas?.chart;
    
    if (!chart) return;
    
    try { Chart.unregister('centerText'); } catch (e) {}
    
    const circularPlugin = {
        id: 'centerText',
        afterDraw(chart) {
            const { ctx, chartArea } = chart;
            if (!chartArea) return;
            
            const stats = chart.$currentStats || { wins: 0, losses: 0 };
            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.top + chartArea.bottom) / 2;
            
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (stats.wins + stats.losses > 0) {
                // Círculo de fundo
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.beginPath();
                ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
                ctx.fill();
                
                // Borda sutil
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Total no centro
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 20px Inter, Arial';
                ctx.fillText(stats.wins + stats.losses, centerX, centerY - 2);
                
                // Pequenos indicadores
                ctx.fillStyle = '#00e676';
                ctx.font = 'bold 10px Inter, Arial';
                ctx.fillText(`+${stats.wins}`, centerX - 15, centerY + 15);
                
                ctx.fillStyle = '#ff3d00';
                ctx.font = 'bold 10px Inter, Arial';
                ctx.fillText(`-${stats.losses}`, centerX + 15, centerY + 15);
            } else {
                ctx.fillStyle = '#6b7280';
                ctx.font = '24px Inter, Arial';
                ctx.fillText('⭕', centerX, centerY);
            }
            
            ctx.restore();
        }
    };
    
    Chart.register(circularPlugin);
    chart.update('none');
}

// Expor funções globalmente
window.layoutCompactoIcones = layoutCompactoIcones;
window.layoutBadge = layoutBadge;
window.layoutMinimalista = layoutMinimalista;
window.layoutDashboard = layoutDashboard;
window.layoutCircular = layoutCircular;

console.log('🎨 LAYOUTS ALTERNATIVOS CARREGADOS!');
console.log('🧪 Teste os diferentes layouts:');
console.log('  - layoutCompactoIcones() // ✓ X com fundo');
console.log('  - layoutBadge() // Badges coloridos');
console.log('  - layoutMinimalista() // Formato 5:3');
console.log('  - layoutDashboard() // Estilo dashboard');
console.log('  - layoutCircular() // Total no centro (Recomendado)');
