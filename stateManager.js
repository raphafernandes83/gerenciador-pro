import { config, state } from './state.js';
import { logic } from './logic.js';
import { ui } from './ui.js';

export const stateManager = {
    updateState(newState) {
        let needsRecalculation = false;
        const planDependencies = [
            'capitalInicial',
            'percentualEntrada',
            'stopWinPerc',
            'stopLossPerc',
            'payout',
            'estrategiaAtiva',
            'divisorRecuperacao',
        ];

        Object.keys(newState).forEach((key) => {
            const value = newState[key];
            if (key in config) {
                config[key] = value;
            } else if (key in state) {
                state[key] = value;
            }

            const storageKey = `gerenciadorPro${key.charAt(0).toUpperCase() + key.slice(1)}`;
            localStorage.setItem(storageKey, JSON.stringify(value));

            if (planDependencies.includes(key)) {
                needsRecalculation = true;
            }
        });

        if (needsRecalculation) {
            logic.updateCalculatedValues();
            logic.calcularPlano(true);
        }

        if (state.isSessionActive) {
            logic.saveActiveSession();
        }

        ui.syncUIFromState();
        ui.atualizarDashboardSessao();
        ui.atualizarStatusIndicadores();
        ui.atualizarVisibilidadeBotoesSessao();
        ui.atualizarVisibilidadeContextual();
    },
};
