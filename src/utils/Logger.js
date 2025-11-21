// ================================================================
// Logger.js - Logger central com níveis, requestId e ambiente seguro
// ================================================================

import { isDevelopment } from '../config/EnvProvider.js';

const SENSITIVE_KEYS = ['authorization', 'token', 'jwt', 'password', 'anonkey', 'apikey', 'key'];

function redactSensitive(meta) {
    try {
        if (!meta || typeof meta !== 'object') return meta;
        const clone = JSON.parse(JSON.stringify(meta));
        for (const k of Object.keys(clone)) {
            if (SENSITIVE_KEYS.includes(k.toLowerCase())) {
                clone[k] = '***redacted***';
            }
        }
        return clone;
    } catch (_) {
        return meta;
    }
}

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

class Logger {
    constructor() {
        this.level = isDevelopment() ? 'debug' : 'info';
    }

    setLevel(level) {
        if (LEVELS[level]) this.level = level;
    }

    getLevel() {
        return this.level;
    }

    withRequest(requestId) {
        const base = this;
        return {
            debug(msg, meta) {
                base.debug(msg, { ...(meta || {}), requestId });
            },
            info(msg, meta) {
                base.info(msg, { ...(meta || {}), requestId });
            },
            warn(msg, meta) {
                base.warn(msg, { ...(meta || {}), requestId });
            },
            error(msg, meta) {
                base.error(msg, { ...(meta || {}), requestId });
            },
        };
    }

    debug(message, meta = undefined) {
        this._log('debug', message, meta);
    }
    info(message, meta = undefined) {
        this._log('info', message, meta);
    }
    warn(message, meta = undefined) {
        this._log('warn', message, meta);
    }
    error(message, meta = undefined) {
        this._log('error', message, meta);
    }

    _log(level, message, meta) {
        if (LEVELS[level] < LEVELS[this.level]) return;
        const payload = meta ? redactSensitive(meta) : undefined;
        // Em produção, limita debug detalhado
        try {
            const now = new Date().toISOString();
            switch (level) {
                case 'debug':
                    console.debug(`[${now}] DEBUG`, message, payload !== undefined ? payload : '');
                    break;
                case 'info':
                    console.info(`[${now}] INFO`, message, payload !== undefined ? payload : '');
                    break;
                case 'warn':
                    console.warn(`[${now}] WARN`, message, payload !== undefined ? payload : '');
                    break;
                case 'error':
                    console.error(`[${now}] ERROR`, message, payload !== undefined ? payload : '');
                    break;
                default:
                    console.log(`[${now}] LOG`, message, payload !== undefined ? payload : '');
            }
        } catch (_) {
            // Evita quebrar a app por falha no logger
        }
    }
}

export const logger = new Logger();
