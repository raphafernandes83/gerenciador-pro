/**
 * 🍪 Cookie Consent Manager - LGPD Compliant
 * 
 * Banner de consentimento de cookies para conformidade com LGPD (Lei Geral de Proteção de Dados)
 * Exibe aviso ao usuário na primeira visita e salva preferência
 */

class CookieConsent {
    constructor() {
        this.STORAGE_KEY = 'gerenciadorPro_cookieConsent';
        this.consentGiven = this.checkConsent();

        if (!this.consentGiven) {
            this.showBanner();
        }
    }

    checkConsent() {
        return localStorage.getItem(this.STORAGE_KEY) === 'true';
    }

    showBanner() {
        // Criar banner
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-consent-content">
                <p>
                    🍪 Este app usa cookies e Google Analytics para melhorar sua experiência e analisar o uso. 
                    Ao continuar, você concorda com nossa política de privacidade.
                </p>
                <div class="cookie-consent-buttons">
                    <button id="cookie-accept" class="cookie-btn cookie-accept">✅ Aceitar</button>
                    <button id="cookie-decline" class="cookie-btn cookie-decline">❌ Recusar</button>
                </div>
            </div>
        `;

        // Adicionar estilos inline
        const style = document.createElement('style');
        style.textContent = `
            #cookie-consent-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
                z-index: 99999;
                animation: slideUp 0.4s ease-out;
            }

            @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
            }

            .cookie-consent-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                flex-wrap: wrap;
            }

            .cookie-consent-content p {
                margin: 0;
                font-size: 14px;
                line-height: 1.6;
                flex: 1;
                min-width: 300px;
            }

            .cookie-consent-buttons {
                display: flex;
                gap: 10px;
            }

            .cookie-btn {
                padding: 10px 24px;
                border: none;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 14px;
            }

            .cookie-accept {
                background: #10b981;
                color: white;
            }

            .cookie-accept:hover {
                background: #059669;
                transform: scale(1.05);
            }

            .cookie-decline {
                background: rgba(255,255,255,0.2);
                color: white;
                border: 2px solid white;
            }

            .cookie-decline:hover {
                background: rgba(255,255,255,0.3);
            }

            @media (max-width: 768px) {
                .cookie-consent-content {
                    flex-direction: column;
                    text-align: center;
                }
                
                .cookie-consent-buttons {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(banner);

        // Event listeners
        document.getElementById('cookie-accept').addEventListener('click', () => this.accept());
        document.getElementById('cookie-decline').addEventListener('click', () => this.decline());
    }

    accept() {
        localStorage.setItem(this.STORAGE_KEY, 'true');
        this.consentGiven = true;
        this.removeBanner();

        // Inicializar Google Analytics se consentimento dado
        if (window.initGoogleAnalytics) {
            window.initGoogleAnalytics();
        }

        console.log('✅ Consentimento de cookies aceito');
    }

    decline() {
        localStorage.setItem(this.STORAGE_KEY, 'false');
        this.consentGiven = false;
        this.removeBanner();

        console.log('❌ Consentimento de cookies recusado - Analytics desabilitado');
    }

    removeBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.style.animation = 'slideUp 0.3s ease-out reverse';
            setTimeout(() => banner.remove(), 300);
        }
    }

    hasConsent() {
        return this.consentGiven;
    }
}

// Inicializar ao carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.cookieConsent = new CookieConsent();
    });
} else {
    window.cookieConsent = new CookieConsent();
}
