import type { Request, Response, Express } from "express";
import crypto from "crypto";

// Helper: cria token de admin
const createAdminToken = (): string => {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD must be configured");

  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`admin:${timestamp}`)
    .digest("hex");

  return Buffer.from(`admin:${timestamp}:${signature}`).toString("base64");
};

// Registo de rotas
export async function registerRoutes(app: Express): Promise<void> {
  app.post("/api/admin/auth", async (req: Request, res: Response) => {
    try {
      const { password } = req.body as { password?: string };
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminPassword) {
        return res
          .status(500)
          .json({ error: "Admin password not configured" });
      }

      if (!password) {
        return res
          .status(400)
          .json({ error: "Password is required" });
      }

      const inputBuffer = Buffer.from(password.trim());
      const adminBuffer = Buffer.from(adminPassword.trim());

      const isValid =
        inputBuffer.length === adminBuffer.length &&
        crypto.timingSafeEqual(inputBuffer, adminBuffer);

      if (!isValid) {
        return res.status(401).json({ error: "Invalid password" });
      }

      const token = createAdminToken();

      return res.json({ token });

    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: "Internal server error" });
    }
  });
}
