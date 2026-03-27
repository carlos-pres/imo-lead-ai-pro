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

// Agent-specific tracking
interface AgentMetrics {
  apiCallsCount: number;
  successCount: number;
  errorCount: number;
  totalCostUSD: number;
  avgResponseTimeMs: number;
  lastError?: string;
}

const agentMetrics: Record<string, AgentMetrics> = {};

export function logAgentAction(
  component: string,
  action: string,
  context?: Record<string, any>,
  cost?: number,
  durationMs?: number
): void {
  if (!agentMetrics[component]) {
    agentMetrics[component] = {
      apiCallsCount: 0,
      successCount: 0,
      errorCount: 0,
      totalCostUSD: 0,
      avgResponseTimeMs: 0,
    };
  }

  const metrics = agentMetrics[component];
  metrics.apiCallsCount++;
  metrics.successCount++;
  metrics.totalCostUSD += cost || 0;
  if (durationMs) {
    metrics.avgResponseTimeMs =
      (metrics.avgResponseTimeMs * (metrics.apiCallsCount - 1) + durationMs) /
      metrics.apiCallsCount;
  }

  logger.info({
    type: 'AGENT_ACTION',
    component,
    action,
    cost,
    durationMs,
    context,
    timestamp: new Date().toISOString(),
  });
}

export function logAgentError(
  component: string,
  action: string,
  error: Error | string,
  context?: Record<string, any>
): void {
  if (!agentMetrics[component]) {
    agentMetrics[component] = {
      apiCallsCount: 0,
      successCount: 0,
      errorCount: 0,
      totalCostUSD: 0,
      avgResponseTimeMs: 0,
    };
  }

  const errorMsg = error instanceof Error ? error.message : String(error);
  const metrics = agentMetrics[component];
  metrics.errorCount++;
  metrics.lastError = errorMsg;

  logger.error({
    type: 'AGENT_ERROR',
    component,
    action,
    error: errorMsg,
    context,
    timestamp: new Date().toISOString(),
  });
}

export function getAgentMetrics(component?: string): Record<string, AgentMetrics> {
  if (component) {
    return agentMetrics[component] ? { [component]: agentMetrics[component] } : {};
  }
  return agentMetrics;
}

export default logger;
