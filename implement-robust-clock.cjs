const fs = require('fs');

console.log('🕐 Implementando relógio robusto...');

try {
    // Lê o template
    let template = fs.readFileSync('src/ui/templates/InfoPanelTemplate.js', 'utf8');

    // Substitui o template para incluir script inline
    const newTemplate = `/**
 * Template HTML do Painel Informativo com Relógio Inline
 * Relógio atualiza automaticamente sem dependências externas
 */

export function generateInfoPanelHTML() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString('pt-BR', options);
    
    const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const weekday = weekdays[now.getDay()];

    return \`
        <div class="info-panel">
            <div class="info-datetime">
                <div class="info-date" id="info-date">\${dateStr}</div>
                <div class="info-time" id="info-time">\${hours}:\${minutes}:\${seconds}</div>
                <div class="info-weekday" id="info-weekday">\${weekday}</div>
            </div>
            <div class="info-messages">
                <div class="info-message">
                    "Disciplina é o caminho para a consistência"
                </div>
                <div class="info-message">
                    "Gerenciamento é 80% do sucesso"
                </div>
            </div>
        </div>
        
        <script>
        // Relógio inline - atualiza automaticamente
        (function() {
            function updateClock() {
                const now = new Date();
                const timeEl = document.getElementById('info-time');
                const dateEl = document.getElementById('info-date');
                const weekdayEl = document.getElementById('info-weekday');
                
                if (timeEl) {
                    const h = String(now.getHours()).padStart(2, '0');
                    const m = String(now.getMinutes()).padStart(2, '0');
                    const s = String(now.getSeconds()).padStart(2, '0');
                    timeEl.textContent = h + ':' + m + ':' + s;
                }
                
                // Atualiza data/dia apenas quando mudar
                if (dateEl && !window.lastInfoDate) {
                    const opts = { day: '2-digit', month: 'long', year: 'numeric' };
                    dateEl.textContent = now.toLocaleDateString('pt-BR', opts);
                    window.lastInfoDate = now.toDateString();
                }
                
                if (weekdayEl && !window.lastInfoDate) {
                    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
                    weekdayEl.textContent = days[now.getDay()];
                }
            }
            
            // Atualiza imediatamente
            updateClock();
            
            // Atualiza a cada segundo
            setInterval(updateClock, 1000);
            
            console.log('✅ Relógio inline inicializado');
        })();
        </script>
    \`;
}

export default generateInfoPanelHTML;
`;

    fs.writeFileSync('src/ui/templates/InfoPanelTemplate.js', newTemplate, 'utf8');
    console.log('✅ Template atualizado com relógio inline');

    console.log('\n✅ Relógio robusto implementado! Recarregue a página.');

} catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
}
