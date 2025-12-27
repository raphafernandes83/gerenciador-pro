/**
 * Template HTML do Painel Informativo com Relógio Preciso
 * Usa setTimeout recursivo com compensação de drift
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

    return `
        <div class="info-panel">
            <div class="info-datetime">
                <div class="info-date" id="info-date">${dateStr}</div>
                <div class="info-time" id="info-time">${hours}:${minutes}:${seconds}</div>
                <div class="info-weekday" id="info-weekday">${weekday}</div>
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
        // Relógio com setTimeout recursivo - Técnica mais precisa
        // Compensa drift e atualiza exatamente no início de cada segundo
        (function() {
            let lastDate = null;
            
            function updateClock() {
                const now = new Date();
                const timeEl = document.getElementById('info-time');
                const dateEl = document.getElementById('info-date');
                const weekdayEl = document.getElementById('info-weekday');
                
                // Atualiza hora sempre
                if (timeEl) {
                    const h = String(now.getHours()).padStart(2, '0');
                    const m = String(now.getMinutes()).padStart(2, '0');
                    const s = String(now.getSeconds()).padStart(2, '0');
                    timeEl.textContent = h + ':' + m + ':' + s;
                }
                
                // Atualiza data/dia apenas quando mudar
                const currentDate = now.toDateString();
                if (dateEl && lastDate !== currentDate) {
                    const opts = { day: '2-digit', month: 'long', year: 'numeric' };
                    dateEl.textContent = now.toLocaleDateString('pt-BR', opts);
                    lastDate = currentDate;
                }
                
                if (weekdayEl && lastDate !== currentDate) {
                    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
                    weekdayEl.textContent = days[now.getDay()];
                }
                
                // Calcula delay até o próximo segundo exato (compensa drift)
                const delay = 1000 - now.getMilliseconds();
                setTimeout(updateClock, delay);
            }
            
            // Inicia o relógio
            updateClock();
            console.log('✅ Relógio preciso inicializado (setTimeout recursivo)');
        })();
        </script>
    `;
}

export default generateInfoPanelHTML;
