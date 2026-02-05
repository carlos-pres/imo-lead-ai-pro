import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { 
  insertLeadSchema, 
  insertMessageTemplateSchema, 
  insertCalendarEventSchema, 
  insertInteractionSchema,
  insertCustomerSchema,
  insertSubscriptionSchema,
  insertPaymentSchema,
} from "@shared/schema";
import { canScheduleVisits, VISIT_RESTRICTION_MESSAGE } from "@shared/plans";
import { analyzeLeadWithAI, chatWithAI, chatWithAIStream, generateReportWithAI } from "./lib/openai";
import { sendTrialExpiredEmail } from "./services/emailService";
import { runScheduledSearchForCustomer, runAllScheduledSearches } from "./lib/scheduledSearches";
import { casafariService, type CasafariSearchParams } from "./lib/casafari";
import { searchIdealista } from "./lib/idealista";
import { paymentService, type PaymentRequest } from "./lib/payments";
import { whatsappService, type GenerateMessageParams } from "./lib/whatsapp";
import { stripeService } from "./lib/stripeService";
import { getStripePublishableKey } from "./lib/stripeClient";
import { authMiddleware } from "./lib/authMiddleware";
import { authRateLimiter } from "./middleware/rateLimit";
import { validateRegistration, validateLogin, validateLead } from "./middleware/validation";
import { sendVerificationEmail, sendPasswordResetEmail, isEmailConfigured, sendTestEmail } from "./lib/email";
import { 
  isGoogleOAuthConfigured,
  getAuthUrl as getGoogleAuthUrl,
  handleCallback as handleGoogleCallback,
  validateSignedState,
  disconnectCalendar,
  isCustomerCalendarConnected,
  listEventsForCustomer,
  createEventForCustomer,
  updateEventForCustomer,
  deleteEventForCustomer,
  getFreeBusyForCustomer
} from "./lib/googleCalendarOAuth";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Session secret for signing user tokens - REQUIRED in production
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  console.error("FATAL: SESSION_SECRET environment variable is required");
  if (process.env.NODE_ENV === 'production') {
    throw new Error("SESSION_SECRET must be configured in production");
  }
}

// Helper function to create signed user token (HMAC-signed like admin tokens)
const createUserToken = (customerId: string): string => {
  if (!SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be configured");
  }
  const timestamp = Date.now().toString();
  const signature = crypto.createHmac('sha256', SESSION_SECRET)
    .update(`customer:${customerId}:${timestamp}`)
    .digest('hex');
  return Buffer.from(`customer:${customerId}:${timestamp}:${signature}`).toString('base64');
};

// Helper function to verify signed user token
const verifyUserToken = (token: string): { valid: boolean; customerId?: string } => {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    
    if (parts.length !== 4) return { valid: false };
    
    const [prefix, customerId, timestamp, providedSignature] = parts;
    
    if (prefix !== 'customer') return { valid: false };
    
    // Verify HMAC signature
    if (!SESSION_SECRET) return { valid: false };
    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET)
      .update(`customer:${customerId}:${timestamp}`)
      .digest('hex');
    
    if (providedSignature !== expectedSignature) return { valid: false };
    
    // Check expiry (24 hours)
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    if (now - tokenTime >= dayInMs) return { valid: false };
    
    return { valid: true, customerId };
  } catch {
    return { valid: false };
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper function to create signed admin token
  const createAdminToken = (): string => {
    const secret = process.env.ADMIN_PASSWORD;
    if (!secret) {
      throw new Error("ADMIN_PASSWORD must be configured");
    }
    const timestamp = Date.now().toString();
    const signature = crypto.createHmac('sha256', secret)
      .update(`admin:${timestamp}`)
      .digest('hex');
    return Buffer.from(`admin:${timestamp}:${signature}`).toString('base64');
  };

  app.post("/api/admin/auth", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminPassword) {
        return res.status(500).json({ error: "Admin password not configured" });
      }
      
      // Security: Use timing-safe comparison to prevent timing attacks
      const inputBuffer = Buffer.from(password?.trim() || '');
      const adminBuffer = Buffer.from(adminPassword.trim());
      
      // Ensure same length comparison
      const isValid = inputBuffer.length === adminBuffer.length && 
                      crypto.timingSafeEqual(inputBuffer, adminBuffer);
      
      if (isValid) {
        const token = createAdminToken();
        // Security: Never log or expose the password
        res.json({ success: true, token });
      } else {
        // Add small delay to prevent brute force
        await new Promise(resolve => setTimeout(resolve, 500));
        res.status(401).json({ error: "Password incorreta" });
      }
    } catch (error: any) {
      // Security: Never log password-related details
      console.error("Admin auth error");
      res.status(500).json({ error: "Erro de autenticação" });
    }
  });

  app.post("/api/admin/verify", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(401).json({ valid: false });
      }
      
      try {
        const secret = process.env.ADMIN_PASSWORD;
        if (!secret) {
          return res.status(500).json({ valid: false, error: "Server configuration error" });
        }
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const parts = decoded.split(':');
        
        if (parts.length !== 3) {
          return res.status(401).json({ valid: false });
        }
        
        const [prefix, timestamp, providedSignature] = parts;
        
        if (prefix !== 'admin') {
          return res.status(401).json({ valid: false });
        }
        
        // Verify HMAC signature
        const expectedSignature = crypto.createHmac('sha256', secret)
          .update(`admin:${timestamp}`)
          .digest('hex');
        
        if (providedSignature !== expectedSignature) {
          return res.status(401).json({ valid: false });
        }
        
        // Check expiry (24 hours)
        const tokenTime = parseInt(timestamp);
        const now = Date.now();
        const hourInMs = 60 * 60 * 1000;
        
        if (now - tokenTime < hourInMs * 24) {
          return res.json({ valid: true });
        }
        
        res.status(401).json({ valid: false });
      } catch (e) {
        res.status(401).json({ valid: false });
      }
    } catch (error: any) {
      console.error("Token verify error:", error);
      res.status(500).json({ valid: false });
    }
  });

  // Admin helper function to validate admin token with HMAC signature
  const validateAdminToken = (token: string | undefined): boolean => {
    if (!token) return false;
    const secret = process.env.ADMIN_PASSWORD;
    if (!secret) return false;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const parts = decoded.split(':');
      
      if (parts.length !== 3) return false;
      
      const [prefix, timestamp, providedSignature] = parts;
      
      if (prefix !== 'admin') return false;
      
      // Verify signature
      const expectedSignature = crypto.createHmac('sha256', secret)
        .update(`admin:${timestamp}`)
        .digest('hex');
      
      if (providedSignature !== expectedSignature) return false;
      
      // Check expiry (24 hours)
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      const hourInMs = 60 * 60 * 1000;
      return now - tokenTime < hourInMs * 24;
    } catch (e) {
      return false;
    }
  };

  // Admin endpoints for home page admin section (requires admin token)
  app.get("/api/admin/home/customers", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      if (!validateAdminToken(token)) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const customers = await storage.getCustomers({});
      res.json(customers);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.patch("/api/admin/home/customers/:id/status", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      if (!validateAdminToken(token)) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !["active", "inactive", "suspended"].includes(status)) {
        return res.status(400).json({ error: "Estado inválido" });
      }

      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }

      const updatedCustomer = await storage.updateCustomer(id, { status });
      res.json(updatedCustomer);
    } catch (error: any) {
      console.error("Error updating customer status:", error);
      res.status(500).json({ error: "Erro ao atualizar estado" });
    }
  });

  app.post("/api/auth/register", authRateLimiter, ...validateRegistration, async (req, res) => {
    try {
      const { name, email, phone, company, password } = req.body;
      
      // Validation already handled by validateRegistration middleware
      const existingCustomer = await storage.getCustomerByEmail(email);
      if (existingCustomer) {
        return res.status(400).json({ error: "Este email já está registado" });
      }

      // Hash password with bcrypt (10 salt rounds - industry standard)
      const hashedPassword = await bcrypt.hash(password, 10);

      // Set trial to end in 7 days
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      const customer = await storage.createCustomer({
        name,
        email,
        phone: phone || null,
        company: company || null,
        password: hashedPassword,
        status: "active",
        plan: "trial",
        trialEndsAt,
      });

      // Create verification token and send email - always use customer data from database
      const verificationToken = await storage.createEmailVerificationToken(customer.id);
      const emailSent = await sendVerificationEmail(customer.email, customer.name, verificationToken);

      // Create HMAC-signed token
      const token = createUserToken(customer.id);

      res.json({ 
        success: true, 
        token,
        emailVerificationSent: emailSent,
        emailConfigured: isEmailConfigured(),
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          plan: customer.plan,
          trialEndsAt: customer.trialEndsAt,
          emailVerified: customer.emailVerified || false,
        }
      });
    } catch (error: any) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Erro ao criar conta" });
    }
  });

  app.post("/api/auth/login", authRateLimiter, ...validateLogin, async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validation already handled by validateLogin middleware
      const customer = await storage.getCustomerByEmail(email);
      
      // Constant-time authentication to prevent timing attacks
      // Use a valid pre-computed bcrypt hash for non-existent users
      const DUMMY_HASH = "$2b$10$RnfxzepoxLZ6LMAUXVnO3OyLMYNieOdCY5.IwEE1Eb3B5shyEEgRO";
      
      let isValidPassword = false;
      let needsUpgrade = false;
      
      if (customer?.password) {
        if (customer.password.startsWith('$2')) {
          // Bcrypt hashed password - compare directly
          isValidPassword = await bcrypt.compare(password, customer.password);
        } else {
          // Legacy plain text password - still run bcrypt.compare with dummy for constant time
          await bcrypt.compare(password, DUMMY_HASH);
          // Then check plaintext match
          if (customer.password === password) {
            isValidPassword = true;
            needsUpgrade = true;
          }
        }
      } else {
        // User doesn't exist - still run bcrypt.compare for constant time
        await bcrypt.compare(password, DUMMY_HASH);
      }
      
      // Upgrade legacy plaintext password to bcrypt hash (async, after response)
      if (needsUpgrade && customer) {
        bcrypt.hash(password, 10).then(hashedPassword => {
          storage.updateCustomer(customer.id, { password: hashedPassword }).catch(() => {});
        });
      }

      if (!customer || !customer.password || !isValidPassword) {
        return res.status(401).json({ error: "Email ou password incorretos" });
      }

      // Check if trial has expired (only if not on a paid subscription)
      const hasActiveSubscription = customer.status === 'active' || customer.plan === 'pro' || customer.plan === 'basic';
      const trialEndDate = customer.trialEndsAt ? new Date(customer.trialEndsAt) : null;
      const isTrialExpired = trialEndDate && trialEndDate < new Date();
      
      if (isTrialExpired && !hasActiveSubscription) {
        // Send trial expired email (async, don't wait)
        sendTrialExpiredEmail(customer.email, customer.name || 'Cliente', trialEndDate)
          .catch(() => {});
        
        return res.status(403).json({ 
          error: "O seu período de teste expirou. Por favor, subscreva um plano para continuar.",
          trialExpired: true,
          trialEndDate: trialEndDate.toISOString()
        });
      }

      // Create HMAC-signed token
      const token = createUserToken(customer.id);

      res.json({ 
        success: true, 
        token,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          plan: customer.plan,
          trialEndsAt: customer.trialEndsAt,
          emailVerified: customer.emailVerified || false,
        }
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Erro ao iniciar sessão" });
    }
  });

  app.post("/api/auth/verify", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(401).json({ valid: false });
      }
      
      // Try new HMAC-signed token format first
      const verification = verifyUserToken(token);
      if (verification.valid && verification.customerId) {
        const customer = await storage.getCustomer(verification.customerId);
        if (customer) {
          return res.json({ 
            valid: true,
            customer: {
              id: customer.id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              company: customer.company,
              plan: customer.plan,
              status: customer.status,
              trialEndsAt: customer.trialEndsAt,
              emailVerified: customer.emailVerified || false,
            }
          });
        }
      }
      
      // Fallback: try legacy unsigned token format for backward compatibility
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const parts = decoded.split(':');
        
        // Legacy format: customer:id:timestamp (3 parts, no signature)
        if (parts.length === 3) {
          const [prefix, customerId, timestamp] = parts;
          
          if (prefix === 'customer' && customerId && timestamp) {
            const tokenTime = parseInt(timestamp);
            const now = Date.now();
            const dayInMs = 24 * 60 * 60 * 1000;
            
            if (now - tokenTime < dayInMs) {
              const customer = await storage.getCustomer(customerId);
              if (customer) {
                return res.json({ 
                  valid: true,
                  customer: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    company: customer.company,
                    plan: customer.plan,
                    status: customer.status,
                    trialEndsAt: customer.trialEndsAt,
                  }
                });
              }
            }
          }
        }
      } catch (e) {
        // Invalid token format
      }
      
      res.status(401).json({ valid: false });
    } catch (error: any) {
      console.error("Token verify error:", error);
      res.status(500).json({ valid: false });
    }
  });

  // Email verification endpoint
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ 
          success: false, 
          error: 'Token de verificação em falta' 
        });
      }
      
      const result = await storage.verifyEmailToken(token);
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: 'Email verificado com sucesso!' 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: result.error || 'Erro ao verificar email' 
        });
      }
    } catch (error: any) {
      console.error("Email verification error:", error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno ao verificar email' 
      });
    }
  });

  // Resend verification email endpoint
  app.post("/api/auth/resend-verification", authMiddleware, async (req, res) => {
    try {
      const customerId = req.customerId;
      
      if (!customerId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }
      
      const customer = await storage.getCustomer(customerId);
      
      if (!customer) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      
      if (customer.emailVerified) {
        return res.status(400).json({ error: 'Email já verificado' });
      }
      
      // Check if there's a recent token (avoid spam)
      const existingToken = await storage.getVerificationTokenByCustomer(customerId);
      if (existingToken) {
        const timeSinceCreated = new Date().getTime() - (existingToken.expiresAt.getTime() - 24 * 60 * 60 * 1000);
        const fiveMinutes = 5 * 60 * 1000;
        if (timeSinceCreated < fiveMinutes) {
          return res.status(429).json({ 
            error: 'Aguarde 5 minutos antes de solicitar novo email de verificação' 
          });
        }
      }
      
      // Create new verification token and send email
      const verificationToken = await storage.createEmailVerificationToken(customerId);
      const emailSent = await sendVerificationEmail(customer.email, customer.name, verificationToken);
      
      res.json({ 
        success: true, 
        emailSent,
        emailConfigured: isEmailConfigured(),
        message: emailSent 
          ? 'Email de verificação enviado' 
          : 'Email não enviado (serviço de email não configurado)'
      });
    } catch (error: any) {
      console.error("Resend verification error:", error);
      res.status(500).json({ error: 'Erro ao reenviar email de verificação' });
    }
  });

  // Public endpoint to resend verification email by email address (for expired tokens)
  app.post("/api/auth/resend-verification-public", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }
      
      const customer = await storage.getCustomerByEmail(email.toLowerCase().trim());
      
      if (!customer) {
        // Don't reveal if email exists for security
        return res.json({ 
          success: true, 
          message: 'Se o email existir, receberá um novo link de verificação' 
        });
      }
      
      if (customer.emailVerified) {
        return res.json({ 
          success: true, 
          alreadyVerified: true,
          message: 'O seu email já está verificado. Pode fazer login.' 
        });
      }
      
      // Check rate limiting - 1 email per 2 minutes
      const existingToken = await storage.getVerificationTokenByCustomer(customer.id);
      if (existingToken) {
        const tokenCreatedAt = new Date(existingToken.expiresAt.getTime() - 7 * 24 * 60 * 60 * 1000);
        const timeSinceCreated = new Date().getTime() - tokenCreatedAt.getTime();
        const twoMinutes = 2 * 60 * 1000;
        if (timeSinceCreated < twoMinutes) {
          return res.status(429).json({ 
            error: 'Aguarde 2 minutos antes de solicitar novo email de verificação' 
          });
        }
      }
      
      // Create new verification token and send email
      const verificationToken = await storage.createEmailVerificationToken(customer.id);
      const emailSent = await sendVerificationEmail(customer.email, customer.name, verificationToken);
      
      res.json({ 
        success: true, 
        emailSent,
        message: emailSent 
          ? 'Novo email de verificação enviado! Verifique a sua caixa de entrada.' 
          : 'Email de verificação não pôde ser enviado. Contacte o suporte.'
      });
    } catch (error: any) {
      console.error("Public resend verification error:", error);
      res.status(500).json({ error: 'Erro ao reenviar email de verificação' });
    }
  });

  // Check email verification status
  app.get("/api/auth/email-status", authMiddleware, async (req, res) => {
    try {
      const customerId = req.customerId;
      
      if (!customerId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }
      
      const customer = await storage.getCustomer(customerId);
      
      if (!customer) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      
      res.json({ 
        emailVerified: customer.emailVerified || false,
        emailVerifiedAt: customer.emailVerifiedAt,
        emailConfigured: isEmailConfigured()
      });
    } catch (error: any) {
      console.error("Email status error:", error);
      res.status(500).json({ error: 'Erro ao verificar estado do email' });
    }
  });

  // Test email endpoint (admin only - requires auth)
  app.post("/api/admin/test-email", authMiddleware, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email de destino é obrigatório' });
      }
      
      if (!isEmailConfigured()) {
        return res.status(400).json({ 
          error: 'Email não está configurado',
          details: 'Verifique as variáveis SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS'
        });
      }
      
      console.log(`[Test Email] Sending test email to ${email}`);
      const result = await sendTestEmail(email);
      
      if (result.success) {
        console.log(`[Test Email] Test email sent successfully to ${email}`);
        res.json({ 
          success: true, 
          message: `Email de teste enviado com sucesso para ${email}` 
        });
      } else {
        console.error(`[Test Email] Failed to send test email: ${result.error}`);
        res.status(500).json({ 
          success: false, 
          error: result.error || 'Erro ao enviar email de teste'
        });
      }
    } catch (error: any) {
      console.error("Test email error:", error);
      res.status(500).json({ error: 'Erro ao enviar email de teste', details: error.message });
    }
  });

  // Request password reset endpoint (public)
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }
      
      const customer = await storage.getCustomerByEmail(email);
      
      if (!customer) {
        return res.json({ 
          success: true, 
          message: 'Se o email existir no sistema, receberá instruções para recuperar a senha' 
        });
      }
      
      const existingToken = await storage.getPasswordResetTokenByCustomer(customer.id);
      if (existingToken) {
        const timeSinceCreated = new Date().getTime() - (existingToken.expiresAt.getTime() - 60 * 60 * 1000);
        const fiveMinutes = 5 * 60 * 1000;
        if (timeSinceCreated < fiveMinutes) {
          return res.status(429).json({ 
            error: 'Aguarde 5 minutos antes de solicitar novo email de recuperação' 
          });
        }
      }
      
      const resetToken = await storage.createPasswordResetToken(customer.id);
      const emailSent = await sendPasswordResetEmail(customer.email, customer.name, resetToken);
      
      res.json({ 
        success: true, 
        emailSent,
        emailConfigured: isEmailConfigured(),
        message: emailSent 
          ? 'Email de recuperação enviado com sucesso' 
          : 'Email não enviado (serviço de email não configurado)'
      });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: 'Erro ao processar pedido de recuperação de senha' });
    }
  });

  // Verify password reset token endpoint (public)
  app.get("/api/auth/verify-reset-token", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ success: false, error: 'Token em falta' });
      }
      
      const result = await storage.verifyPasswordResetToken(token);
      
      res.json({ 
        success: result.success, 
        error: result.error 
      });
    } catch (error: any) {
      console.error("Verify reset token error:", error);
      res.status(500).json({ success: false, error: 'Erro ao verificar token' });
    }
  });

  // Reset password endpoint (public)
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: 'Token em falta' });
      }
      
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
      }
      
      const result = await storage.resetPassword(token, password);
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: 'Senha alterada com sucesso' 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: result.error || 'Erro ao alterar senha' 
        });
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: 'Erro ao alterar senha' });
    }
  });

  app.get("/api/customers/:id", authMiddleware, async (req, res) => {
    try {
      if (req.customerId !== req.params.id) {
        return res.status(403).json({ error: "Acesso não autorizado" });
      }

      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      
      const { password, ...safeCustomer } = customer;
      res.json({ customer: safeCustomer });
    } catch (error: any) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ error: "Erro ao buscar cliente" });
    }
  });

  app.patch("/api/customers/:id", authMiddleware, async (req, res) => {
    try {
      if (req.customerId !== req.params.id) {
        return res.status(403).json({ error: "Acesso não autorizado" });
      }

      const { name, email, phone, company } = req.body;
      
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }

      if (email && email !== customer.email) {
        const existingCustomer = await storage.getCustomerByEmail(email);
        if (existingCustomer && existingCustomer.id !== customer.id) {
          return res.status(400).json({ error: "Este email já está registado" });
        }
      }

      const updatedCustomer = await storage.updateCustomer(req.params.id, {
        name: name || customer.name,
        email: email || customer.email,
        phone: phone !== undefined ? phone : customer.phone,
        company: company !== undefined ? company : customer.company,
      });

      if (!updatedCustomer) {
        return res.status(404).json({ error: "Erro ao atualizar cliente" });
      }

      const { password, ...safeCustomer } = updatedCustomer;
      res.json({ 
        success: true, 
        customer: safeCustomer 
      });
    } catch (error: any) {
      console.error("Error updating customer:", error);
      res.status(500).json({ error: "Erro ao atualizar cliente" });
    }
  });

  // Streaming search endpoint for real-time updates
  app.get("/api/search/stream", authMiddleware, async (req, res) => {
    const customerId = req.customerId;
    if (!customerId) {
      return res.status(401).json({ error: "Customer ID required" });
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const { searchCasafari, convertToLead, analyzeListingWithAI, checkDuplicateLead } = await import('./services/casafariService');
      const { searchIdealista } = await import('./lib/idealista');
      const { searchOLX } = await import('./lib/olx');

      sendEvent("status", { message: "A iniciar pesquisa..." });

      const allListings: any[] = [];
      const searchResults: { source: string; found: number; added: number }[] = [];

      // Search Casafari
      sendEvent("status", { message: "A pesquisar Casafari...", source: "Casafari" });
      const casafariApiKey = process.env.CASAFARI_API_KEY;
      const { listings: casafariListings } = await searchCasafari({ location: "Portugal" }, casafariApiKey);
      allListings.push(...casafariListings.map(l => ({ ...l, source: "Casafari" })));
      searchResults.push({ source: "Casafari", found: casafariListings.length, added: 0 });
      sendEvent("source_complete", { source: "Casafari", found: casafariListings.length });

      // Search Idealista
      sendEvent("status", { message: "A pesquisar Idealista...", source: "Idealista" });
      try {
        const idealistaListings = await searchIdealista({ location: "Portugal", operation: "sale" });
        allListings.push(...idealistaListings.map(l => ({ ...l, source: "Idealista" })));
        searchResults.push({ source: "Idealista", found: idealistaListings.length, added: 0 });
        sendEvent("source_complete", { source: "Idealista", found: idealistaListings.length });
      } catch (e) {
        searchResults.push({ source: "Idealista", found: 0, added: 0 });
        sendEvent("source_complete", { source: "Idealista", found: 0, error: true });
      }

      // Search OLX
      sendEvent("status", { message: "A pesquisar OLX...", source: "OLX" });
      try {
        const olxListings = await searchOLX({ location: "Portugal" });
        allListings.push(...olxListings.map(l => ({ ...l, source: "OLX" })));
        searchResults.push({ source: "OLX", found: olxListings.length, added: 0 });
        sendEvent("source_complete", { source: "OLX", found: olxListings.length });
      } catch (e) {
        searchResults.push({ source: "OLX", found: 0, added: 0 });
        sendEvent("source_complete", { source: "OLX", found: 0, error: true });
      }

      // Process leads
      sendEvent("status", { message: "A analisar e criar leads..." });

      const existingLeads = await storage.getLeadsByCustomer(customerId);
      const existingContactInfo = existingLeads.map(l => ({
        contact: l.contact,
        email: l.email || undefined,
        location: l.location,
      }));

      const createdLeads: any[] = [];

      for (let i = 0; i < allListings.length; i++) {
        const listing = allListings[i];
        const isDuplicate = await checkDuplicateLead(listing, existingContactInfo);
        if (isDuplicate) continue;

        const analysis = await analyzeListingWithAI(listing);
        if (analysis.score < 40) continue;

        const leadData = convertToLead(listing);
        const newLead = await storage.createLead({
          ...leadData,
          customerId,
          aiScore: analysis.score,
          aiReasoning: analysis.reasoning,
          status: analysis.status,
        } as any);

        createdLeads.push(newLead);
        existingContactInfo.push({
          contact: newLead.contact,
          email: newLead.email || undefined,
          location: newLead.location,
        });

        const sourceResult = searchResults.find(r => r.source === listing.source);
        if (sourceResult) sourceResult.added++;

        // Send real-time lead creation event
        sendEvent("lead_created", {
          lead: {
            name: newLead.name,
            property: newLead.property,
            location: newLead.location,
            price: newLead.price,
            contact: newLead.contact,
            email: newLead.email,
            source: newLead.source,
            sourceUrl: newLead.sourceUrl,
            aiScore: newLead.aiScore,
            status: newLead.status,
          },
          total: createdLeads.length,
        });
      }

      // Send final results
      sendEvent("complete", {
        searchResults,
        leadsCreated: createdLeads.length,
        leads: createdLeads,
      });

      res.end();
    } catch (error: any) {
      console.error("Streaming search error:", error);
      sendEvent("error", { message: error.message || "Erro na pesquisa" });
      res.end();
    }
  });

  // AI Chat endpoint
  app.post("/api/ai/chat", authMiddleware, async (req, res) => {
    try {
      const { message, context, conversationHistory } = req.body;
      
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Mensagem é obrigatória" });
      }

      const customerId = req.customerId;
      console.log(`[AI Chat] Request from ${req.customer?.email}: ${message.substring(0, 50)}... (history: ${conversationHistory?.length || 0} msgs)`);

      // Detect search-related queries and trigger actual search
      const searchKeywords = ["pesquisar", "procurar", "buscar", "encontrar", "novos leads", "busca", "pesquisa de leads", "procura de imoveis", "procurar imoveis", "pesquisar leads"];
      const messageLower = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const isSearchRequest = searchKeywords.some(keyword => {
        const normalizedKeyword = keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return messageLower.includes(normalizedKeyword);
      });

      if (isSearchRequest && customerId) {
        console.log(`[AI Chat] Detected search request, triggering Apify lead search...`);
        
        const { searchWithApify, isApifyConfigured } = await import('./lib/apify');
        const { analyzeListingWithAI, checkDuplicateLead } = await import('./services/casafariService');

        // Check if Apify is configured
        if (!isApifyConfigured()) {
          return res.json({
            response: "Para captar leads reais, precisa configurar a chave API da Apify. Vá a Definições > Integrações e adicione a sua APIFY_API_TOKEN. A Apify permite pesquisar em Idealista, Supercasa e Imovirtual.",
            searchPerformed: false,
            leadsCreated: 0,
          });
        }

        const searchResults: { source: string; found: number; added: number }[] = [];

        // Search with Apify (Idealista, Supercasa, Imovirtual)
        const apifyResult = await searchWithApify({
          location: "portugal",
          operation: "sale",
          maxItems: 30,
        }, "all");

        const allListings = apifyResult.listings;
        
        // Track results by source
        const sourceCount: Record<string, { found: number; added: number }> = {};
        for (const listing of allListings) {
          const src = listing.source || "Unknown";
          if (!sourceCount[src]) sourceCount[src] = { found: 0, added: 0 };
          sourceCount[src].found++;
        }

        // Get existing leads for duplicate check
        const existingLeads = await storage.getLeadsByCustomer(customerId);
        const existingContactInfo = existingLeads.map(l => ({
          contact: l.contact,
          email: l.email || undefined,
          location: l.location,
        }));

        // Process listings and create leads
        const createdLeads: any[] = [];
        
        for (const listing of allListings) {
          const isDuplicate = await checkDuplicateLead({
            contact: listing.contact,
            email: listing.email,
            location: listing.location,
          }, existingContactInfo);
          if (isDuplicate) continue;

          const analysis = await analyzeListingWithAI({
            title: listing.title,
            price: listing.price,
            location: listing.location,
            propertyType: listing.propertyType,
            bedrooms: listing.bedrooms,
            contact: listing.contact,
            source: listing.source,
            description: listing.description,
          });
          if (analysis.score < 40) continue;

          const newLead = await storage.createLead({
            name: listing.contactName || "Proprietário",
            property: listing.title,
            propertyType: listing.propertyType,
            location: listing.location,
            price: listing.price,
            contact: listing.contact || "",
            email: listing.email || "",
            source: listing.source,
            sourceUrl: listing.url || null,
            ownerType: "particular",
            qualification: "novo",
            aiScore: analysis.score,
            aiReasoning: analysis.reasoning,
            status: analysis.status,
            notes: `Captado via Assistente IA - ${listing.source}`,
            customerId,
          } as any);

          createdLeads.push(newLead);
          existingContactInfo.push({
            contact: newLead.contact,
            email: newLead.email || undefined,
            location: newLead.location,
          });

          const src = listing.source || "Unknown";
          if (sourceCount[src]) sourceCount[src].added++;
        }
        
        for (const [src, counts] of Object.entries(sourceCount)) {
          searchResults.push({ source: src, ...counts });
        }

        // Build response message
        let response = `Pesquisa concluida!\n\nResultados por fonte:\n`;
        for (const result of searchResults) {
          response += `- ${result.source}: ${result.found} encontrados, ${result.added} adicionados\n`;
        }
        response += `\nTotal de novos leads criados: ${createdLeads.length}`;

        if (createdLeads.length > 0) {
          response += `\n\n--- NOVOS LEADS ---\n`;
          for (const lead of createdLeads) {
            response += `\n${lead.name}`;
            response += `\n  Imovel: ${lead.property}`;
            response += `\n  Localizacao: ${lead.location}`;
            response += `\n  Preco: ${lead.price}`;
            if (lead.contact) response += `\n  Contacto: ${lead.contact}`;
            if (lead.email) response += `\n  Email: ${lead.email}`;
            response += `\n  Fonte: ${lead.source} | Score: ${lead.aiScore} (${lead.status})`;
            if (lead.sourceUrl) response += `\n  Ver anuncio: ${lead.sourceUrl}`;
            response += `\n`;
          }
        }

        console.log(`[AI Chat] Search completed: ${createdLeads.length} leads created`);
        return res.json({ response, searchTriggered: true, leadsCreated: createdLeads.length });
      }

      // Detect message PREPARATION intent (generates draft, doesn't auto-send)
      // More specific patterns to avoid accidental triggers
      const prepareMessageKeywords = ["preparar mensagem para", "gerar mensagem para", "criar mensagem para", "escrever mensagem para"];
      const sendWhatsAppKeywords = ["enviar whatsapp ao", "envia whatsapp ao", "mandar whatsapp ao", "whatsapp para"];
      const sendEmailKeywords = ["enviar email ao", "envia email ao", "email para"];
      
      const isPrepareMessage = prepareMessageKeywords.some(keyword => messageLower.includes(keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
      const isSendWhatsApp = sendWhatsAppKeywords.some(keyword => messageLower.includes(keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
      const isSendEmail = sendEmailKeywords.some(keyword => messageLower.includes(keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
      
      const isMessageRequest = isPrepareMessage || isSendWhatsApp || isSendEmail;

      if (isMessageRequest && customerId) {
        console.log(`[AI Chat] Detected message request (prepare: ${isPrepareMessage}, whatsapp: ${isSendWhatsApp}, email: ${isSendEmail})`);
        
        // Get customer's leads to find the referenced lead
        const customerLeads = await storage.getLeadsByCustomer(customerId);
        
        // Try to find the lead mentioned in the message - REQUIRE explicit name match
        let targetLead = null;
        for (const lead of customerLeads) {
          const leadNameNormalized = lead.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          // Require at least 3 chars match to avoid false positives
          if (leadNameNormalized.length >= 3 && messageLower.includes(leadNameNormalized)) {
            targetLead = lead;
            break;
          }
        }
        
        // If no specific lead found, DON'T auto-pick - ask user to specify
        if (!targetLead) {
          let response = "Para enviar ou preparar uma mensagem, preciso que especifique o nome do lead.\n\n";
          if (customerLeads.length === 0) {
            response += "Ainda não tem leads na sua lista. Use a pesquisa para encontrar novos leads.";
          } else {
            response += `Tem ${customerLeads.length} leads. Exemplos de como pedir:\n`;
            response += `- "Preparar mensagem para ${customerLeads[0].name}"\n`;
            response += `- "Enviar WhatsApp ao ${customerLeads[0].name}"\n`;
            response += `- "Enviar email ao ${customerLeads[0].name}"`;
          }
          return res.json({ response });
        }
        
        // Determine channel explicitly
        const channel = isSendEmail ? "email" : "whatsapp";
        
        // Generate AI message for the lead
        const { generateAIMessage, sendWhatsApp, sendEmail } = await import('./services/emailService');
        
        const aiMessage = await generateAIMessage(
          targetLead.name,
          targetLead.location,
          targetLead.property,
          targetLead.price,
          "new_lead",
          channel
        );
        
        // If just preparing (not explicitly sending), show draft and ask for confirmation
        if (isPrepareMessage) {
          let responseMessage = `Mensagem preparada para ${targetLead.name}:\n\n`;
          if (channel === "email" && aiMessage.subject) {
            responseMessage += `Assunto: ${aiMessage.subject}\n`;
          }
          responseMessage += `"${aiMessage.content}"\n\n`;
          responseMessage += `Para enviar, escreva:\n`;
          if (targetLead.contact) responseMessage += `- "Enviar WhatsApp ao ${targetLead.name}"\n`;
          if (targetLead.email) responseMessage += `- "Enviar email ao ${targetLead.name}"`;
          return res.json({ response: responseMessage, messagePrepared: true });
        }
        
        // Explicit send request
        let sendResult: { success: boolean; error?: string; fallbackUrl?: string } = { success: false };
        let responseMessage = "";
        
        if (channel === "whatsapp") {
          if (!targetLead.contact) {
            return res.json({ response: `${targetLead.name} não tem número de telefone registado. Pode adicionar o contacto no CRM.` });
          }
          
          sendResult = await sendWhatsApp(targetLead.contact, aiMessage.content);
          
          if (sendResult.fallbackUrl) {
            responseMessage = `Mensagem WhatsApp preparada para ${targetLead.name}!\n\n`;
            responseMessage += `Clique no link para enviar:\n${sendResult.fallbackUrl}\n\n`;
            responseMessage += `Mensagem: "${aiMessage.content}"`;
          } else if (sendResult.success) {
            responseMessage = `Mensagem WhatsApp enviada para ${targetLead.name} (${targetLead.contact})!\n\n`;
            responseMessage += `Mensagem: "${aiMessage.content}"`;
            
            await storage.createInteraction({
              leadId: targetLead.id,
              type: "whatsapp",
              content: aiMessage.content,
              metadata: { sentViaAI: true }
            });
          } else {
            responseMessage = `Erro ao enviar: ${sendResult.error}`;
          }
        } else if (channel === "email") {
          if (!targetLead.email) {
            return res.json({ response: `${targetLead.name} não tem email registado. Pode adicionar o email no CRM.` });
          }
          
          // Check email configuration
          if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            return res.json({ response: `O serviço de email não está configurado. Configure as credenciais SMTP nas definições.` });
          }
          
          const emailConfig = {
            provider: "smtp" as const,
            fromEmail: process.env.SMTP_USER,
            fromName: process.env.EMAIL_FROM_NAME || "ImoLead AI Pro",
            smtpHost: process.env.SMTP_HOST,
            smtpPort: parseInt(process.env.SMTP_PORT || "587"),
            smtpUser: process.env.SMTP_USER,
            smtpPass: process.env.SMTP_PASS,
          };
          
          sendResult = await sendEmail({
            to: targetLead.email,
            subject: aiMessage.subject || "Oportunidade Imobiliária",
            body: aiMessage.content,
          }, emailConfig);
          
          if (sendResult.success) {
            responseMessage = `Email enviado para ${targetLead.name} (${targetLead.email})!\n\n`;
            responseMessage += `Assunto: ${aiMessage.subject}\n`;
            responseMessage += `Mensagem: "${aiMessage.content}"`;
            
            await storage.createInteraction({
              leadId: targetLead.id,
              type: "email",
              content: `${aiMessage.subject}: ${aiMessage.content}`,
              metadata: { sentViaAI: true }
            });
          } else {
            responseMessage = `Erro ao enviar email: ${sendResult.error}`;
          }
        }
        
        console.log(`[AI Chat] Message action completed for lead ${targetLead.id}`);
        return res.json({ response: responseMessage, messageSent: sendResult.success });
      }
      
      // Detect visit scheduling intent and check plan restrictions
      const scheduleVisitKeywords = ["agendar visita", "marcar visita", "agendar uma visita", "criar visita", "nova visita"];
      const isScheduleVisitRequest = scheduleVisitKeywords.some(kw => messageLower.includes(kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
      
      if (isScheduleVisitRequest && customerId) {
        // Check user's plan to see if they can schedule visits
        const subscriptions = await storage.getSubscriptions({ customerId, status: "active" });
        const activeSubscription = subscriptions[0];
        const planId = activeSubscription?.planId || "basic";
        
        if (!canScheduleVisits(planId)) {
          console.log(`[AI Chat] Visit scheduling blocked for plan: ${planId}`);
          const upgradeMessage = `A marcação de visitas pelo assistente IA não está disponível no seu plano atual (${planId.toUpperCase()}).\n\n` +
            `Esta funcionalidade está disponível nos planos Pro e Custom.\n\n` +
            `Com o upgrade pode:\n` +
            `- Agendar visitas diretamente pelo assistente\n` +
            `- Receber lembretes automáticos\n` +
            `- Integrar com Google Agenda\n` +
            `- Gestão completa de calendário\n\n` +
            `Visite a nossa loja para fazer upgrade: /store`;
          return res.json({ response: upgradeMessage, upgradeRequired: true });
        }
      }
      
      // Detect qualification update intent
      const qualificationKeywords = {
        visitado: ["visitado", "visitada", "cliente visitado", "visita realizada", "ja visitei", "visitei"],
        pendente_visita: ["pendente visita", "agendar visita", "visita pendente", "para visitar", "precisa visita"],
        sem_resposta: ["sem resposta", "nao responde", "nao respondeu", "sem contacto", "sem retorno"],
        meu_imovel: ["meu imovel", "minha propriedade", "imovel proprio", "meus imoveis"]
      };
      
      // Check if this is a qualification update request
      let detectedQualification: string | null = null;
      for (const [qual, keywords] of Object.entries(qualificationKeywords)) {
        if (keywords.some(kw => messageLower.includes(kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "")))) {
          detectedQualification = qual;
          break;
        }
      }
      
      // Keywords that indicate marking/updating action
      const markKeywords = ["marcar", "classificar", "atualizar", "mudar para", "alterar para", "colocar como", "definir como"];
      const isMarkAction = markKeywords.some(kw => messageLower.includes(kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
      
      if (detectedQualification && isMarkAction && customerId) {
        console.log(`[AI Chat] Detected qualification update request: ${detectedQualification}`);
        
        // Get customer's leads to find the referenced lead
        const customerLeads = await storage.getLeadsByCustomer(customerId);
        
        // Try to find the lead mentioned in the message
        let targetLead = null;
        for (const lead of customerLeads) {
          const leadNameNormalized = lead.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (leadNameNormalized.length >= 3 && messageLower.includes(leadNameNormalized)) {
            targetLead = lead;
            break;
          }
        }
        
        if (!targetLead) {
          let response = "Para atualizar a qualificação, preciso que especifique o nome do lead.\n\n";
          if (customerLeads.length === 0) {
            response += "Ainda não tem leads na sua lista.";
          } else {
            response += `Exemplos de como pedir:\n`;
            response += `- "Marcar ${customerLeads[0].name} como visitado"\n`;
            response += `- "Classificar ${customerLeads[0].name} como pendente visita"\n`;
            response += `- "Marcar ${customerLeads[0].name} como sem resposta"`;
          }
          return res.json({ response });
        }
        
        // Update the lead qualification
        await storage.updateLead(targetLead.id, { qualification: detectedQualification as "visitado" | "pendente_visita" | "sem_resposta" | "meu_imovel" });
        
        // Create interaction record
        const qualificationLabels: Record<string, string> = {
          visitado: "Visitado",
          pendente_visita: "Pendente Visita",
          sem_resposta: "Sem Resposta",
          meu_imovel: "Meu Imóvel"
        };
        
        await storage.createInteraction({
          leadId: targetLead.id,
          type: "note",
          content: `Qualificação atualizada para: ${qualificationLabels[detectedQualification]}`,
          metadata: { updatedViaAI: true, qualification: detectedQualification }
        });
        
        const responseMessage = `Qualificação atualizada!\n\n` +
          `Lead: ${targetLead.name}\n` +
          `Nova qualificação: ${qualificationLabels[detectedQualification]}\n\n` +
          `Pode ver este lead no separador "${qualificationLabels[detectedQualification]}" na tabela de leads.`;
        
        console.log(`[AI Chat] Updated lead ${targetLead.id} qualification to ${detectedQualification}`);
        return res.json({ response: responseMessage, qualificationUpdated: true });
      }

      // Validate conversation history
      const validatedHistory = Array.isArray(conversationHistory) 
        ? conversationHistory
            .filter((msg: any) => msg && typeof msg.content === "string" && ["user", "assistant"].includes(msg.role))
            .slice(-10)
            .map((msg: any) => ({ role: msg.role as "user" | "assistant", content: msg.content.substring(0, 2000) }))
        : [];

      const response = await chatWithAI(message, context, validatedHistory);
      console.log(`[AI Chat] Response generated successfully`);
      res.json({ response });
    } catch (error: any) {
      console.error("[AI Chat] Error:", error.message || error);
      res.status(500).json({ error: "Erro ao processar o comando. Tente novamente." });
    }
  });

  // AI Status endpoint - check if AI is active
  app.get("/api/ai/status", authMiddleware, async (req, res) => {
    try {
      const hasOpenRouter = !!(process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL && process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY);
      const hasOpenAI = !!process.env.OPENAI_API_KEY;
      
      res.json({
        active: hasOpenRouter || hasOpenAI,
        provider: hasOpenRouter ? "DeepSeek (OpenRouter)" : hasOpenAI ? "OpenAI" : null,
      });
    } catch (error: any) {
      console.error("Error checking AI status:", error);
      res.status(500).json({ error: "Erro ao verificar estado da IA" });
    }
  });

  // AI Report generation endpoint (Pro only)
  app.post("/api/ai/report", authMiddleware, async (req, res) => {
    try {
      const customerId = req.customerId;
      if (!customerId) {
        return res.status(401).json({ error: "Autenticação necessária" });
      }

      // Check if user is Pro
      const customer = await storage.getCustomer(customerId);
      if (!customer || customer.plan !== "pro") {
        return res.status(403).json({ error: "Esta funcionalidade está disponível apenas para utilizadores Pro" });
      }

      const { period } = req.body;
      const reportPeriod = period || new Date().toLocaleDateString("pt-PT", { month: "long", year: "numeric" });

      // Get leads for the customer
      const leads = await storage.getLeadsByCustomer(customerId);
      
      const hotLeads = leads.filter(l => l.status === "quente").length;
      const warmLeads = leads.filter(l => l.status === "morno").length;
      const coldLeads = leads.filter(l => l.status === "frio").length;

      const reportData = {
        leads: leads.map(l => ({
          name: l.name,
          property: l.property,
          location: l.location,
          price: l.price,
          status: l.status,
          aiScore: l.aiScore,
          source: l.source,
          createdAt: l.createdAt,
        })),
        period: reportPeriod,
        totalLeads: leads.length,
        hotLeads,
        warmLeads,
        coldLeads,
      };

      console.log(`[AI Report] Generating report for customer ${customerId}`);
      const report = await generateReportWithAI(reportData);
      console.log(`[AI Report] Report generated successfully`);

      res.json({ report, period: reportPeriod, stats: { totalLeads: leads.length, hotLeads, warmLeads, coldLeads } });
    } catch (error: any) {
      console.error("[AI Report] Error:", error.message || error);
      res.status(500).json({ error: "Erro ao gerar relatório. Tente novamente." });
    }
  });

  // Chat history endpoints
  app.get("/api/chat/history", authMiddleware, async (req, res) => {
    try {
      const customerId = (req as any).user?.id;
      if (!customerId) {
        return res.status(401).json({ error: "Não autorizado" });
      }
      const messages = await storage.getChatMessages(customerId, 100);
      res.json(messages);
    } catch (error: any) {
      console.error("[Chat History] Error:", error.message || error);
      res.status(500).json({ error: "Erro ao carregar histórico" });
    }
  });

  app.post("/api/chat/message", authMiddleware, async (req, res) => {
    try {
      const customerId = (req as any).user?.id;
      if (!customerId) {
        return res.status(401).json({ error: "Não autorizado" });
      }
      const { role, content } = req.body;
      if (!role || !content) {
        return res.status(400).json({ error: "Role e content são obrigatórios" });
      }
      const message = await storage.saveChatMessage({ customerId, role, content });
      res.json(message);
    } catch (error: any) {
      console.error("[Chat Message] Error:", error.message || error);
      res.status(500).json({ error: "Erro ao guardar mensagem" });
    }
  });

  app.delete("/api/chat/history", authMiddleware, async (req, res) => {
    try {
      const customerId = (req as any).user?.id;
      if (!customerId) {
        return res.status(401).json({ error: "Não autorizado" });
      }
      await storage.clearChatHistory(customerId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Chat Clear] Error:", error.message || error);
      res.status(500).json({ error: "Erro ao limpar histórico" });
    }
  });

  // Streaming AI Chat endpoint for faster perceived responses (conversational only)
  // Note: For action-triggering requests (search, scheduling), use /api/ai/chat instead
  app.post("/api/ai/chat/stream", authMiddleware, async (req, res) => {
    let clientDisconnected = false;
    
    // Handle client disconnect
    req.on("close", () => {
      clientDisconnected = true;
    });
    
    try {
      const { message, context, conversationHistory } = req.body;
      
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ error: "Mensagem é obrigatória" });
      }
      
      // Detect action-triggering requests and redirect to non-streaming endpoint
      const searchKeywords = ["pesquisar", "procurar", "buscar", "encontrar", "novos leads", "busca", "pesquisa de leads"];
      const scheduleKeywords = ["agendar", "marcar visita", "visita", "agenda"];
      const messageLower = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      const isSearchRequest = searchKeywords.some(keyword => {
        const normalizedKeyword = keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return messageLower.includes(normalizedKeyword);
      });
      
      const isScheduleRequest = scheduleKeywords.some(keyword => {
        const normalizedKeyword = keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return messageLower.includes(normalizedKeyword);
      });
      
      // For action requests, return a flag to use non-streaming endpoint
      if (isSearchRequest || isScheduleRequest) {
        return res.json({ 
          useNonStreaming: true, 
          reason: isSearchRequest ? "search" : "schedule" 
        });
      }
      
      // Validate conversation history format
      const validHistory = Array.isArray(conversationHistory) 
        ? conversationHistory.filter((h: any) => 
            h && typeof h.role === 'string' && typeof h.content === 'string'
          ).slice(-20) // Limit history to last 20 messages
        : [];

      // Set up SSE headers
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
      
      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        if (!clientDisconnected) {
          res.write(": heartbeat\n\n");
        }
      }, 15000);
      
      try {
        // Stream the AI response
        const stream = chatWithAIStream(message, context, validHistory);
        
        for await (const chunk of stream) {
          if (clientDisconnected) break;
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
        
        if (!clientDisconnected) {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        }
      } finally {
        clearInterval(heartbeat);
      }
      
      res.end();
    } catch (error: any) {
      console.error("[AI Chat Stream] Error:", error.message || error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Erro ao processar pedido" });
      } else if (!clientDisconnected) {
        res.write(`data: ${JSON.stringify({ error: "Erro ao processar pedido" })}\n\n`);
        res.end();
      }
    }
  });

  app.post("/api/leads", authMiddleware, ...validateLead, async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      
      const aiAnalysis = await analyzeLeadWithAI({
        name: validatedData.name,
        property: validatedData.property,
        propertyType: validatedData.propertyType,
        location: validatedData.location,
        price: validatedData.price,
        contact: validatedData.contact,
        source: validatedData.source,
      });

      const lead = await storage.createLead({
        ...validatedData,
        status: aiAnalysis.status,
        aiScore: aiAnalysis.score,
        aiReasoning: aiAnalysis.reasoning,
      });

      await storage.createInteraction({
        leadId: lead.id,
        type: "note",
        content: `Lead criado com classificação AI: ${aiAnalysis.status} (score: ${aiAnalysis.score})`,
        metadata: { aiAnalysis },
      });

      res.json(lead);
    } catch (error: any) {
      console.error("Error creating lead:", error);
      res.status(400).json({ error: error.message || "Failed to create lead" });
    }
  });

  app.post("/api/leads/import-csv", authMiddleware, async (req, res) => {
    try {
      const { leads: csvLeads } = req.body;
      
      if (!Array.isArray(csvLeads) || csvLeads.length === 0) {
        return res.status(400).json({ error: "Nenhum lead fornecido para importação" });
      }
      
      if (csvLeads.length > 100) {
        return res.status(400).json({ error: "Máximo de 100 leads por importação" });
      }
      
      const customerId = req.customerId;
      const results = {
        imported: 0,
        failed: 0,
        errors: [] as string[],
      };
      
      for (const csvLead of csvLeads) {
        try {
          const name = csvLead.name || csvLead.nome || csvLead.Name || "";
          const contact = csvLead.contact || csvLead.contacto || csvLead.telefone || csvLead.phone || csvLead.Phone || "";
          const email = csvLead.email || csvLead.Email || "";
          const property = csvLead.property || csvLead.imovel || csvLead.propriedade || "";
          const propertyType = csvLead.propertyType || csvLead.tipo || csvLead.Type || "Apartamento";
          const location = csvLead.location || csvLead.localizacao || csvLead.cidade || csvLead.Location || "Portugal";
          const price = csvLead.price || csvLead.preco || csvLead.valor || csvLead.Price || "";
          const source = csvLead.source || csvLead.origem || csvLead.Source || "Importação CSV";
          
          if (!name && !contact && !email) {
            results.failed++;
            results.errors.push(`Linha ignorada: sem nome, contacto ou email`);
            continue;
          }
          
          const aiAnalysis = await analyzeLeadWithAI({
            name,
            property,
            propertyType,
            location,
            price: price.toString(),
            contact,
            source,
          });
          
          const validPropertyTypes = ["Apartamento", "Moradia", "Terreno", "Comercial", "Garagem", "Arrecadação", "Outro"] as const;
          const validSources = ["Idealista", "Imovirtual", "Supercasa", "OLX", "Casafari", "Manual", "Importação CSV", "Demonstração", "Demo"] as const;
          
          const normalizedPropertyType = validPropertyTypes.find(t => 
            t.toLowerCase() === propertyType.toLowerCase()
          ) || "Outro";
          
          const normalizedSource = validSources.find(s => 
            s.toLowerCase() === source.toLowerCase()
          ) || "Importação CSV";
          
          await storage.createLead({
            name: name || "Lead Importado",
            property,
            propertyType: normalizedPropertyType,
            location,
            price: price.toString(),
            contact,
            email,
            source: normalizedSource,
            status: aiAnalysis.status,
            aiScore: aiAnalysis.score,
            aiReasoning: aiAnalysis.reasoning,
            qualification: "pendente_visita",
            customerId,
          });
          
          results.imported++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(error.message || "Erro desconhecido");
        }
      }
      
      res.json({
        success: true,
        message: `Importação concluída: ${results.imported} leads importados, ${results.failed} falharam`,
        ...results,
      });
    } catch (error: any) {
      console.error("Error importing leads:", error);
      res.status(500).json({ error: error.message || "Erro ao importar leads" });
    }
  });

  app.post("/api/leads/generate-demo", authMiddleware, async (req, res) => {
    try {
      const { count = 10, location = "Lisboa", propertyType = "Apartamento" } = req.body;
      const customerId = req.customerId;
      
      const { generateDemoLeads } = await import("./lib/apify");
      const demoLeads = generateDemoLeads({ 
        location, 
        propertyType, 
        maxItems: Math.min(count, 20) 
      });
      
      const createdLeads = [];
      
      const validPropertyTypes = ["Apartamento", "Moradia", "Terreno", "Comercial", "Garagem", "Arrecadação", "Outro"] as const;
      
      for (const demoLead of demoLeads) {
        const normalizedPropertyType = validPropertyTypes.find(t => 
          t.toLowerCase() === demoLead.propertyType.toLowerCase()
        ) || "Apartamento";
        
        const aiAnalysis = await analyzeLeadWithAI({
          name: demoLead.contactName,
          property: demoLead.title,
          propertyType: normalizedPropertyType,
          location: demoLead.location,
          price: demoLead.price,
          contact: demoLead.contact,
          source: "Demonstração",
        });
        
        const lead = await storage.createLead({
          name: demoLead.contactName,
          property: demoLead.title,
          propertyType: normalizedPropertyType,
          location: demoLead.location,
          price: demoLead.price,
          contact: demoLead.contact,
          email: "",
          source: "Demonstração",
          sourceUrl: demoLead.url,
          status: aiAnalysis.status,
          aiScore: aiAnalysis.score,
          aiReasoning: aiAnalysis.reasoning,
          qualification: "pendente_visita",
          customerId,
        });
        
        createdLeads.push(lead);
      }
      
      res.json({
        success: true,
        message: `${createdLeads.length} leads de demonstração criados`,
        count: createdLeads.length,
      });
    } catch (error: any) {
      console.error("Error generating demo leads:", error);
      res.status(500).json({ error: error.message || "Erro ao gerar leads de demonstração" });
    }
  });

  app.get("/api/leads", authMiddleware, async (req, res) => {
    try {
      const { status, source, location, search, page, limit, sortBy, sortOrder, paginated } = req.query;
      
      const leads = await storage.getLeads({
        status: status as string | undefined,
        source: source as string | undefined,
        location: location as string | undefined,
        search: search as string | undefined,
      });
      
      // Sort leads by score/date
      let sortedLeads = [...leads];
      const allowedSortFields = ['aiScore', 'createdAt', 'updatedAt', 'price'];
      const sortField = allowedSortFields.includes(sortBy as string) ? (sortBy as string) : 'createdAt';
      const isAscending = (sortOrder as string) === 'asc';
      
      sortedLeads.sort((a: any, b: any) => {
        let comparison = 0;
        if (sortField === 'aiScore') {
          comparison = (a.aiScore || 0) - (b.aiScore || 0);
        } else if (sortField === 'price') {
          comparison = (a.price || 0) - (b.price || 0);
        } else if (sortField === 'createdAt' || sortField === 'updatedAt') {
          const dateA = new Date(a[sortField] || 0).getTime();
          const dateB = new Date(b[sortField] || 0).getTime();
          comparison = dateA - dateB;
        }
        return isAscending ? comparison : -comparison;
      });
      
      // Set cache headers for better performance
      res.set('Cache-Control', 'private, max-age=30');
      
      // If pagination is explicitly requested, return paginated response
      if (paginated === 'true' || page || limit) {
        const pageNum = Math.max(1, parseInt(page as string) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50));
        const offset = (pageNum - 1) * limitNum;
        
        const paginatedLeads = sortedLeads.slice(offset, offset + limitNum);
        const totalPages = Math.ceil(sortedLeads.length / limitNum);
        
        return res.json({
          leads: paginatedLeads,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: sortedLeads.length,
            totalPages,
            hasMore: pageNum < totalPages,
          }
        });
      }
      
      // Default: return simple array for backward compatibility
      res.json(sortedLeads);
    } catch (error: any) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/:id", authMiddleware, async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error: any) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  });

  app.patch("/api/leads/:id", authMiddleware, async (req, res) => {
    try {
      const { createdAt, updatedAt, id, aiScore, aiReasoning, ...safeUpdates } = req.body;
      const updates = insertLeadSchema.partial().parse(safeUpdates);
      const lead = await storage.updateLead(req.params.id, updates);
      
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      if (updates.status) {
        await storage.createInteraction({
          leadId: lead.id,
          type: "status_change",
          content: `Estado alterado para: ${updates.status}`,
        });
      }

      res.json(lead);
    } catch (error: any) {
      console.error("Error updating lead:", error);
      res.status(400).json({ error: error.message || "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", authMiddleware, async (req, res) => {
    try {
      const deleted = await storage.deleteLead(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  app.get("/api/leads/:id/interactions", authMiddleware, async (req, res) => {
    try {
      const interactions = await storage.getInteractionsByLead(req.params.id);
      res.json(interactions);
    } catch (error: any) {
      console.error("Error fetching interactions:", error);
      res.status(500).json({ error: "Failed to fetch interactions" });
    }
  });

  // Get all interactions (for CRM module)
  app.get("/api/interactions", authMiddleware, async (req, res) => {
    try {
      const interactions = await storage.getAllInteractions();
      res.json(interactions);
    } catch (error: any) {
      console.error("Error fetching all interactions:", error);
      res.status(500).json({ error: "Failed to fetch interactions" });
    }
  });

  // Create a new interaction (for CRM module)
  app.post("/api/interactions", authMiddleware, async (req, res) => {
    try {
      const validatedData = insertInteractionSchema.parse(req.body);
      const interaction = await storage.createInteraction(validatedData);
      res.json(interaction);
    } catch (error: any) {
      console.error("Error creating interaction:", error);
      res.status(400).json({ error: error.message || "Failed to create interaction" });
    }
  });

  app.post("/api/message-templates", authMiddleware, async (req, res) => {
    try {
      const validatedData = insertMessageTemplateSchema.parse(req.body);
      const template = await storage.createMessageTemplate(validatedData);
      res.json(template);
    } catch (error: any) {
      console.error("Error creating template:", error);
      res.status(400).json({ error: error.message || "Failed to create template" });
    }
  });

  app.get("/api/message-templates", async (req, res) => {
    try {
      const templates = await storage.getMessageTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.get("/api/message-templates/:id", async (req, res) => {
    try {
      const template = await storage.getMessageTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error: any) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  app.patch("/api/message-templates/:id", async (req, res) => {
    try {
      const updates = insertMessageTemplateSchema.partial().parse(req.body);
      const template = await storage.updateMessageTemplate(req.params.id, updates);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error: any) {
      console.error("Error updating template:", error);
      res.status(400).json({ error: error.message || "Failed to update template" });
    }
  });

  app.delete("/api/message-templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteMessageTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting template:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  app.post("/api/calendar-events", async (req, res) => {
    try {
      const validatedData = insertCalendarEventSchema.parse(req.body);
      
      // Check plan restrictions for visit scheduling
      const customerId = req.body.customerId || req.headers['x-customer-id'];
      if (customerId && validatedData.eventType === "visita") {
        const subscriptions = await storage.getSubscriptions({ customerId: customerId as string, status: "active" });
        const activeSubscription = subscriptions[0];
        const planId = activeSubscription?.planId || "basic";
        
        if (!canScheduleVisits(planId)) {
          return res.status(403).json({ 
            error: "Plano não permite marcação de visitas",
            message: VISIT_RESTRICTION_MESSAGE,
            upgradeRequired: true
          });
        }
      }
      
      const event = await storage.createCalendarEvent(validatedData);

      if (event.leadId) {
        await storage.createInteraction({
          leadId: event.leadId,
          type: "note",
          content: `Visita agendada: ${event.title}`,
          metadata: { eventId: event.id },
        });
      }

      res.json(event);
    } catch (error: any) {
      console.error("Error creating event:", error);
      res.status(400).json({ error: error.message || "Failed to create event" });
    }
  });

  app.get("/api/calendar-events", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const events = await storage.getCalendarEvents({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/calendar-events/:id", async (req, res) => {
    try {
      const event = await storage.getCalendarEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error: any) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.patch("/api/calendar-events/:id", async (req, res) => {
    try {
      const updates = insertCalendarEventSchema.partial().parse(req.body);
      const event = await storage.updateCalendarEvent(req.params.id, updates);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error: any) {
      console.error("Error updating event:", error);
      res.status(400).json({ error: error.message || "Failed to update event" });
    }
  });

  app.delete("/api/calendar-events/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCalendarEvent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // Google Calendar Per-User OAuth Integration Endpoints
  app.get("/api/google-calendar/status", authMiddleware, async (req, res) => {
    try {
      const customerId = req.customerId!;
      const connected = await isCustomerCalendarConnected(customerId);
      const configured = isGoogleOAuthConfigured();
      res.json({ connected, configured });
    } catch (error: any) {
      console.error("Error checking Google Calendar status:", error);
      res.json({ connected: false, configured: false, error: error.message });
    }
  });

  app.get("/api/google-calendar/auth-url", authMiddleware, async (req, res) => {
    try {
      if (!isGoogleOAuthConfigured()) {
        return res.status(400).json({ error: "Google OAuth não está configurado. Contacte o administrador." });
      }
      
      const customerId = req.customerId!;
      const authUrl = getGoogleAuthUrl(customerId);
      res.json({ authUrl });
    } catch (error: any) {
      console.error("Error generating Google auth URL:", error);
      res.status(500).json({ error: error.message || "Erro ao gerar URL de autorização" });
    }
  });

  app.get("/api/google-calendar/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        console.log("[GoogleCalendar] Missing code or state in callback");
        return res.redirect("/dashboard?google_error=missing_params");
      }
      
      const { customerId, valid } = validateSignedState(state as string);
      
      if (!valid) {
        console.log("[GoogleCalendar] Invalid or expired state in callback");
        return res.redirect("/dashboard?google_error=invalid_state");
      }
      
      const customerExists = await storage.getCustomer(customerId);
      if (!customerExists) {
        console.log("[GoogleCalendar] Customer not found:", customerId);
        return res.redirect("/dashboard?google_error=customer_not_found");
      }
      
      const success = await handleGoogleCallback(code as string, customerId);
      
      if (success) {
        res.redirect("/dashboard?google_connected=true");
      } else {
        res.redirect("/dashboard?google_error=auth_failed");
      }
    } catch (error: any) {
      console.error("Error in Google OAuth callback:", error);
      res.redirect("/dashboard?google_error=callback_failed");
    }
  });

  app.post("/api/google-calendar/disconnect", authMiddleware, async (req, res) => {
    try {
      const customerId = req.customerId!;
      await disconnectCalendar(customerId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error disconnecting Google Calendar:", error);
      res.status(500).json({ error: error.message || "Erro ao desconectar" });
    }
  });

  app.get("/api/google-calendar/events", authMiddleware, async (req, res) => {
    try {
      const customerId = req.customerId!;
      const connected = await isCustomerCalendarConnected(customerId);
      if (!connected) {
        return res.status(400).json({ error: "Google Calendar não está conectado" });
      }

      const { timeMin, timeMax, maxResults } = req.query;
      const events = await listEventsForCustomer(
        customerId,
        timeMin ? new Date(timeMin as string) : undefined,
        timeMax ? new Date(timeMax as string) : undefined,
        maxResults ? parseInt(maxResults as string) : 50
      );
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching Google Calendar events:", error);
      res.status(500).json({ error: error.message || "Erro ao obter eventos" });
    }
  });

  app.post("/api/google-calendar/events", authMiddleware, async (req, res) => {
    try {
      const customerId = req.customerId!;
      const connected = await isCustomerCalendarConnected(customerId);
      if (!connected) {
        return res.status(400).json({ error: "Google Calendar não está conectado" });
      }

      const { title, description, startTime, endTime, location, attendees } = req.body;
      
      if (!title || !startTime || !endTime) {
        return res.status(400).json({ error: "Título, data de início e data de fim são obrigatórios" });
      }

      const event = await createEventForCustomer(customerId, {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        attendees,
      });
      
      res.json(event);
    } catch (error: any) {
      console.error("Error creating Google Calendar event:", error);
      res.status(500).json({ error: error.message || "Erro ao criar evento" });
    }
  });

  app.patch("/api/google-calendar/events/:eventId", authMiddleware, async (req, res) => {
    try {
      const customerId = req.customerId!;
      const connected = await isCustomerCalendarConnected(customerId);
      if (!connected) {
        return res.status(400).json({ error: "Google Calendar não está conectado" });
      }

      const { eventId } = req.params;
      const updates = req.body;

      if (updates.startTime) updates.startTime = new Date(updates.startTime);
      if (updates.endTime) updates.endTime = new Date(updates.endTime);

      const event = await updateEventForCustomer(customerId, eventId, updates);
      res.json(event);
    } catch (error: any) {
      console.error("Error updating Google Calendar event:", error);
      res.status(500).json({ error: error.message || "Erro ao atualizar evento" });
    }
  });

  app.delete("/api/google-calendar/events/:eventId", authMiddleware, async (req, res) => {
    try {
      const customerId = req.customerId!;
      const connected = await isCustomerCalendarConnected(customerId);
      if (!connected) {
        return res.status(400).json({ error: "Google Calendar não está conectado" });
      }

      const { eventId } = req.params;
      await deleteEventForCustomer(customerId, eventId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting Google Calendar event:", error);
      res.status(500).json({ error: error.message || "Erro ao eliminar evento" });
    }
  });

  app.post("/api/google-calendar/freebusy", authMiddleware, async (req, res) => {
    try {
      const customerId = req.customerId!;
      const connected = await isCustomerCalendarConnected(customerId);
      if (!connected) {
        return res.status(400).json({ error: "Google Calendar não está conectado" });
      }

      const { timeMin, timeMax } = req.body;
      
      if (!timeMin || !timeMax) {
        return res.status(400).json({ error: "Datas de início e fim são obrigatórias" });
      }

      const busy = await getFreeBusyForCustomer(customerId, new Date(timeMin), new Date(timeMax));
      res.json(busy);
    } catch (error: any) {
      console.error("Error getting free/busy:", error);
      res.status(500).json({ error: error.message || "Erro ao verificar disponibilidade" });
    }
  });

  app.get("/api/reports/daily", async (req, res) => {
    try {
      const allLeads = await storage.getLeads();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayLeads = allLeads.filter(
        lead => lead.createdAt >= today
      );

      const leadsByStatus = {
        quente: allLeads.filter(l => l.status === "quente").length,
        morno: allLeads.filter(l => l.status === "morno").length,
        frio: allLeads.filter(l => l.status === "frio").length,
      };

      const leadsBySource = allLeads.reduce((acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const upcomingEvents = await storage.getCalendarEvents({
        startDate: new Date(),
      });

      res.json({
        summary: {
          totalLeads: allLeads.length,
          newLeadsToday: todayLeads.length,
          leadsByStatus,
          leadsBySource,
          upcomingVisits: upcomingEvents.filter(e => e.status === "scheduled").length,
        },
        todayLeads,
        upcomingEvents: upcomingEvents.slice(0, 10),
      });
    } catch (error: any) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.get("/api/casafari/search", async (req, res) => {
    try {
      const params: CasafariSearchParams = {
        location: req.query.location as string | undefined,
        propertyType: req.query.propertyType as string | undefined,
        transactionType: req.query.transactionType as "sale" | "rent" | undefined,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        minArea: req.query.minArea ? Number(req.query.minArea) : undefined,
        maxArea: req.query.maxArea ? Number(req.query.maxArea) : undefined,
        bedrooms: req.query.bedrooms ? Number(req.query.bedrooms) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        offset: req.query.offset ? Number(req.query.offset) : 0,
      };

      const result = await casafariService.searchProperties(params);
      res.json(result);
    } catch (error: any) {
      console.error("Error searching Casafari:", error);
      res.status(500).json({ error: "Failed to search properties" });
    }
  });

  // Idealista API endpoint
  app.get("/api/idealista/search", async (req, res) => {
    try {
      const params = {
        location: req.query.location as string | undefined,
        propertyType: req.query.propertyType as string | undefined,
        operation: req.query.operation as "sale" | "rent" | undefined,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        minSize: req.query.minSize ? Number(req.query.minSize) : undefined,
        maxSize: req.query.maxSize ? Number(req.query.maxSize) : undefined,
        bedrooms: req.query.bedrooms ? Number(req.query.bedrooms) : undefined,
      };

      const properties = await searchIdealista(params);
      res.json({
        properties,
        total: properties.length,
        page: 1,
        pageSize: properties.length,
        hasMore: false,
      });
    } catch (error: any) {
      console.error("Error searching Idealista:", error);
      res.status(500).json({ error: "Failed to search Idealista properties" });
    }
  });

  app.get("/api/casafari/properties/:id", async (req, res) => {
    try {
      const property = await casafariService.getPropertyById(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.json(property);
    } catch (error: any) {
      console.error("Error fetching property:", error);
      res.status(500).json({ error: "Failed to fetch property" });
    }
  });

  app.post("/api/casafari/import/:id", async (req, res) => {
    try {
      const property = await casafariService.getPropertyById(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      const leadData = await casafariService.convertToLead(property);
      
      const aiAnalysis = await analyzeLeadWithAI({
        name: leadData.name,
        property: leadData.property,
        propertyType: leadData.propertyType as any,
        location: leadData.location,
        price: leadData.price,
        contact: leadData.contact,
        source: leadData.source as any,
      });

      const lead = await storage.createLead({
        ...leadData,
        email: leadData.email || undefined,
        propertyType: leadData.propertyType as any,
        source: "Casafari",
        status: aiAnalysis.status,
        qualification: "pendente_visita",
        aiScore: aiAnalysis.score,
        aiReasoning: aiAnalysis.reasoning,
      });

      await storage.createInteraction({
        leadId: lead.id,
        type: "note",
        content: `Lead importado da Casafari: ${property.sourceUrl}`,
        metadata: { casafariId: property.id, aiAnalysis },
      });

      res.json(lead);
    } catch (error: any) {
      console.error("Error importing from Casafari:", error);
      res.status(500).json({ error: "Failed to import property" });
    }
  });

  app.get("/api/payments/plans", async (_req, res) => {
    try {
      const plans = paymentService.getPlans();
      res.json(plans);
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  });

  app.post("/api/payments/initiate", async (req, res) => {
    try {
      const paymentRequest: PaymentRequest = {
        planId: req.body.planId,
        customerName: req.body.customerName,
        customerEmail: req.body.customerEmail,
        customerPhone: req.body.customerPhone,
        paymentMethod: req.body.paymentMethod,
      };

      const result = await paymentService.initiatePayment(paymentRequest);
      res.json(result);
    } catch (error: any) {
      console.error("Error initiating payment:", error);
      res.status(500).json({ error: "Failed to initiate payment" });
    }
  });

  app.get("/api/payments/status/:paymentId", async (req, res) => {
    try {
      const result = await paymentService.checkPaymentStatus(req.params.paymentId);
      res.json(result);
    } catch (error: any) {
      console.error("Error checking payment status:", error);
      res.status(500).json({ error: "Failed to check payment status" });
    }
  });

  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const result = await paymentService.processWebhook(req.body);
      res.json(result);
    } catch (error: any) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  app.get("/api/whatsapp/templates", async (_req, res) => {
    try {
      const templates = whatsappService.getTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching WhatsApp templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/whatsapp/generate-message", async (req, res) => {
    try {
      const params: GenerateMessageParams = {
        leadName: req.body.leadName,
        propertyDescription: req.body.propertyDescription,
        propertyLocation: req.body.propertyLocation,
        propertyPrice: req.body.propertyPrice,
        leadStatus: req.body.leadStatus,
        messageType: req.body.messageType,
        agentName: req.body.agentName,
      };

      const message = await whatsappService.generateAIMessage(params);
      res.json({ message });
    } catch (error: any) {
      console.error("Error generating WhatsApp message:", error);
      res.status(500).json({ error: "Failed to generate message" });
    }
  });

  app.post("/api/whatsapp/send", async (req, res) => {
    try {
      const { leadId, phoneNumber, message } = req.body;
      
      const formattedPhone = whatsappService.formatPhoneNumber(phoneNumber);
      const result = await whatsappService.sendMessage(formattedPhone, message);

      if (leadId) {
        await storage.createInteraction({
          leadId,
          type: "whatsapp",
          content: message,
          metadata: { messageId: result.id, status: result.status },
        });
      }

      res.json(result);
    } catch (error: any) {
      console.error("Error sending WhatsApp message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.post("/api/leads/:id/send-whatsapp", async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      const messageType = req.body.messageType || "first_contact";
      const agentName = req.body.agentName || "Agente ImoLead";

      const message = await whatsappService.generateAIMessage({
        leadName: lead.name,
        propertyDescription: lead.property,
        propertyLocation: lead.location,
        propertyPrice: lead.price,
        leadStatus: lead.status as "quente" | "morno" | "frio",
        messageType,
        agentName,
      });

      const formattedPhone = whatsappService.formatPhoneNumber(lead.contact);
      const result = await whatsappService.sendMessage(formattedPhone, message);

      await storage.createInteraction({
        leadId: lead.id,
        type: "whatsapp",
        content: message,
        metadata: { messageId: result.id, status: result.status, messageType },
      });

      res.json({ ...result, message });
    } catch (error: any) {
      console.error("Error sending WhatsApp to lead:", error);
      res.status(500).json({ error: "Failed to send WhatsApp message" });
    }
  });

  // ============ ADMIN: Customers API ============
  app.get("/api/admin/customers", async (req, res) => {
    try {
      const { status, search } = req.query;
      const customers = await storage.getCustomers({
        status: status as string | undefined,
        search: search as string | undefined,
      });
      res.json(customers);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/admin/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error: any) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.post("/api/admin/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.json(customer);
    } catch (error: any) {
      console.error("Error creating customer:", error);
      res.status(400).json({ error: error.message || "Failed to create customer" });
    }
  });

  app.patch("/api/admin/customers/:id", async (req, res) => {
    try {
      const updates = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, updates);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error: any) {
      console.error("Error updating customer:", error);
      res.status(400).json({ error: error.message || "Failed to update customer" });
    }
  });

  app.delete("/api/admin/customers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCustomer(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // ============ ADMIN: Subscriptions API ============
  app.get("/api/admin/subscriptions", async (req, res) => {
    try {
      const { customerId, status, planId } = req.query;
      const subscriptions = await storage.getSubscriptions({
        customerId: customerId as string | undefined,
        status: status as string | undefined,
        planId: planId as string | undefined,
      });
      res.json(subscriptions);
    } catch (error: any) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/admin/subscriptions/:id", async (req, res) => {
    try {
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error: any) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  app.post("/api/admin/subscriptions", async (req, res) => {
    try {
      const validatedData = insertSubscriptionSchema.parse(req.body);
      const subscription = await storage.createSubscription(validatedData);
      res.json(subscription);
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(400).json({ error: error.message || "Failed to create subscription" });
    }
  });

  app.patch("/api/admin/subscriptions/:id", async (req, res) => {
    try {
      const subscription = await storage.updateSubscription(req.params.id, req.body);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error: any) {
      console.error("Error updating subscription:", error);
      res.status(400).json({ error: error.message || "Failed to update subscription" });
    }
  });

  app.post("/api/admin/subscriptions/:id/cancel", async (req, res) => {
    try {
      const subscription = await storage.cancelSubscription(req.params.id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  // ============ ADMIN: Payments API ============
  app.get("/api/admin/payments", async (req, res) => {
    try {
      const { customerId, subscriptionId, status, paymentMethod, startDate, endDate } = req.query;
      const payments = await storage.getPayments({
        customerId: customerId as string | undefined,
        subscriptionId: subscriptionId as string | undefined,
        status: status as string | undefined,
        paymentMethod: paymentMethod as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });
      res.json(payments);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.get("/api/admin/payments/stats", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const stats = await storage.getPaymentStats(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching payment stats:", error);
      res.status(500).json({ error: "Failed to fetch payment stats" });
    }
  });

  app.get("/api/admin/payments/:id", async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error: any) {
      console.error("Error fetching payment:", error);
      res.status(500).json({ error: "Failed to fetch payment" });
    }
  });

  app.post("/api/admin/payments", async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      res.json(payment);
    } catch (error: any) {
      console.error("Error creating payment:", error);
      res.status(400).json({ error: error.message || "Failed to create payment" });
    }
  });

  app.patch("/api/admin/payments/:id", async (req, res) => {
    try {
      const payment = await storage.updatePayment(req.params.id, req.body);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error: any) {
      console.error("Error updating payment:", error);
      res.status(400).json({ error: error.message || "Failed to update payment" });
    }
  });

  app.post("/api/admin/payments/:id/refund", async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      if (payment.status !== "completed") {
        return res.status(400).json({ error: "Only completed payments can be refunded" });
      }

      const refundAmount = req.body.amount || payment.amount;
      const updatedPayment = await storage.updatePayment(req.params.id, {
        status: "refunded",
        refundedAt: new Date(),
        refundAmount,
      });

      res.json(updatedPayment);
    } catch (error: any) {
      console.error("Error refunding payment:", error);
      res.status(500).json({ error: "Failed to refund payment" });
    }
  });

  // ============ ADMIN: Dashboard Overview ============
  app.get("/api/admin/dashboard", async (_req, res) => {
    try {
      const customers = await storage.getCustomers({ status: "active" });
      const subscriptions = await storage.getSubscriptions({ status: "active" });
      const paymentStats = await storage.getPaymentStats();
      
      const monthlyRecurringRevenue = subscriptions.reduce((sum, sub) => sum + sub.price, 0);

      res.json({
        totalCustomers: customers.length,
        activeSubscriptions: subscriptions.length,
        monthlyRecurringRevenue,
        ...paymentStats,
      });
    } catch (error: any) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // ============ STRIPE: Products & Prices ============
  app.get("/api/stripe/config", async (_req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error: any) {
      console.error("Error fetching Stripe config:", error);
      res.status(500).json({ error: "Failed to fetch Stripe configuration" });
    }
  });

  app.get("/api/stripe/products", async (_req, res) => {
    try {
      const products = await stripeService.listProducts();
      res.json({ data: products });
    } catch (error: any) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/stripe/products-with-prices", async (_req, res) => {
    try {
      const rows = await stripeService.listProductsWithPrices();
      
      const productsMap = new Map();
      for (const row of rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
            metadata: row.price_metadata,
          });
        }
      }

      res.json({ data: Array.from(productsMap.values()) });
    } catch (error: any) {
      console.error("Error fetching products with prices:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/stripe/prices", async (_req, res) => {
    try {
      const prices = await stripeService.listPrices();
      res.json({ data: prices });
    } catch (error: any) {
      console.error("Error fetching prices:", error);
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });

  app.get("/api/stripe/products/:productId/prices", async (req, res) => {
    try {
      const { productId } = req.params;
      const product = await stripeService.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      const prices = await stripeService.getPricesForProduct(productId);
      res.json({ data: prices });
    } catch (error: any) {
      console.error("Error fetching product prices:", error);
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });

  app.post("/api/stripe/checkout", async (req, res) => {
    try {
      const { priceId, customerEmail, customerName, successUrl, cancelUrl } = req.body;
      
      if (!priceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }

      const customer = await stripeService.createCustomer(
        customerEmail || "customer@example.com",
        customerName || "Customer"
      );

      const isBasicPlan = await stripeService.isPriceBasicPlan(priceId);
      const trialDays = isBasicPlan ? 7 : undefined;

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripeService.createCheckoutSession(
        customer.id,
        priceId,
        successUrl || `${baseUrl}/checkout/success`,
        cancelUrl || `${baseUrl}/checkout/cancel`,
        'subscription',
        trialDays
      );

      res.json({ url: session.url, sessionId: session.id, hasTrial: isBasicPlan });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/stripe/customer-portal", async (req, res) => {
    try {
      const { customerId, returnUrl } = req.body;
      
      if (!customerId) {
        return res.status(400).json({ error: "Customer ID is required" });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripeService.createCustomerPortalSession(
        customerId,
        returnUrl || `${baseUrl}/dashboard`
      );

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating customer portal session:", error);
      res.status(500).json({ error: "Failed to create customer portal session" });
    }
  });

  // ==================== Automation API Routes ====================

  // Get automation settings for a customer
  app.get("/api/automation-settings/:customerId", authMiddleware, async (req, res) => {
    try {
      // Tenant isolation: users can only access their own automation settings
      if (req.customerId !== req.params.customerId) {
        return res.status(403).json({ error: "Acesso não autorizado" });
      }
      
      const settings = await storage.getAutomationSettings(req.params.customerId);
      res.json(settings);
    } catch (error: any) {
      console.error("Error fetching automation settings:", error);
      res.status(500).json({ error: "Failed to fetch automation settings" });
    }
  });

  // Create or update automation settings
  app.post("/api/automation-settings", authMiddleware, async (req, res) => {
    try {
      const { customerId, ...settingsData } = req.body;
      if (!customerId) {
        return res.status(400).json({ error: "Customer ID is required" });
      }
      
      // Tenant isolation: users can only create/update their own automation settings
      if (req.customerId !== customerId) {
        return res.status(403).json({ error: "Acesso não autorizado" });
      }
      
      // Plan enforcement: autoContactNewLeads is Pro-only
      const customer = await storage.getCustomer(customerId);
      if (settingsData.autoContactNewLeads && customer?.plan !== "pro") {
        settingsData.autoContactNewLeads = false;
      }
      
      const settings = await storage.createOrUpdateAutomationSettings({ ...settingsData, customerId });
      res.json(settings);
    } catch (error: any) {
      console.error("Error saving automation settings:", error);
      res.status(400).json({ error: error.message || "Failed to save automation settings" });
    }
  });

  // Update automation settings
  app.patch("/api/automation-settings/:customerId", authMiddleware, async (req, res) => {
    try {
      // Tenant isolation: users can only modify their own automation settings
      if (req.customerId !== req.params.customerId) {
        return res.status(403).json({ error: "Acesso não autorizado" });
      }
      
      // Plan enforcement: autoContactNewLeads is Pro-only
      const customer = await storage.getCustomer(req.params.customerId);
      if (req.body.autoContactNewLeads && customer?.plan !== "pro") {
        req.body.autoContactNewLeads = false;
      }
      
      const settings = await storage.createOrUpdateAutomationSettings({ ...req.body, customerId: req.params.customerId });
      res.json(settings);
    } catch (error: any) {
      console.error("Error updating automation settings:", error);
      res.status(400).json({ error: error.message || "Failed to update automation settings" });
    }
  });

  // Get pending message jobs
  app.get("/api/message-jobs", authMiddleware, async (req, res) => {
    try {
      const jobs = await storage.getPendingMessageJobs();
      res.json(jobs);
    } catch (error: any) {
      console.error("Error fetching message jobs:", error);
      res.status(500).json({ error: "Failed to fetch message jobs" });
    }
  });

  // Get message jobs for a specific lead
  app.get("/api/leads/:id/message-jobs", authMiddleware, async (req, res) => {
    try {
      const jobs = await storage.getMessageJobsForLead(req.params.id);
      res.json(jobs);
    } catch (error: any) {
      console.error("Error fetching message jobs:", error);
      res.status(500).json({ error: "Failed to fetch message jobs" });
    }
  });

  // Create a new message job
  app.post("/api/message-jobs", authMiddleware, async (req, res) => {
    try {
      const job = await storage.createMessageJob(req.body);
      res.json(job);
    } catch (error: any) {
      console.error("Error creating message job:", error);
      res.status(400).json({ error: error.message || "Failed to create message job" });
    }
  });

  // Update message job status
  app.patch("/api/message-jobs/:id", authMiddleware, async (req, res) => {
    try {
      const job = await storage.updateMessageJob(req.params.id, req.body);
      if (!job) {
        return res.status(404).json({ error: "Message job not found" });
      }
      res.json(job);
    } catch (error: any) {
      console.error("Error updating message job:", error);
      res.status(400).json({ error: error.message || "Failed to update message job" });
    }
  });

  // Cancel a message job
  app.post("/api/message-jobs/:id/cancel", authMiddleware, async (req, res) => {
    try {
      const job = await storage.updateMessageJob(req.params.id, { 
        status: 'cancelled'
      });
      if (!job) {
        return res.status(404).json({ error: "Message job not found" });
      }
      res.json(job);
    } catch (error: any) {
      console.error("Error cancelling message job:", error);
      res.status(500).json({ error: "Failed to cancel message job" });
    }
  });

  // Get usage ledger for a customer
  app.get("/api/usage/:customerId", authMiddleware, async (req, res) => {
    try {
      // Tenant isolation: users can only access their own usage data
      if (req.customerId !== req.params.customerId) {
        return res.status(403).json({ error: "Acesso não autorizado" });
      }
      
      const { period } = req.query;
      const entries = await storage.getUsageByCustomer(
        req.params.customerId,
        period as string | undefined
      );
      res.json(entries);
    } catch (error: any) {
      console.error("Error fetching usage data:", error);
      res.status(500).json({ error: "Failed to fetch usage data" });
    }
  });

  // Get usage summary for a customer (aggregated by type)
  app.get("/api/usage/:customerId/summary", authMiddleware, async (req, res) => {
    try {
      // Tenant isolation: users can only access their own usage summary
      if (req.customerId !== req.params.customerId) {
        return res.status(403).json({ error: "Acesso não autorizado" });
      }
      
      const { period } = req.query;
      const entries = await storage.getUsageByCustomer(
        req.params.customerId,
        period as string | undefined
      );
      
      const summary: Record<string, { count: number; totalUnits: number; totalCost: number }> = {};
      entries.forEach((entry: any) => {
        if (!summary[entry.metric]) {
          summary[entry.metric] = { count: 0, totalUnits: 0, totalCost: 0 };
        }
        summary[entry.metric].count++;
        summary[entry.metric].totalUnits += entry.quantity || 1;
      });
      
      res.json(summary);
    } catch (error: any) {
      console.error("Error fetching usage summary:", error);
      res.status(500).json({ error: "Failed to fetch usage summary" });
    }
  });

  // Record usage entry
  app.post("/api/usage", authMiddleware, async (req, res) => {
    try {
      const entry = await storage.createUsageRecord(req.body);
      res.json(entry);
    } catch (error: any) {
      console.error("Error recording usage:", error);
      res.status(400).json({ error: error.message || "Failed to record usage" });
    }
  });

  // Trigger automation processing (for testing/manual trigger)
  app.post("/api/automation/process", authMiddleware, async (req, res) => {
    try {
      const { startScheduler } = await import('./services/schedulerService');
      startScheduler();
      res.json({ success: true, message: "Automation processing triggered" });
    } catch (error: any) {
      console.error("Error triggering automation:", error);
      res.status(500).json({ error: "Failed to trigger automation" });
    }
  });

  // Test Casafari connection (for configuration)
  app.post("/api/automation/test-casafari", authMiddleware, async (req, res) => {
    try {
      // Casafari requires an API key to be configured
      const isConfigured = !!process.env.CASAFARI_API_KEY;
      res.json({ 
        configured: isConfigured,
        message: isConfigured ? "Casafari API is configured" : "Casafari API key not configured"
      });
    } catch (error: any) {
      console.error("Error testing Casafari:", error);
      res.status(500).json({ error: "Failed to test Casafari connection" });
    }
  });

  // Test email configuration
  app.post("/api/automation/test-email", authMiddleware, async (req, res) => {
    try {
      // Check if email service is configured via environment variables
      const hasSendGrid = !!process.env.SENDGRID_API_KEY;
      const hasResend = !!process.env.RESEND_API_KEY;
      const hasSmtp = !!process.env.SMTP_HOST;
      const isConfigured = hasSendGrid || hasResend || hasSmtp;
      const provider = hasSendGrid ? 'sendgrid' : hasResend ? 'resend' : hasSmtp ? 'smtp' : null;
      res.json({
        configured: isConfigured,
        provider,
        message: isConfigured ? `Email configured with ${provider}` : "Email service not configured"
      });
    } catch (error: any) {
      console.error("Error testing email:", error);
      res.status(500).json({ error: "Failed to test email configuration" });
    }
  });

  // Run immediate lead search - searches all configured sources and creates leads
  const runSearchSchema = z.object({
    locations: z.array(z.string()).optional().default(["Lisboa"]),
    propertyTypes: z.array(z.string()).optional().default(["Apartamento"]),
    priceMin: z.number().optional().default(100000),
    priceMax: z.number().optional().default(500000),
    sources: z.array(z.enum(["casafari", "idealista", "olx"])).optional(),
  });

  app.post("/api/automation/run-search", authMiddleware, async (req, res) => {
    try {
      const customerId = req.customerId;
      if (!customerId) {
        return res.status(401).json({ error: "Customer ID required" });
      }

      const parseResult = runSearchSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request parameters", details: parseResult.error.format() });
      }
      
      const { locations, propertyTypes, priceMin, priceMax, sources } = parseResult.data;
      
      const { searchCasafari, convertToLead, analyzeListingWithAI, checkDuplicateLead } = await import('./services/casafariService');
      const { searchIdealista } = await import('./lib/idealista');
      const { searchOLX } = await import('./lib/olx');
      
      const searchParams = {
        location: locations[0],
        priceMin: priceMin,
        priceMax: priceMax,
        propertyType: propertyTypes[0],
      };

      const allListings: any[] = [];
      const searchResults: { source: string; found: number; added: number; error?: string }[] = [];

      // Search Casafari
      if (!sources || sources.includes("casafari")) {
        const casafariApiKey = process.env.CASAFARI_API_KEY;
        const { listings, error } = await searchCasafari(searchParams, casafariApiKey);
        if (error) {
          searchResults.push({ source: "Casafari", found: 0, added: 0, error });
        } else {
          allListings.push(...listings.map(l => ({ ...l, source: "Casafari" })));
          searchResults.push({ source: "Casafari", found: listings.length, added: 0 });
        }
      }

      // Search Idealista
      if (!sources || sources.includes("idealista")) {
        try {
          const idealistaListings = await searchIdealista({
            location: searchParams.location,
            propertyType: searchParams.propertyType?.toLowerCase(),
            operation: "sale",
            minPrice: searchParams.priceMin,
            maxPrice: searchParams.priceMax,
          });
          allListings.push(...idealistaListings.map(l => ({ ...l, source: "Idealista" })));
          searchResults.push({ source: "Idealista", found: idealistaListings.length, added: 0 });
        } catch (error: any) {
          searchResults.push({ source: "Idealista", found: 0, added: 0, error: error.message });
        }
      }

      // Search OLX
      if (!sources || sources.includes("olx")) {
        try {
          const olxListings = await searchOLX({
            location: searchParams.location,
            propertyType: searchParams.propertyType,
            minPrice: searchParams.priceMin,
            maxPrice: searchParams.priceMax,
          });
          allListings.push(...olxListings.map(l => ({ ...l, source: "OLX" })));
          searchResults.push({ source: "OLX", found: olxListings.length, added: 0 });
        } catch (error: any) {
          searchResults.push({ source: "OLX", found: 0, added: 0, error: error.message });
        }
      }

      // Get existing leads to check for duplicates
      const existingLeads = await storage.getLeadsByCustomer(customerId);
      const existingContactInfo = existingLeads.map(l => ({
        contact: l.contact,
        email: l.email || undefined,
        location: l.location,
      }));

      // Process listings and create leads
      const createdLeads: any[] = [];
      
      for (const listing of allListings) {
        const isDuplicate = await checkDuplicateLead(listing, existingContactInfo);
        if (isDuplicate) continue;

        const analysis = await analyzeListingWithAI(listing);
        
        // Only create leads with score >= 40
        if (analysis.score < 40) continue;

        const leadData = convertToLead(listing);
        const newLead = await storage.createLead({
          ...leadData,
          customerId,
          aiScore: analysis.score,
          aiReasoning: analysis.reasoning,
          status: analysis.status,
        } as any);

        createdLeads.push(newLead);
        
        // Add contact info to existing leads to prevent duplicates within this batch
        existingContactInfo.push({
          contact: newLead.contact,
          email: newLead.email || undefined,
          location: newLead.location,
        });

        // Track the lead in the appropriate search result
        const sourceResult = searchResults.find(r => r.source === listing.source);
        if (sourceResult) sourceResult.added++;
      }

      // Record usage
      await storage.createUsageRecord({
        customerId,
        metric: "leads_analyzed",
        quantity: createdLeads.length,
        period: new Date().toISOString().slice(0, 7),
        source: "manual",
      });

      res.json({
        success: true,
        message: `Pesquisa concluída! ${createdLeads.length} novos leads criados.`,
        searchResults,
        leadsCreated: createdLeads.length,
        leads: createdLeads.slice(0, 5), // Return first 5 leads for preview
      });
    } catch (error: any) {
      console.error("Error running search:", error);
      res.status(500).json({ error: error.message || "Failed to run search" });
    }
  });

  // Get automation status for a customer
  app.get("/api/automation/status/:customerId", authMiddleware, async (req, res) => {
    try {
      if (req.customerId !== req.params.customerId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const settings = await storage.getAutomationSettings(req.params.customerId);
      const leads = await storage.getLeadsByCustomer(req.params.customerId);
      
      // Get recent leads from automation
      const recentAutoLeads = leads
        .filter(l => l.aiReasoning?.includes("automaticamente"))
        .slice(0, 5);

      // Get usage stats
      const period = new Date().toISOString().slice(0, 7);
      const usage = await storage.getUsageByCustomer(req.params.customerId, period);
      const searchCount = usage.filter(u => u.metric === "leads_analyzed").reduce((a, b) => a + b.quantity, 0);

      res.json({
        enabled: settings?.enabled ?? false,
        casafariEnabled: settings?.casafariEnabled ?? false,
        schedule: settings?.casafariSchedule || "daily",
        totalLeads: leads.length,
        leadsThisMonth: searchCount,
        recentAutoLeads,
        nextScheduledRun: getNextScheduledRun(settings?.casafariSchedule || "daily"),
      });
    } catch (error: any) {
      console.error("Error getting automation status:", error);
      res.status(500).json({ error: "Failed to get automation status" });
    }
  });

  // Apify real estate search endpoint
  app.post("/api/apify/search", authMiddleware, async (req, res) => {
    try {
      const customerId = req.customerId;
      if (!customerId) {
        return res.status(401).json({ error: "Customer ID required" });
      }

      const { searchWithApify, isApifyConfigured } = await import('./lib/apify');
      const { analyzeListingWithAI, checkDuplicateLead } = await import('./services/casafariService');

      if (!isApifyConfigured()) {
        return res.status(400).json({ 
          error: "Apify não configurado",
          message: "Configure a APIFY_API_TOKEN nas definições para captar leads reais dos sites imobiliários.",
          configured: false
        });
      }

      const { location, propertyType, operation, minPrice, maxPrice, maxItems, source } = req.body;

      console.log(`[Apify Search] Starting for customer ${customerId}`, { location, source });

      const result = await searchWithApify({
        location,
        propertyType,
        operation: operation || "sale",
        minPrice,
        maxPrice,
        maxItems: maxItems || 30,
      }, source || "all");

      if (result.error && result.listings.length === 0) {
        return res.status(500).json({ error: result.error });
      }

      // Get existing leads for duplicate check
      const existingLeads = await storage.getLeadsByCustomer(customerId);
      const existingContactInfo = existingLeads.map(l => ({
        contact: l.contact,
        email: l.email || undefined,
        location: l.location,
      }));

      const createdLeads: any[] = [];
      const searchResults: { source: string; found: number; added: number }[] = [];
      const sourceCount: Record<string, { found: number; added: number }> = {};

      for (const listing of result.listings) {
        const src = listing.source || "Unknown";
        if (!sourceCount[src]) {
          sourceCount[src] = { found: 0, added: 0 };
        }
        sourceCount[src].found++;

        // Check for duplicates
        const isDuplicate = await checkDuplicateLead({
          contact: listing.contact,
          email: listing.email,
          location: listing.location,
        }, existingContactInfo);
        
        if (isDuplicate) continue;

        // Analyze with AI
        const analysis = await analyzeListingWithAI({
          title: listing.title,
          price: listing.price,
          location: listing.location,
          propertyType: listing.propertyType,
          bedrooms: listing.bedrooms,
          contact: listing.contact,
          source: listing.source,
          description: listing.description,
        });

        if (analysis.score < 40) continue;

        // Create lead
        const newLead = await storage.createLead({
          name: listing.contactName || "Proprietário",
          property: listing.title,
          propertyType: listing.propertyType,
          location: listing.location,
          price: listing.price,
          contact: listing.contact || "",
          email: listing.email || "",
          source: listing.source,
          sourceUrl: listing.url || null,
          ownerType: "particular",
          qualification: "novo",
          aiScore: analysis.score,
          aiReasoning: analysis.reasoning,
          status: analysis.status,
          notes: `Captado automaticamente via ${listing.source}`,
          customerId,
        } as any);

        createdLeads.push(newLead);
        sourceCount[src].added++;
        
        existingContactInfo.push({
          contact: newLead.contact,
          email: newLead.email || undefined,
          location: newLead.location,
        });
      }

      for (const [src, counts] of Object.entries(sourceCount)) {
        searchResults.push({ source: src, ...counts });
      }

      // Record usage
      if (createdLeads.length > 0) {
        await storage.createUsageRecord({
          customerId,
          metric: "leads_analyzed",
          quantity: createdLeads.length,
          period: new Date().toISOString().slice(0, 7),
          source: "automation",
        });
      }

      res.json({
        success: true,
        configured: true,
        message: `Pesquisa concluída! ${createdLeads.length} novos leads captados.`,
        searchResults,
        totalFound: result.listings.length,
        leadsCreated: createdLeads.length,
        leads: createdLeads.slice(0, 10),
      });
    } catch (error: any) {
      console.error("[Apify Search] Error:", error);
      res.status(500).json({ error: error.message || "Falha na pesquisa" });
    }
  });

  // Check Apify configuration status
  app.get("/api/apify/status", authMiddleware, async (req, res) => {
    const { isApifyConfigured } = await import('./lib/apify');
    res.json({
      configured: isApifyConfigured(),
      sources: ["Idealista", "Supercasa", "Imovirtual"],
    });
  });

  // Manual trigger for scheduled searches
  app.post("/api/automation/run-scheduled-search", authMiddleware, async (req, res) => {
    try {
      const customerId = req.customerId;
      if (!customerId) {
        return res.status(401).json({ error: "Autenticação necessária" });
      }

      const customer = await storage.getCustomer(customerId);
      if (!customer || !["pro", "custom", "enterprise"].includes(customer.plan || "")) {
        return res.status(403).json({ 
          error: "Esta funcionalidade requer plano Pro ou superior" 
        });
      }

      const result = await runScheduledSearchForCustomer(customerId);
      res.json(result);
    } catch (error: any) {
      console.error("[RunScheduledSearch] Error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Erro ao executar pesquisa agendada" 
      });
    }
  });

  function getNextScheduledRun(schedule: string): string {
    const now = new Date();
    const hour = now.getHours();
    
    if (schedule === "daily") {
      if (hour < 9) {
        return `Hoje às 09:00`;
      }
      return `Amanhã às 09:00`;
    } else if (schedule === "twice_daily") {
      if (hour < 9) return `Hoje às 09:00`;
      if (hour < 15) return `Hoje às 15:00`;
      return `Amanhã às 09:00`;
    } else if (schedule === "weekly") {
      const daysUntilMonday = (1 - now.getDay() + 7) % 7 || 7;
      return `Segunda-feira às 09:00`;
    }
    return `Próxima execução agendada`;
  }

  const httpServer = createServer(app);
  return httpServer;
}
