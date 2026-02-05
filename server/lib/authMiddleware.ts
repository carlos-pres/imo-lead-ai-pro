import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import crypto from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET;

declare global {
  namespace Express {
    interface Request {
      customerId?: string;
      customer?: {
        id: string;
        name: string;
        email: string;
      };
    }
  }
}

function verifySignedToken(token: string): { valid: boolean; customerId?: string } {
  if (!SESSION_SECRET) return { valid: false };
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    
    if (parts.length !== 4) return { valid: false };
    
    const [prefix, customerId, timestamp, providedSignature] = parts;
    
    if (prefix !== 'customer') return { valid: false };
    
    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET)
      .update(`customer:${customerId}:${timestamp}`)
      .digest('hex');
    
    if (providedSignature !== expectedSignature) return { valid: false };
    
    // Token expires on December 31, 2026
    const expiryDate = new Date('2026-12-31T23:59:59Z').getTime();
    const now = Date.now();
    
    if (now >= expiryDate) return { valid: false };
    
    return { valid: true, customerId };
  } catch {
    return { valid: false };
  }
}

function verifyLegacyToken(token: string): { valid: boolean; customerId?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    
    if (parts.length !== 3) return { valid: false };
    
    const [prefix, customerId, timestamp] = parts;
    
    if (prefix !== 'customer' || !customerId || !timestamp) return { valid: false };
    
    // Token expires on December 31, 2026
    const expiryDate = new Date('2026-12-31T23:59:59Z').getTime();
    const now = Date.now();
    
    if (now >= expiryDate) return { valid: false };
    
    return { valid: true, customerId };
  } catch {
    return { valid: false };
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    // Support token from query param for SSE (EventSource cannot set headers)
    const queryToken = req.query.token as string | undefined;
    
    let token: string | undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (queryToken) {
      token = queryToken;
    }
    
    if (!token) {
      return res.status(401).json({ error: "Token de autenticação não fornecido" });
    }
    
    let verification = verifySignedToken(token);
    
    if (!verification.valid) {
      verification = verifyLegacyToken(token);
    }
    
    if (!verification.valid || !verification.customerId) {
      return res.status(401).json({ error: "Token inválido ou expirado" });
    }

    const customer = await storage.getCustomer(verification.customerId);
    if (!customer) {
      return res.status(401).json({ error: "Cliente não encontrado" });
    }

    req.customerId = verification.customerId;
    req.customer = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
    };
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Erro de autenticação" });
  }
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  return authMiddleware(req, res, next);
}
