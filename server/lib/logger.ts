import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export function logSecurityEvent(type: string, details: Record<string, unknown>): void {
  logger.warn({
    type,
    timestamp: new Date().toISOString(),
    ...details
  });
}

export function logInfo(message: string, details?: Record<string, unknown>): void {
  logger.info({
    message,
    timestamp: new Date().toISOString(),
    ...details
  });
}

export function logError(message: string, error?: Error | unknown): void {
  logger.error({
    message,
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
}

export default logger;
