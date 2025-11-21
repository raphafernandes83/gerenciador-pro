/**
 * Helper para manipulação segura do DOM
 */
export class DOMHelper {
    static setText(selector, text) {
        const el = document.querySelector(selector);
        if (el) el.textContent = text;
    }

    static applyColor(selector, color) {
        const el = document.querySelector(selector);
        if (el) el.style.color = color;
    }
}
