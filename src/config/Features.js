// src/config/Features.js — Feature flags para rollout seguro

export const Features = {
    FEATURE_store_pubsub: false,
    FEATURE_goals_v2: false,
    FEATURE_progress_cards_v2: false,
    FEATURE_light_monitor: false,
};

// Exposição global com kill switch
if (typeof window !== 'undefined') {
    try {
        if (!window.Features) window.Features = { ...Features };
        if (typeof window.FEATURE_FORCE_ROLLBACK === 'boolean' && window.FEATURE_FORCE_ROLLBACK) {
            window.Features.FEATURE_store_pubsub = false;
            window.Features.FEATURE_goals_v2 = false;
            window.Features.FEATURE_progress_cards_v2 = false;
            window.Features.FEATURE_light_monitor = false;
        }
    } catch (_) {}
}

export default Features;
