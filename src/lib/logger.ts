import winston from 'winston';

// ============================================================
// Log levels
// ============================================================
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// ============================================================
// Formats
// ============================================================

// JSON format for production — parseable by log aggregators
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Pretty format for development — human readable + colorized
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

const isDev = process.env.NODE_ENV !== 'production';

// ============================================================
// Logger instance
// ============================================================
const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  levels,
  format: isDev ? devFormat : jsonFormat,
  transports: [
    new winston.transports.Console(),
  ],
  // Don't crash on unhandled exceptions in the logger itself
  exitOnError: false,
});

export default logger;

// ============================================================
// Typed log helpers
// ============================================================

export interface LogContext {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  status?: number;
  durationMs?: number;
  error?: string;
  stack?: string;
  [key: string]: unknown;
}

export const log = {
  info: (message: string, ctx: LogContext = {}) =>
    logger.info(message, ctx),

  warn: (message: string, ctx: LogContext = {}) =>
    logger.warn(message, ctx),

  error: (message: string, ctx: LogContext = {}) =>
    logger.error(message, ctx),

  debug: (message: string, ctx: LogContext = {}) =>
    logger.debug(message, ctx),

  http: (message: string, ctx: LogContext = {}) =>
    logger.http(message, ctx),
};
