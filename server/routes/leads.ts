import { Router } from "express";
import { verifyToken } from "../auth";
import * as storage from "../storage";
import { createLead, listLeads } from "../services/leadService";
import { createEventForUser } from "../lib/googleCalendarOAuth";
import { sendEmail } from "../lib/email";

export const leadsRouter = Router();

function getBearerToken(header?: string | null) {
  if (!header) {
    return "";
  }

  return header.toLowerCase().startsWith("bearer ") ? header.slice(7) : "";
}

async function resolveWorkspaceUser(req: any) {
  const token = getBearerToken(req.headers.authorization || "");
  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token) as { userId?: string };
    if (!payload.userId) {
      return null;
    }

    return storage.getWorkspaceUserById(payload.userId);
  } catch {
    return null;
  }
}

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

leadsRouter.patch("/:id/workflow", async (req, res) => {
  try {
    const user = await resolveWorkspaceUser(req);
    if (!user) {
      res.status(401).json({ error: "Sessao invalida ou expirada" });
      return;
    }

    const updated = await storage.updateLeadWorkflow(
      String(req.params.id),
      req.body || {},
      {
        userId: user.id,
        userName: user.name,
        role: user.role,
        officeName: user.officeName,
        teamName: user.teamName,
        preferredLanguage: user.preferredLanguage,
        planId: user.planId,
      }
    );

    if (!updated) {
      res.status(404).json({ error: "Lead nao encontrado" });
      return;
    }

    if (updated.followUpAt) {
      const calendarToken = await storage.getWorkspaceUserGoogleAccessToken(user.id);
      if (calendarToken) {
        try {
          const startTime = new Date(updated.followUpAt);
          const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

          await createEventForUser(user.id, {
            title: `Seguimento: ${updated.name}`,
            description: [
              `Lead: ${updated.name}`,
              `Estado: ${updated.pipelineStage}`,
              `Próxima ação: ${updated.nextStep}`,
              `Contacto: ${updated.contact || "Sem contacto"}`,
            ].join("\n"),
            startTime,
            endTime,
            attendees: [user.email],
          });
        } catch (calendarError) {
          console.error("Google Calendar scheduling failed:", calendarError);
        }
      }

      try {
        await sendEmail({
          to: user.email,
          subject: `Seguimento agendado: ${updated.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #132237;">
              <h2 style="margin: 0 0 12px;">Seguimento agendado com sucesso</h2>
              <p>Olá ${user.name},</p>
              <p>O seguimento do lead <strong>${updated.name}</strong> foi guardado no sistema.</p>
              <ul>
                <li><strong>Data:</strong> ${new Date(updated.followUpAt).toLocaleString("pt-PT")}</li>
                <li><strong>Próxima ação:</strong> ${updated.nextStep}</li>
                <li><strong>Estado:</strong> ${updated.pipelineStage}</li>
              </ul>
              <p>Se a agenda Google estiver ligada, o evento também foi criado automaticamente.</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Automatic follow-up email failed:", emailError);
      }
    }

    res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("required") ? 400 : 500;
    res.status(status).json({ error: message });
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
