import { Router } from "express";
import * as storage from "./storage";
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
} from "./auth";

const router = Router();

/* ================= REGISTER ================= */

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await storage.getCustomerByEmail(email);

  if (existing)
    return res.status(400).json({ error: "Email já existe" });

  const hashed = await hashPassword(password);

  const user = await storage.createCustomer({
    name,
    email,
    password: hashed,
  });

  const token = generateToken(user.id);

  res.json({ token });
});

/* ================= LOGIN ================= */

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await storage.getCustomerByEmail(email);

  if (!user)
    return res.status(400).json({ error: "Credenciais inválidas" });

  const valid = await comparePassword(password, user.password);

  if (!valid)
    return res.status(400).json({ error: "Credenciais inválidas" });

  const token = generateToken(user.id);

  res.json({ token });
});

/* ================= AUTH ================= */

function authMiddleware(req: any, res: any, next: any) {
  const header = req.headers.authorization;

  if (!header)
    return res.status(401).json({ error: "Não autorizado" });

  const token = header.split(" ")[1];

  const decoded = verifyToken(token);

  req.userId = decoded.userId;

  next();
}

/* ================= CREATE LEAD ================= */

router.post("/leads", authMiddleware, async (req: any, res) => {
  const user = await storage.getCustomer(req.userId);

  if (!user)
    return res.status(401).json({ error: "Usuário inválido" });

  const total = await storage.countLeads(user.id);

  if (user.plan === "basic" && total >= 50) {
    return res.status(403).json({
      error: "Plano Basic atingiu limite de 50 leads",
    });
  }

  const lead = await storage.createLead({
    customerId: user.id,
    name: req.body.name,
    property: req.body.property,
  });

  res.json(lead);
});

/* ================= LIST LEADS ================= */

router.get("/leads", authMiddleware, async (req: any, res) => {
  const data = await storage.getLeads(req.userId);
  res.json(data);
});

export default router;