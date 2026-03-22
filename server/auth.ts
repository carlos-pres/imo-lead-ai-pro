import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

let developmentJwtSecret: string | null = null;

function getConfiguredSecret() {
  const configured = process.env.JWT_SECRET || process.env.SESSION_SECRET;
  return configured?.trim() ? configured.trim() : "";
}

function getJwtSecret() {
  const configuredSecret = getConfiguredSecret();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET ou SESSION_SECRET sao obrigatorios em producao.");
  }

  if (!developmentJwtSecret) {
    developmentJwtSecret = randomBytes(48).toString("hex");
    console.warn(
      "JWT_SECRET ausente. A usar segredo temporario apenas para desenvolvimento local."
    );
  }

  return developmentJwtSecret;
}

export function isAuthSecretConfigured() {
  return Boolean(getConfiguredSecret());
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string) {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as { userId: string };
}
