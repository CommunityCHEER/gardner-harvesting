/**
 * Production-safe logger for Expo apps.
 * Always logs (not suppressed in production).
 * Use for Info, Warnings, and Errors.
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

function formatLog(level: LogLevel, tag: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] [${tag}] ${message}${dataStr}`;
}

export const logger = {
    info: (tag: string, message: string, data?: any) => {
        const log = formatLog('INFO', tag, message, data);
        console.log(log);
    },

    warn: (tag: string, message: string, data?: any) => {
        const log = formatLog('WARN', tag, message, data);
        console.warn(log);
    },

    error: (tag: string, message: string, data?: any) => {
        const log = formatLog('ERROR', tag, message, data);
        console.error(log);
    },
};
