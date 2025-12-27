/**
 * Painel Informativo - Data/Hora/Mensagens
 * Atualiza hora em tempo real e exibe mensagens motivacionais
 */

class InfoPanel {
    constructor() {
        this.timeElement = null;
        this.dateElement = null;
        this.weekdayElement = null;
        this.updateInterval = null;
    }

    init() {
        this.timeElement = document.getElementById('info-time');
        this.dateElement = document.getElementById('info-date');
        this.weekdayElement = document.getElementById('info-weekday');

        if (this.timeElement) {
            this.updateDateTime();
            // Atualiza a cada segundo
            this.updateInterval = setInterval(() => this.updateDateTime(), 1000);
        }
    }

    updateDateTime() {
        const now = new Date();

        // Atualiza hora
        if (this.timeElement) {
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            this.timeElement.textContent = `${hours}:${minutes}:${seconds}`;
        }

        // Atualiza data (só quando mudar de dia)
        if (this.dateElement && (!this.lastDate || this.lastDate !== now.toDateString())) {
            const options = { day: '2-digit', month: 'long', year: 'numeric' };
            this.dateElement.textContent = now.toLocaleDateString('pt-BR', options);
            this.lastDate = now.toDateString();
        }

        // Atualiza dia da semana
        if (this.weekdayElement && (!this.lastDate || this.lastDate !== now.toDateString())) {
            const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
            this.weekdayElement.textContent = weekdays[now.getDay()];
        }
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Inicializa quando DOM estiver pronto
if (typeof window !== 'undefined') {
    window.InfoPanel = InfoPanel;

    // REMOVIDO: Inicialização automática causa race condition
    // A inicialização agora é feita em add-info-panel.js após injetar o HTML
    /*
    document.addEventListener('DOMContentLoaded', () => {
        window.infoPanel = new InfoPanel();
        window.infoPanel.init();
        console.log('✅ InfoPanel inicializado');
    });
    */
}