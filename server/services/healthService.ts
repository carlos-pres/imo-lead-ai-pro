import { testConnection } from "../db";

export type HealthStatus = {
  status: "ok" | "degraded";
  timestamp: string;
  checks: {
    database: "up" | "down";
  };
  details?: {
    database?: string;
  };
};

export async function getHealthStatus(): Promise<HealthStatus> {
  const dbStatus = await testConnection();

  const response: HealthStatus = {
    status: dbStatus.ok ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks: {
      database: dbStatus.ok ? "up" : "down",
    },
  };

  if (dbStatus.error) {
    response.details = { database: dbStatus.error };
  }

  return response;
}
