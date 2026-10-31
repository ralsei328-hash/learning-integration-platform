/**
 * Learning Integration Platform - Logger Utility
 * 
 * Provides structured logging with timestamps and log levels.
 */

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

export class Logger {
    constructor(context = 'App') {
        this.context = context;
        this.level = LOG_LEVELS[process.env.LOG_LEVEL || 'INFO'];
    }

    _format(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] [${this.context}] ${message}`;
    }

    _log(level, levelNum, message, ...args) {
        if (levelNum <= this.level) {
            const formatted = this._format(level, message);
            if (args.length > 0) {
                console.log(formatted, ...args);
            } else {
                console.log(formatted);
            }
        }
    }

    error(message, ...args) {
        this._log('ERROR', LOG_LEVELS.ERROR, message, ...args);
    }

    warn(message, ...args) {
        this._log('WARN', LOG_LEVELS.WARN, message, ...args);
    }

    info(message, ...args) {
        this._log('INFO', LOG_LEVELS.INFO, message, ...args);
    }

    debug(message, ...args) {
        this._log('DEBUG', LOG_LEVELS.DEBUG, message, ...args);
    }
}
