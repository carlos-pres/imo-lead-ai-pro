import { Router } from "express";
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
    const lead = await createLead(req.body ?? {});
    res.status(201).json({ data: lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("required") ? 400 : 500;
    res.status(status).json({ error: message });
  }
});
