import { Router } from "express";
import { getHealthStatus } from "../services/healthService";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  const health = await getHealthStatus();
  const statusCode = health.status === "ok" ? 200 : 503;
  res.status(statusCode).json(health);
});
