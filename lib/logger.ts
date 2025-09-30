// Production-ready logging utility
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: Record<string, unknown> | null;
    context?: string;
}

class Logger {
    private static instance: Logger;
    private isProduction = process.env.NODE_ENV === 'production';
    private logLevel: LogLevel = this.isProduction ? 'WARN' : 'DEBUG';

    private constructor() { }

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: Record<LogLevel, number> = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3
        };
        return levels[level] >= levels[this.logLevel];
    }

    private formatLog(entry: LogEntry): string {
        const prefix = this.isProduction ? '' : `[${entry.level.toUpperCase()}]`;
        const context = entry.context ? `[${entry.context}]` : '';
        return `${prefix}${context} ${entry.message}`;
    }

    private log(level: LogLevel, message: string, data?: Record<string, unknown> | null, context?: string): void {
        if (!this.shouldLog(level)) return;

        const entry: LogEntry = {
            level,
            message,
            data,
            timestamp: new Date().toISOString(),
            context
        };

        const formattedMessage = this.formatLog(entry);

        switch (level) {
            case 'DEBUG':
            case 'INFO':
                console.log(formattedMessage, data ? data : '');
                break;
            case 'WARN':
                console.warn(formattedMessage, data ? data : '');
                break;
            case 'ERROR':
                console.error(formattedMessage, data ? data : '');
                // In production, you might want to send errors to monitoring service
                if (this.isProduction && typeof window !== 'undefined') {
                    // Example: Send to monitoring service
                    // Sentry.captureException(new Error(message), { extra: data });
                }
                break;
        }
    }

    debug(message: string, data?: Record<string, unknown> | null, context?: string): void {
        this.log('DEBUG', message, data, context);
    }

    info(message: string, data?: Record<string, unknown> | null, context?: string): void {
        this.log('INFO', message, data, context);
    }

    warn(message: string, data?: Record<string, unknown> | null, context?: string): void {
        this.log('WARN', message, data, context);
    }

    error(message: string, data?: Record<string, unknown> | null, context?: string): void {
        this.log('ERROR', message, data, context);
    }

    // Context-specific logging methods
    api(message: string, data?: Record<string, unknown> | null): void {
        this.log('INFO', message, data, 'API');
    }

    contract(message: string, data?: Record<string, unknown> | null): void {
        this.log('INFO', message, data, 'CONTRACT');
    }

    auth(message: string, data?: Record<string, unknown> | null): void {
        this.log('INFO', message, data, 'AUTH');
    }

    verification(message: string, data?: Record<string, unknown> | null): void {
        this.log('INFO', message, data, 'VERIFICATION');
    }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export types for external use
export type { LogLevel, LogEntry };