import { Router } from "express";
import { verifyToken } from "../auth";
import * as storage from "../storage";
import { createLead, listLeads } from "../services/leadService";

export const leadsRouter = Router();

leadsRouter.get("/", async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const leads = await listLeads(
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined
    );
    res.json({ data: leads });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

leadsRouter.post("/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      res.status(401).json({ error: "Sessao invalida ou expirada" });
      return;
    }

    const payload = verifyToken(token) as { userId?: string };
    if (!payload.userId) {
      res.status(401).json({ error: "Sessao invalida ou expirada" });
      return;
    }

    const user = await storage.getWorkspaceUserById(payload.userId);
    if (!user) {
      res.status(401).json({ error: "Sessao invalida ou expirada" });
      return;
    }

    const lead = await createLead(req.body ?? {});
    res.status(201).json({ data: lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("required") ? 400 : 500;
    res.status(status).json({ error: message });
  }
});
