var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import { createServer } from "http";
import express2 from "express";
import path3 from "path";
import { fileURLToPath as fileURLToPath3 } from "url";
import "dotenv/config";

// server/routes.ts
import crypto from "crypto";
var createAdminToken = () => {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD must be configured");
  const timestamp2 = Date.now().toString();
  const signature = crypto.createHmac("sha256", secret).update(`admin:${timestamp2}`).digest("hex");
  return Buffer.from(`admin:${timestamp2}:${signature}`).toString("base64");
};
async function registerRoutes(app2) {
  app2.post("/api/admin/auth", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        return res.status(500).json({ error: "Admin password not configured" });
      }
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }
      const inputBuffer = Buffer.from(password.trim());
      const adminBuffer = Buffer.from(adminPassword.trim());
      const isValid = inputBuffer.length === adminBuffer.length && crypto.timingSafeEqual(inputBuffer, adminBuffer);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid password" });
      }
      const token = createAdminToken();
      return res.json({ token });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { fileURLToPath } from "url";
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import { runMigrations } from "stripe-replit-sync";

// server/lib/stripeClient.ts
import Stripe from "stripe";
var connectionSettings;
async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken) {
    throw new Error("X_REPLIT_TOKEN not found for repl/depl");
  }
  const connectorName = "stripe";
  const isProduction2 = process.env.REPLIT_DEPLOYMENT === "1";
  const targetEnvironment = isProduction2 ? "production" : "development";
  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", connectorName);
  url.searchParams.set("environment", targetEnvironment);
  const response = await fetch(url.toString(), {
    headers: {
      "Accept": "application/json",
      "X_REPLIT_TOKEN": xReplitToken
    }
  });
  const data = await response.json();
  connectionSettings = data.items?.[0];
  if (!connectionSettings || (!connectionSettings.settings.publishable || !connectionSettings.settings.secret)) {
    throw new Error(`Stripe ${targetEnvironment} connection not found`);
  }
  return {
    publishableKey: connectionSettings.settings.publishable,
    secretKey: connectionSettings.settings.secret
  };
}
async function getStripeSecretKey() {
  const { secretKey } = await getCredentials();
  return secretKey;
}
var stripeSync = null;
async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import("stripe-replit-sync");
    const secretKey = await getStripeSecretKey();
    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL,
        max: 2
      },
      stripeSecretKey: secretKey
    });
  }
  return stripeSync;
}

// server/lib/webhookHandlers.ts
var WebhookHandlers = class {
  static async processWebhook(payload, signature, uuid) {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK ERROR: Payload must be a Buffer. Received type: " + typeof payload + ". This usually means express.json() parsed the body before reaching this handler. FIX: Ensure webhook route is registered BEFORE app.use(express.json())."
      );
    }
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature, uuid);
  }
};

// server/index.ts
import cors from "cors";
import cookieParser from "cookie-parser";

// server/middleware/rateLimit.ts
import rateLimit from "express-rate-limit";
var authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  // 5 attempts per window
  message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "development"
});
var apiRateLimiter = rateLimit({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 100,
  // 100 requests per minute
  message: { error: "Demasiados pedidos. Tente novamente mais tarde." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "development"
});

// server/middleware/sanitize.ts
import sanitizeHtml from "sanitize-html";
var sanitizeConfig = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: "escape"
};
function sanitizeObject(obj) {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === "string") {
      obj[key] = sanitizeHtml(value, sanitizeConfig);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitizeObject(value);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === "string") {
          value[index] = sanitizeHtml(item, sanitizeConfig);
        } else if (typeof item === "object" && item !== null) {
          sanitizeObject(item);
        }
      });
    }
  }
}
function sanitizeInputs(req, res, next) {
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === "object") {
    sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === "object") {
    sanitizeObject(req.params);
  }
  next();
}

// server/lib/logger.ts
import winston from "winston";
var isProduction = process.env.NODE_ENV === "production";
var logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});
function logSecurityEvent(type, details) {
  logger.warn({
    type,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    ...details
  });
}
function logError(message, error) {
  logger.error({
    message,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : void 0
  });
}

// server/storage.ts
import "dotenv/config";

// server/db.ts
import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  automationSettings: () => automationSettings,
  calendarEvents: () => calendarEvents,
  chatMessages: () => chatMessages,
  configurations: () => configurations,
  customers: () => customers,
  emailVerificationTokens: () => emailVerificationTokens,
  insertAutomationSettingsSchema: () => insertAutomationSettingsSchema,
  insertCalendarEventSchema: () => insertCalendarEventSchema,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertConfigurationSchema: () => insertConfigurationSchema,
  insertCustomerSchema: () => insertCustomerSchema,
  insertInteractionSchema: () => insertInteractionSchema,
  insertLeadSchema: () => insertLeadSchema,
  insertMessageJobSchema: () => insertMessageJobSchema,
  insertMessageTemplateSchema: () => insertMessageTemplateSchema,
  insertPaymentSchema: () => insertPaymentSchema,
  insertSubscriptionSchema: () => insertSubscriptionSchema,
  insertUsageLedgerSchema: () => insertUsageLedgerSchema,
  interactionHistory: () => interactionHistory,
  interactions: () => interactions,
  leads: () => leads,
  messageJobs: () => messageJobs,
  messageTemplates: () => messageTemplates,
  passwordResetTokens: () => passwordResetTokens,
  payments: () => payments,
  qualificationEnum: () => qualificationEnum,
  subscriptions: () => subscriptions,
  usageLedger: () => usageLedger,
  usageRecords: () => usageRecords
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  property: text("property").notNull(),
  propertyType: text("property_type").notNull(),
  location: text("location").notNull(),
  price: text("price").notNull(),
  status: text("status").notNull().default("frio"),
  qualification: text("qualification").default("pendente_visita"),
  // visitado, pendente_visita, sem_resposta, meu_imovel
  ownerType: text("owner_type").default("particular"),
  // particular, profissional (agência)
  source: text("source").notNull(),
  sourceUrl: text("source_url"),
  // Link para o anúncio original
  contact: text("contact").notNull(),
  email: text("email"),
  aiScore: integer("ai_score"),
  aiReasoning: text("ai_reasoning"),
  notes: text("notes"),
  optOut: boolean("opt_out").default(false),
  customerId: varchar("customer_id"),
  lastContact: timestamp("last_contact").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var messageTemplates = pgTable("message_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subject: text("subject"),
  content: text("content").notNull(),
  category: text("category").notNull(),
  variables: jsonb("variables").$type(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  eventType: text("event_type").default("visita"),
  // visita, reuniao, chamada, outro
  status: text("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var interactionHistory = pgTable("interaction_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var configurations = pgTable("configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  company: text("company"),
  password: text("password"),
  taxId: text("tax_id"),
  // NIF in Portugal
  stripeCustomerId: text("stripe_customer_id"),
  status: text("status").notNull().default("active"),
  // active, inactive, suspended
  plan: text("plan").default("trial"),
  // trial, basic, pro
  trialEndsAt: timestamp("trial_ends_at"),
  // 7 days from registration
  emailVerified: boolean("email_verified").default(false),
  emailVerifiedAt: timestamp("email_verified_at"),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  googleTokenExpiry: timestamp("google_token_expiry"),
  googleCalendarConnected: boolean("google_calendar_connected").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  planId: text("plan_id").notNull(),
  // basic, pro, custom
  planName: text("plan_name").notNull(),
  price: integer("price").notNull(),
  // in cents (e.g., 4999 = €49.99)
  currency: text("currency").notNull().default("EUR"),
  billingCycle: text("billing_cycle").notNull().default("monthly"),
  // monthly, yearly
  status: text("status").notNull().default("active"),
  // active, cancelled, past_due, paused
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var messageJobs = pgTable("message_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  channel: text("channel").notNull(),
  // whatsapp, email
  templateId: varchar("template_id"),
  content: text("content").notNull(),
  subject: text("subject"),
  // for email
  status: text("status").notNull().default("pending"),
  // pending, sent, failed, cancelled
  trigger: text("trigger").notNull(),
  // new_lead, followup_3d, followup_7d, status_change, manual
  scheduledAt: timestamp("scheduled_at").notNull(),
  sentAt: timestamp("sent_at"),
  attempts: integer("attempts").default(0),
  lastError: text("last_error"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var usageLedger = pgTable("usage_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  metric: text("metric").notNull(),
  // messages_whatsapp, messages_email, leads_analyzed, ai_tokens, casafari_searches
  quantity: integer("quantity").notNull().default(1),
  period: text("period").notNull(),
  // YYYY-MM format
  source: text("source"),
  // automation, manual, casafari
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var automationSettings = pgTable("automation_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull().unique(),
  enabled: boolean("enabled").default(false),
  autoMessageNewLead: boolean("auto_message_new_lead").default(true),
  autoFollowup3Days: boolean("auto_followup_3_days").default(true),
  autoFollowup7Days: boolean("auto_followup_7_days").default(false),
  preferredChannel: text("preferred_channel").default("whatsapp"),
  // whatsapp, email
  quietHoursStart: integer("quiet_hours_start").default(21),
  // 21:00
  quietHoursEnd: integer("quiet_hours_end").default(9),
  // 09:00
  casafariEnabled: boolean("casafari_enabled").default(false),
  casafariSearchParams: jsonb("casafari_search_params"),
  // legacy - use searchConfig instead
  casafariSchedule: text("casafari_schedule").default("daily"),
  // daily, twice_daily, weekly
  newLeadTemplateId: varchar("new_lead_template_id"),
  followupTemplateId: varchar("followup_template_id"),
  // Enhanced search configuration
  searchEnabled: boolean("search_enabled").default(false),
  searchSources: jsonb("search_sources").$type().default(["casafari", "idealista", "olx"]),
  searchLocations: jsonb("search_locations").$type().default(["Lisboa", "Porto"]),
  searchPropertyTypes: jsonb("search_property_types").$type().default(["Apartamento", "Moradia"]),
  searchTransactionType: text("search_transaction_type").default("sale"),
  // sale, rent
  searchPriceMin: integer("search_price_min").default(1e5),
  searchPriceMax: integer("search_price_max").default(5e5),
  searchBedrooms: integer("search_bedrooms"),
  searchAreaMin: integer("search_area_min"),
  searchAreaMax: integer("search_area_max"),
  searchSchedule: text("search_schedule").default("daily"),
  // hourly, twice_daily, daily, weekly
  searchMinScore: integer("search_min_score").default(40),
  autoClassifyLeads: boolean("auto_classify_leads").default(true),
  autoContactNewLeads: boolean("auto_contact_new_leads").default(false),
  // Pro only
  lastSearchAt: timestamp("last_search_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(),
  // in cents
  currency: text("currency").notNull().default("EUR"),
  status: text("status").notNull().default("pending"),
  // pending, completed, failed, refunded
  paymentMethod: text("payment_method").notNull(),
  // mbway, card, multibanco, bank_transfer
  paymentMethodDetails: jsonb("payment_method_details"),
  // store card last 4, mbway phone, etc.
  stripePaymentId: text("stripe_payment_id"),
  description: text("description"),
  invoiceNumber: text("invoice_number"),
  paidAt: timestamp("paid_at"),
  failedAt: timestamp("failed_at"),
  failureReason: text("failure_reason"),
  refundedAt: timestamp("refunded_at"),
  refundAmount: integer("refund_amount"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(),
  // user, assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var qualificationEnum = z.enum(["visitado", "pendente_visita", "sem_resposta", "meu_imovel"]);
var insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastContact: true,
  aiScore: true,
  aiReasoning: true
}).extend({
  status: z.enum(["quente", "morno", "frio"]).optional().default("frio"),
  qualification: qualificationEnum.optional().default("pendente_visita"),
  source: z.enum(["Idealista", "Imovirtual", "Supercasa", "OLX", "Casafari", "Manual", "Importa\xE7\xE3o CSV", "Demonstra\xE7\xE3o", "Demo"]),
  propertyType: z.enum(["Apartamento", "Moradia", "Terreno", "Comercial", "Garagem", "Arrecada\xE7\xE3o", "Outro"]),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal(""))
});
var insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  category: z.enum(["inicial", "followup", "agendamento", "outro"])
});
var insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  status: z.enum(["scheduled", "completed", "cancelled"]).default("scheduled"),
  eventType: z.enum(["visita", "reuniao", "chamada", "outro"]).default("visita"),
  startTime: z.union([z.string(), z.date()]).transform((val) => typeof val === "string" ? new Date(val) : val),
  endTime: z.union([z.string(), z.date()]).transform((val) => typeof val === "string" ? new Date(val) : val)
});
var insertInteractionSchema = createInsertSchema(interactionHistory).omit({
  id: true,
  createdAt: true
}).extend({
  type: z.enum(["message_sent", "message_received", "call", "email", "note", "status_change", "whatsapp"])
});
var insertConfigurationSchema = createInsertSchema(configurations).omit({
  id: true,
  updatedAt: true
});
var insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  stripeCustomerId: true
}).extend({
  status: z.enum(["active", "inactive", "suspended"]).optional().default("active"),
  email: z.string().email(),
  phone: z.string().optional(),
  taxId: z.string().optional()
});
var insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  stripeSubscriptionId: true,
  cancelledAt: true
}).extend({
  planId: z.enum(["basic", "pro", "custom"]),
  status: z.enum(["active", "cancelled", "past_due", "paused"]).optional().default("active"),
  billingCycle: z.enum(["monthly", "yearly"]).optional().default("monthly")
});
var insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  stripePaymentId: true,
  paidAt: true,
  failedAt: true,
  failureReason: true,
  refundedAt: true,
  refundAmount: true
}).extend({
  status: z.enum(["pending", "completed", "failed", "refunded"]).optional().default("pending"),
  paymentMethod: z.enum(["mbway", "card", "multibanco", "bank_transfer"])
});
var insertMessageJobSchema = createInsertSchema(messageJobs).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  attempts: true,
  lastError: true,
  status: true
}).extend({
  channel: z.enum(["whatsapp", "email"]),
  trigger: z.enum(["new_lead", "followup_3d", "followup_7d", "status_change", "manual"])
});
var insertUsageLedgerSchema = createInsertSchema(usageLedger).omit({
  id: true,
  createdAt: true
}).extend({
  metric: z.enum(["messages_whatsapp", "messages_email", "leads_analyzed", "ai_tokens", "casafari_searches"]),
  source: z.enum(["automation", "manual", "casafari"]).optional()
});
var insertAutomationSettingsSchema = createInsertSchema(automationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  preferredChannel: z.enum(["whatsapp", "email"]).optional().default("whatsapp"),
  casafariSchedule: z.enum(["daily", "twice_daily", "weekly"]).optional().default("daily")
});
var insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true
}).extend({
  role: z.enum(["user", "assistant"])
});
var interactions = pgTable("interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull(),
  type: text("type").notNull(),
  // message_sent, message_received, call, etc
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var usageRecords = pgTable("usage_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  type: text("type").notNull(),
  // message, api_call, etc
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// server/db.ts
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq } from "drizzle-orm";
var DatabaseStorageImpl = class {
  // ================= CUSTOMERS =================
  async getCustomer(id) {
    const result = await db.select().from(customers).where(eq(customers.id, id));
    return result[0];
  }
  async getCustomers() {
    return await db.select().from(customers);
  }
  async createCustomer(data) {
    const result = await db.insert(customers).values(data).returning();
    return result[0];
  }
  async updateCustomer(id, data) {
    const result = await db.update(customers).set(data).where(eq(customers.id, id)).returning();
    return result[0];
  }
  // ================= LEADS =================
  async getLead(id) {
    const result = await db.select().from(leads).where(eq(leads.id, id));
    return result[0];
  }
  async getLeadsByCustomer(customerId) {
    return await db.select().from(leads).where(eq(leads.customerId, customerId));
  }
  async createLead(data) {
    const result = await db.insert(leads).values(data).returning();
    return result[0];
  }
  // ================= AUTOMATION =================
  async getAutomationSettings(customerId) {
    const result = await db.select().from(automationSettings).where(eq(automationSettings.customerId, customerId));
    return result[0];
  }
  async getAllAutomationSettings() {
    return await db.select().from(automationSettings);
  }
  async createOrUpdateAutomationSettings(data) {
    const existing = await this.getAutomationSettings(data.customerId);
    if (existing) {
      const result2 = await db.update(automationSettings).set(data).where(eq(automationSettings.customerId, data.customerId)).returning();
      return result2[0];
    }
    const result = await db.insert(automationSettings).values(data).returning();
    return result[0];
  }
  // ================= MESSAGE JOBS =================
  async createMessageJob(data) {
    const result = await db.insert(messageJobs).values(data).returning();
    return result[0];
  }
  async updateMessageJob(id, data) {
    const result = await db.update(messageJobs).set(data).where(eq(messageJobs.id, id)).returning();
    return result[0];
  }
  async getPendingMessageJobs() {
    return await db.select().from(messageJobs).where(eq(messageJobs.status, "pending"));
  }
  async getMessageJobsForLead(leadId) {
    return await db.select().from(messageJobs).where(eq(messageJobs.leadId, leadId));
  }
  // ================= INTERACTIONS =================
  async createInteraction(data) {
    const result = await db.insert(interactions).values(data).returning();
    return result[0];
  }
  async getLastInteraction(leadId) {
    const result = await db.select().from(interactions).where(eq(interactions.leadId, leadId)).orderBy(interactions.createdAt).limit(1);
    return result[0];
  }
  // ================= USAGE =================
  async createUsageRecord(data) {
    const result = await db.insert(usageRecords).values(data).returning();
    return result[0];
  }
  // ================= CALENDAR =================
  async getCalendarEvents() {
    return await db.select().from(calendarEvents);
  }
};
var storage = new DatabaseStorageImpl();

// server/lib/apify.ts
var APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
function formatPrice(price) {
  if (!price) return "Sob consulta";
  const numPrice = typeof price === "string" ? parseFloat(price.replace(/[^0-9.-]/g, "")) : price;
  if (isNaN(numPrice)) return "Sob consulta";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(numPrice);
}
function normalizePropertyType(type) {
  if (!type) return "Outro";
  const typeMap = {
    flat: "Apartamento",
    apartment: "Apartamento",
    apartamento: "Apartamento",
    piso: "Apartamento",
    house: "Moradia",
    moradia: "Moradia",
    villa: "Moradia",
    chalet: "Moradia",
    countryhouse: "Moradia",
    vivenda: "Moradia",
    duplex: "Apartamento",
    penthouse: "Apartamento",
    atico: "Apartamento",
    studio: "Apartamento",
    estudio: "Apartamento",
    land: "Terreno",
    terreno: "Terreno",
    premises: "Comercial",
    office: "Comercial",
    loja: "Comercial",
    escritorio: "Comercial",
    garage: "Garagem",
    garagem: "Garagem",
    storageroom: "Arrecada\xE7\xE3o",
    arrecadacao: "Arrecada\xE7\xE3o"
  };
  return typeMap[type.toLowerCase().replace(/\s/g, "").replace(/á/g, "a").replace(/ã/g, "a").replace(/é/g, "e").replace(/í/g, "i").replace(/ó/g, "o").replace(/ú/g, "u")] || type;
}
function convertApifyToProperty(listing, source) {
  const phone = listing.contactPhone || listing.agencyPhone || listing.phone || "";
  const contactName = listing.contactName || listing.agency || "Propriet\xE1rio";
  const location = listing.location || listing.address || listing.municipality || listing.neighborhood || listing.district || listing.province || "Portugal";
  return {
    id: listing.id || listing.externalId || `${source.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: listing.title || `Im\xF3vel em ${location}`,
    price: formatPrice(listing.price),
    location,
    propertyType: normalizePropertyType(listing.propertyType),
    bedrooms: listing.bedrooms || listing.rooms,
    bathrooms: listing.bathrooms,
    area: listing.area || listing.size,
    contact: phone,
    contactName,
    email: "",
    source,
    url: listing.url,
    description: listing.description,
    features: listing.features,
    images: listing.images,
    publishedAt: listing.publishedAt || listing.datePublished
  };
}
var IDEALISTA_SCRAPERS = [
  { id: "apify/cheerio-scraper", name: "Cheerio Generic (Free)", inputType: "cheerio" },
  { id: "apify/web-scraper", name: "Web Scraper Puppeteer (Free)", inputType: "puppeteer" }
];
var IMOVIRTUAL_SCRAPERS = [
  { id: "apify/web-scraper", name: "Web Scraper Puppeteer (Free)", inputType: "puppeteer" },
  { id: "apify/cheerio-scraper", name: "Cheerio Generic (Free)", inputType: "cheerio" }
];
var SUPERCASA_SCRAPERS = [
  { id: "apify/web-scraper", name: "Web Scraper Puppeteer (Free)", inputType: "puppeteer" },
  { id: "apify/cheerio-scraper", name: "Cheerio Generic (Free)", inputType: "cheerio" }
];
async function tryScraperWithTimeout(actorId, input, timeoutMs = 9e4) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const apiActorId = actorId.replace("/", "~");
    console.log(`[Apify] Trying ${actorId}...`);
    const response = await fetch(
      `https://api.apify.com/v2/acts/${apiActorId}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[Apify] ${actorId} failed: ${response.status} - ${errorText.substring(0, 100)}`);
      return null;
    }
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      console.log(`[Apify] ${actorId} returned ${data.length} items`);
      return data;
    }
    console.log(`[Apify] ${actorId} returned empty/invalid data`);
    return null;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      console.log(`[Apify] ${actorId} timeout`);
    } else {
      console.log(`[Apify] ${actorId} error: ${error.message}`);
    }
    return null;
  }
}
var IDEALISTA_CHEERIO_PAGE_FUNCTION = `
async function pageFunction(context) {
  const { $, request, log } = context;
  const results = [];
  
  $('article.item').each((i, el) => {
    const $el = $(el);
    const title = $el.find('.item-link').text().trim();
    const priceText = $el.find('.item-price').text().trim();
    const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
    const url = 'https://www.idealista.pt' + $el.find('.item-link').attr('href');
    const details = $el.find('.item-detail').text();
    const rooms = parseInt(details.match(/(\\d+)\\s*quarto/i)?.[1]) || undefined;
    const size = parseInt(details.match(/(\\d+)\\s*m\xB2/)?.[1]) || undefined;
    const location = $el.find('.item-detail-char .item-detail').first().text().trim();
    
    if (title && price > 0) {
      results.push({
        title,
        price,
        url,
        rooms,
        size,
        location: location || request.url.split('/').slice(-2, -1)[0],
        source: 'Idealista'
      });
    }
  });
  
  return results;
}
`;
async function searchIdealista(params) {
  const location = params.location?.toLowerCase() || "lisboa";
  const propertyTypeMap = {
    apartamento: "apartamentos",
    moradia: "casas",
    terreno: "terrenos",
    comercial: "locais-comerciais"
  };
  const propertyPath = propertyTypeMap[params.propertyType?.toLowerCase() || ""] || "casas";
  const operation = params.operation === "rent" ? "arrendar" : "comprar";
  const searchUrl = `https://www.idealista.pt/${operation}-${propertyPath}/${location}/`;
  console.log(`[Apify] Idealista search URL: ${searchUrl}`);
  for (const scraper of IDEALISTA_SCRAPERS) {
    let input;
    if (scraper.inputType === "cheerio") {
      input = {
        startUrls: [{ url: searchUrl }],
        pageFunction: IDEALISTA_CHEERIO_PAGE_FUNCTION,
        maxCrawlingDepth: 0,
        maxRequestsPerCrawl: 5
      };
    } else if (scraper.inputType === "puppeteer") {
      input = {
        startUrls: [{ url: searchUrl }],
        pageFunction: `async function pageFunction(context) {
          const { page, request, log } = context;
          await page.waitForSelector('article.item', { timeout: 10000 }).catch(() => {});
          const results = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('article.item').forEach(el => {
              const title = el.querySelector('.item-link')?.textContent?.trim() || '';
              const priceText = el.querySelector('.item-price')?.textContent?.trim() || '';
              const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
              const href = el.querySelector('.item-link')?.getAttribute('href') || '';
              const url = href.startsWith('http') ? href : 'https://www.idealista.pt' + href;
              const details = el.querySelector('.item-detail')?.textContent || '';
              const rooms = parseInt(details.match(/(\\d+)\\s*quarto/i)?.[1]) || undefined;
              const size = parseInt(details.match(/(\\d+)\\s*m\xB2/)?.[1]) || undefined;
              if (title && price > 0) {
                items.push({ title, price, url, rooms, size, source: 'Idealista' });
              }
            });
            return items;
          });
          return results;
        }`,
        maxPagesPerCrawl: 3,
        maxConcurrency: 2
      };
    } else {
      input = {
        startUrls: [searchUrl],
        maxItems: params.maxItems || 30,
        country: "pt"
      };
    }
    const data = await tryScraperWithTimeout(scraper.id, input, 18e4);
    if (data && data.length > 0) {
      console.log(`[Apify] ${scraper.id} returned ${data.length} items`);
      const properties = data.map((item) => {
        const enhanced = {
          ...item,
          title: item.title || item.propertyTitle || item.name || `Im\xF3vel em ${item.location || location}`,
          price: item.price || item.priceInfo?.price || item.priceAmount,
          location: item.location || item.address || item.neighborhood || item.zone || location,
          contactPhone: item.contactInfo?.phone || item.phone || item.contactPhone || item.agencyPhone,
          contactName: item.contactInfo?.name || item.agency || item.contactName || item.agencyName || "Propriet\xE1rio",
          propertyType: item.propertyType || item.typology || params.propertyType,
          rooms: item.rooms || item.bedrooms || item.numberOfRooms,
          bathrooms: item.bathrooms || item.numberOfBathrooms,
          size: item.size || item.floorSize || item.area || item.usefulArea,
          description: item.description || item.propertyDescription || item.features?.join(", "),
          url: item.url || item.link || item.propertyUrl
        };
        return convertApifyToProperty(enhanced, "Idealista");
      });
      return properties;
    }
  }
  console.log("[Apify] All Idealista scrapers failed");
  return [];
}
async function searchImovirtual(params) {
  const location = params.location || "lisboa";
  const locationCapitalized = location.charAt(0).toUpperCase() + location.slice(1).toLowerCase();
  const propertyTypeMap = {
    apartamento: "apartamento",
    moradia: "moradia",
    terreno: "terreno",
    comercial: "comercial"
  };
  const operation = params.operation === "rent" ? "arrendamento" : "venda";
  const propertyType = propertyTypeMap[params.propertyType?.toLowerCase() || ""] || "apartamento";
  const imovirtualUrl = `https://www.imovirtual.com/${operation}/${propertyType}/${location}/`;
  console.log(`[Apify] Imovirtual search URL: ${imovirtualUrl}`);
  for (const scraper of IMOVIRTUAL_SCRAPERS) {
    let input;
    if (scraper.inputType === "puppeteer") {
      input = {
        startUrls: [{ url: imovirtualUrl }],
        pageFunction: `async function pageFunction(context) {
          const { page, request } = context;
          await page.waitForSelector('[data-cy="listing-item"], article, .offer-item', { timeout: 15000 }).catch(() => {});
          const results = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('[data-cy="listing-item"], article[data-featured-name], .offer-item').forEach(el => {
              const title = el.querySelector('[data-cy="listing-item-title"], h3, h2, .title')?.textContent?.trim() || '';
              const priceText = el.querySelector('[data-cy="ad-price"], .price, [class*="price"]')?.textContent?.trim() || '';
              const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
              const linkEl = el.querySelector('a[href*="/anuncio/"], a[href*="/imovel/"], a');
              const href = linkEl?.getAttribute('href') || '';
              const url = href.startsWith('http') ? href : 'https://www.imovirtual.com' + href;
              const location = el.querySelector('[data-cy="listing-item-location"], .location, [class*="location"]')?.textContent?.trim() || '';
              if (title && price > 0) {
                items.push({ title, price, url, location, source: 'Imovirtual' });
              }
            });
            return items;
          });
          return results;
        }`,
        maxPagesPerCrawl: 3,
        maxConcurrency: 2
      };
    } else if (scraper.inputType === "cheerio") {
      input = {
        startUrls: [{ url: imovirtualUrl }],
        pageFunction: `async function pageFunction(context) {
          const { $, request } = context;
          const results = [];
          $('[data-cy="listing-item"], article[data-featured-name], .offer-item, .listing-item').each((i, el) => {
            const $el = $(el);
            const title = $el.find('[data-cy="listing-item-title"], .offer-item-title, h3, h2').first().text().trim();
            const priceText = $el.find('[data-cy="ad-price"], .offer-item-price, .price').first().text().trim();
            const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
            const linkEl = $el.find('a[href*="/anuncio/"], a[href*="/imovel/"]').first();
            const url = linkEl.attr('href') || $el.find('a').first().attr('href') || '';
            const location = $el.find('[data-cy="listing-item-location"], .offer-item-location, .location').text().trim();
            if (title && price > 0) {
              results.push({ title, price, url: url.startsWith('http') ? url : 'https://www.imovirtual.com' + url, location, source: 'Imovirtual' });
            }
          });
          return results;
        }`,
        maxCrawlingDepth: 0,
        maxRequestsPerCrawl: 5
      };
    } else {
      input = {
        location: locationCapitalized,
        propertyType,
        transactionType: params.operation === "rent" ? "arrendar" : "comprar",
        maxPages: 5
      };
      if (params.minPrice) input.minPrice = params.minPrice;
      if (params.maxPrice) input.maxPrice = params.maxPrice;
    }
    const data = await tryScraperWithTimeout(scraper.id, input, 12e4);
    if (data && data.length > 0) {
      const properties = data.map((item) => {
        const enhanced = {
          ...item,
          title: item.title || `${item.propertyType || "Im\xF3vel"} em ${item.location || locationCapitalized}`,
          price: item.price,
          location: item.full_address || item.location || locationCapitalized,
          contactPhone: item.agency_phone || item.phone,
          contactName: item.agency_name || "Propriet\xE1rio",
          propertyType: item.propertyType || params.propertyType,
          rooms: item.rooms_number ? parseInt(item.rooms_number) : void 0,
          size: item.area_square_meter
        };
        return convertApifyToProperty(enhanced, "Imovirtual");
      });
      return properties;
    }
  }
  console.log("[Apify] All Imovirtual scrapers failed");
  return [];
}
async function searchSupercasa(params) {
  const location = params.location?.toLowerCase() || "lisboa";
  const propertyTypeMap = {
    apartamento: "apartamentos",
    moradia: "moradias",
    terreno: "terrenos"
  };
  const operation = params.operation === "rent" ? "arrendar" : "comprar";
  const propertyType = propertyTypeMap[params.propertyType?.toLowerCase() || ""] || "apartamentos";
  const supercasaUrl = `https://supercasa.pt/${operation}-${propertyType}/${location}`;
  console.log(`[Apify] Supercasa search URL: ${supercasaUrl}`);
  for (const scraper of SUPERCASA_SCRAPERS) {
    let input;
    if (scraper.inputType === "puppeteer") {
      input = {
        startUrls: [{ url: supercasaUrl }],
        pageFunction: `async function pageFunction(context) {
          const { page, request } = context;
          await page.waitForSelector('[class*="property"], article, .result-item', { timeout: 15000 }).catch(() => {});
          const results = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('[class*="property-item"], [class*="listing-item"], article, .result-item').forEach(el => {
              const title = el.querySelector('[class*="title"], h2, h3')?.textContent?.trim() || '';
              const priceText = el.querySelector('[class*="price"]')?.textContent?.trim() || '';
              const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
              const linkEl = el.querySelector('a[href*="/imovel/"], a[href*="/property/"], a');
              const href = linkEl?.getAttribute('href') || '';
              const url = href.startsWith('http') ? href : 'https://supercasa.pt' + href;
              const location = el.querySelector('[class*="location"], [class*="address"]')?.textContent?.trim() || '';
              if (title && price > 0) {
                items.push({ title, price, url, location, source: 'Supercasa' });
              }
            });
            return items;
          });
          return results;
        }`,
        maxPagesPerCrawl: 3,
        maxConcurrency: 2
      };
    } else if (scraper.inputType === "cheerio") {
      input = {
        startUrls: [{ url: supercasaUrl }],
        pageFunction: `async function pageFunction(context) {
          const { $, request } = context;
          const results = [];
          $('[class*="property"], [class*="listing"], article, .result-item').each((i, el) => {
            const $el = $(el);
            const title = $el.find('[class*="title"], h2, h3').first().text().trim();
            const priceText = $el.find('[class*="price"]').first().text().trim();
            const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
            const linkEl = $el.find('a[href*="/imovel/"], a[href*="/property/"]').first();
            const url = linkEl.attr('href') || $el.find('a').first().attr('href') || '';
            const location = $el.find('[class*="location"], [class*="address"]').text().trim();
            if (title && price > 0) {
              results.push({ title, price, url: url.startsWith('http') ? url : 'https://supercasa.pt' + url, location, source: 'Supercasa' });
            }
          });
          return results;
        }`,
        maxCrawlingDepth: 0,
        maxRequestsPerCrawl: 5
      };
    } else {
      input = {
        startUrls: [supercasaUrl],
        maxItems: params.maxItems || 30
      };
    }
    const data = await tryScraperWithTimeout(scraper.id, input, 12e4);
    if (data && data.length > 0) {
      const properties = data.map((item) => {
        const enhanced = {
          ...item,
          title: item.title || item.name || `Im\xF3vel em ${item.location || location}`,
          price: item.price,
          location: item.location || item.address || location,
          contactPhone: item.phone || item.contactPhone,
          contactName: item.agency || item.agencyName || "Propriet\xE1rio",
          propertyType: item.propertyType || params.propertyType,
          rooms: item.rooms || item.bedrooms,
          bathrooms: item.bathrooms,
          size: item.size || item.area
        };
        return convertApifyToProperty(enhanced, "Supercasa");
      });
      return properties;
    }
  }
  console.log("[Apify] All Supercasa scrapers failed");
  return [];
}
function generateDemoLeads(params) {
  const location = params.location || "Lisboa";
  const propertyType = params.propertyType || "Apartamento";
  const now = Date.now();
  const neighborhoods = ["Alfama", "Baixa", "Chiado", "Bairro Alto", "Bel\xE9m", "Parque das Na\xE7\xF5es", "Alc\xE2ntara", "Estrela"];
  const agencies = ["Remax Portugal", "ERA Imobili\xE1ria", "Century 21", "Coldwell Banker", "KW Portugal", "Engel & V\xF6lkers"];
  const contacts = ["912 345 678", "934 567 890", "961 234 567", "915 678 901", "923 456 789"];
  const demoLeads = [];
  const count = Math.min(params.maxItems || 10, 15);
  for (let i = 0; i < count; i++) {
    const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
    const agency = agencies[Math.floor(Math.random() * agencies.length)];
    const contact = contacts[Math.floor(Math.random() * contacts.length)];
    const bedrooms = Math.floor(Math.random() * 4) + 1;
    const area = 50 + Math.floor(Math.random() * 150);
    const pricePerM2 = 3e3 + Math.floor(Math.random() * 4e3);
    const price = area * pricePerM2;
    demoLeads.push({
      id: `demo-${now}-${i}`,
      title: `${propertyType} T${bedrooms} em ${neighborhood}, ${location}`,
      price: formatPrice(price),
      location: `${neighborhood}, ${location}`,
      propertyType,
      bedrooms,
      bathrooms: Math.max(1, Math.floor(bedrooms / 2)),
      area,
      contact,
      contactName: agency,
      email: "",
      source: "Demo",
      url: `https://www.idealista.pt/imovel/${now}${i}/`,
      description: `Excelente ${propertyType.toLowerCase()} com ${bedrooms} quartos e ${area}m\xB2 em ${neighborhood}. \xD3tima localiza\xE7\xE3o, perto de transportes e servi\xE7os.`,
      features: ["Elevador", "Varanda", "Cozinha equipada", "Ar condicionado"],
      publishedAt: new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1e3).toISOString()
    });
  }
  return demoLeads;
}
async function searchWithApify(params, source = "all") {
  if (!APIFY_API_TOKEN) {
    console.log("[Apify] No API token - using demo leads");
    return {
      listings: generateDemoLeads(params),
      error: "APIFY_API_TOKEN n\xE3o configurado - usando dados de demonstra\xE7\xE3o",
      usedDemo: true
    };
  }
  const allListings = [];
  const errors = [];
  const searchFunctions = {
    idealista: () => searchIdealista(params),
    imovirtual: () => searchImovirtual(params),
    supercasa: () => searchSupercasa(params)
  };
  const sources = source === "all" ? ["idealista", "imovirtual", "supercasa"] : [source];
  for (const src of sources) {
    try {
      const results = await searchFunctions[src]();
      if (results.length > 0) {
        allListings.push(...results);
        console.log(`[Apify] Found ${results.length} from ${src}`);
      } else {
        errors.push(`${src}: sem resultados`);
      }
    } catch (error) {
      console.error(`[Apify] Error in ${src}:`, error.message);
      errors.push(`${src}: ${error.message}`);
    }
  }
  if (allListings.length === 0) {
    console.log("[Apify] No real leads found - using demo leads as fallback");
    return {
      listings: generateDemoLeads(params),
      error: errors.join("; ") + " - usando dados de demonstra\xE7\xE3o",
      usedDemo: true
    };
  }
  return {
    listings: allListings,
    error: errors.length > 0 ? errors.join("; ") : void 0,
    usedDemo: false
  };
}

// server/lib/openai.ts
import OpenAI from "openai";
import pRetry from "p-retry";
var hasOpenRouterConfig = !!(process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL && process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY);
var openrouter = hasOpenRouterConfig ? new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY
}) : null;
var hasOpenAIKey = !!process.env.OPENAI_API_KEY;
var openai = hasOpenAIKey ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;
function isRateLimitError(error) {
  const errorMsg = error?.message || String(error);
  return errorMsg.includes("429") || errorMsg.includes("RATELIMIT_EXCEEDED") || errorMsg.toLowerCase().includes("quota") || errorMsg.toLowerCase().includes("rate limit");
}
async function analyzeLeadWithAI(leadData) {
  const client = openrouter || openai;
  const model = openrouter ? "deepseek/deepseek-chat-v3.1" : "gpt-4o-mini";
  if (!client) {
    console.warn("No AI provider configured, returning default classification");
    return {
      status: "morno",
      score: 50,
      reasoning: "Classifica\xE7\xE3o autom\xE1tica n\xE3o dispon\xEDvel. Lead marcado como morno por defeito."
    };
  }
  const prompt = `Analisa este lead imobili\xE1rio portugu\xEAs e classifica o potencial de convers\xE3o:

DADOS DO LEAD:
- Nome/Vendedor: ${leadData.name}
- Descri\xE7\xE3o Im\xF3vel: ${leadData.property}
- Tipo: ${leadData.propertyType}
- Localiza\xE7\xE3o: ${leadData.location}
- Pre\xE7o Pedido: ${leadData.price}
- Contacto: ${leadData.contact}
- Origem/Fonte: ${leadData.source}

CRIT\xC9RIOS DE AVALIA\xC7\xC3O (mercado portugu\xEAs):
1. LOCALIZA\xC7\xC3O (peso 30%):
   - Premium: Lisboa Centro, Cascais, Porto Foz, Algarve (+25-30 pontos)
   - Boa: Grande Lisboa, Grande Porto, Capitais Distrito (+15-20 pontos)
   - Regular: Interior, zonas perif\xE9ricas (+5-10 pontos)

2. PRE\xC7O/m2 COMPETITIVO (peso 25%):
   - Abaixo mercado: +20 pontos (oportunidade)
   - Mercado: +10 pontos (standard)
   - Acima mercado: +0-5 pontos (dif\xEDcil venda)

3. QUALIDADE DO CONTACTO (peso 20%):
   - Telefone + Email: +20 pontos
   - S\xF3 telefone ou s\xF3 email: +10 pontos
   - Sem contacto direto: +0 pontos

4. FONTE DO LEAD (peso 15%):
   - Casafari/Idealista: +15 pontos (profissionais)
   - OLX/Facebook: +8 pontos (misto)
   - Manual/Outros: +5 pontos

5. INFORMA\xC7\xC3O COMPLETA (peso 10%):
   - Descri\xE7\xE3o detalhada, fotos, \xE1rea: +10 pontos
   - Informa\xE7\xE3o b\xE1sica: +5 pontos
   - M\xEDnima: +0 pontos

CLASSIFICA\xC7\xC3O FINAL:
- "quente" (75-100 pontos): Prioridade m\xE1xima, contactar nas pr\xF3ximas 24h
- "morno" (40-74 pontos): Potencial, incluir em follow-up regular
- "frio" (0-39 pontos): Baixa prioridade, manter para futuro

Responde APENAS com um objeto JSON neste formato exato:
{
  "status": "quente" | "morno" | "frio",
  "score": n\xFAmero entre 0-100,
  "reasoning": "breve explica\xE7\xE3o em portugu\xEAs de Portugal (m\xE1x 80 palavras)"
}`;
  try {
    const result = await pRetry(
      async () => {
        const completion = await client.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content: `\xC9s um analista especializado no mercado imobili\xE1rio portugu\xEAs com conhecimento profundo de:
- Zonas premium (Lisboa, Porto, Cascais, Algarve) e respetivos pre\xE7os/m2
- Tend\xEAncias de mercado (investimento estrangeiro, AL, Golden Visa)
- Qualifica\xE7\xE3o de leads por potencial de convers\xE3o
Responde SEMPRE com JSON v\xE1lido, sem texto adicional.`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        });
        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error("No response from AI");
        }
        let jsonContent = content.trim();
        if (jsonContent.startsWith("```")) {
          jsonContent = jsonContent.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        }
        const parsed = JSON.parse(jsonContent);
        if (!parsed.status || !["quente", "morno", "frio"].includes(parsed.status)) {
          throw new Error("Invalid status from AI");
        }
        return parsed;
      },
      {
        retries: 3,
        minTimeout: 1e3,
        maxTimeout: 1e4,
        factor: 2,
        shouldRetry: (error) => isRateLimitError(error)
      }
    );
    return result;
  } catch (error) {
    console.error("Error analyzing lead with AI:", error);
    return {
      status: "morno",
      score: 50,
      reasoning: "An\xE1lise autom\xE1tica n\xE3o dispon\xEDvel. Lead marcado como morno por defeito."
    };
  }
}

// server/lib/scheduledSearches.ts
var DEFAULT_SEARCH_CONFIG = {
  enabled: true,
  locations: ["Lisboa", "Porto", "Cascais", "Sintra", "Oeiras"],
  propertyTypes: ["Apartamento", "Moradia"],
  minPrice: 1e5,
  maxPrice: 1e6,
  sources: ["all"],
  runTime: "08:00"
};
async function runScheduledSearchForCustomer(customerId) {
  console.log(`[ScheduledSearch] Running for customer ${customerId}`);
  try {
    const settings = await storage.getAutomationSettings(customerId);
    if (!settings?.searchEnabled) {
      console.log(`[ScheduledSearch] Search disabled for ${customerId}`);
      return { success: true, leadsCreated: 0, error: "Auto search disabled" };
    }
    const existingLeads = await storage.getLeadsByCustomer(customerId);
    const existingUrls = new Set(
      existingLeads.filter((l) => l.sourceUrl).map((l) => l.sourceUrl)
    );
    let totalCreated = 0;
    for (const location of DEFAULT_SEARCH_CONFIG.locations.slice(0, 3)) {
      for (const propertyType of DEFAULT_SEARCH_CONFIG.propertyTypes.slice(0, 2)) {
        const result = await searchWithApify(
          {
            location,
            propertyType,
            minPrice: DEFAULT_SEARCH_CONFIG.minPrice,
            maxPrice: DEFAULT_SEARCH_CONFIG.maxPrice,
            maxItems: 10
          },
          "all"
        );
        if (result.listings.length > 0) {
          for (const listing of result.listings) {
            if (listing.url && existingUrls.has(listing.url)) {
              continue;
            }
            const aiAnalysis = await analyzeLeadWithAI({
              name: listing.contactName,
              property: listing.title,
              propertyType: listing.propertyType,
              location: listing.location,
              price: listing.price,
              contact: listing.contact,
              source: listing.source
            });
            const propertyTypeMap = {
              "Apartamento": "Apartamento",
              "Moradia": "Moradia",
              "Terreno": "Terreno",
              "Comercial": "Comercial"
            };
            const sourceMap = {
              "Idealista": "Idealista",
              "idealista": "Idealista",
              "Supercasa": "Manual",
              "supercasa": "Manual",
              "Imovirtual": "Manual",
              "imovirtual": "Manual"
            };
            const newLead = await storage.createLead({
              name: listing.contactName,
              property: listing.title,
              propertyType: propertyTypeMap[listing.propertyType] || "Outro",
              location: listing.location,
              price: listing.price,
              status: aiAnalysis.status,
              ownerType: "particular",
              qualification: "pendente_visita",
              source: sourceMap[listing.source] || "Manual",
              sourceUrl: listing.url || void 0,
              contact: listing.contact,
              email: listing.email || void 0,
              aiScore: aiAnalysis.score,
              aiReasoning: aiAnalysis.reasoning,
              notes: listing.description?.substring(0, 500) || void 0,
              optOut: false,
              customerId
            });
            if (newLead) {
              totalCreated++;
              if (listing.url) {
                existingUrls.add(listing.url);
              }
            }
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 2e3));
      }
    }
    console.log(`[ScheduledSearch] Created ${totalCreated} leads for ${customerId}`);
    return { success: true, leadsCreated: totalCreated };
  } catch (error) {
    console.error(`[ScheduledSearch] Error for ${customerId}:`, error.message);
    return { success: false, leadsCreated: 0, error: error.message };
  }
}
async function runAllScheduledSearches() {
  console.log("[ScheduledSearch] Running all scheduled searches...");
  const customers2 = await storage.getCustomers();
  const proCustomers = customers2.filter(
    (c) => c.plan === "pro" || c.plan === "custom" || c.plan === "enterprise"
  );
  console.log(`[ScheduledSearch] Found ${proCustomers.length} Pro/Custom customers`);
  for (const customer of proCustomers) {
    try {
      await runScheduledSearchForCustomer(customer.id);
      await new Promise((resolve) => setTimeout(resolve, 5e3));
    } catch (error) {
      console.error(`[ScheduledSearch] Failed for ${customer.id}:`, error);
    }
  }
  console.log("[ScheduledSearch] All scheduled searches complete");
}
var schedulerInterval = null;
var lastRunDate = null;
function startScheduler() {
  if (schedulerInterval) {
    console.log("[Scheduler] Already running");
    return;
  }
  console.log("[Scheduler] Starting daily search scheduler...");
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const currentHour = (/* @__PURE__ */ new Date()).getHours();
  if (currentHour >= 8 && lastRunDate !== today) {
    console.log("[Scheduler] Missed today's 08:00 run, executing now...");
    lastRunDate = today;
    runAllScheduledSearches().catch((err) => {
      console.error("[Scheduler] Catch-up run failed:", err);
    });
  }
  schedulerInterval = setInterval(async () => {
    const now = /* @__PURE__ */ new Date();
    const todayDate = now.toISOString().slice(0, 10);
    const hour = now.getHours();
    if (hour >= 8 && lastRunDate !== todayDate) {
      console.log("[Scheduler] Running daily scheduled searches");
      lastRunDate = todayDate;
      try {
        await runAllScheduledSearches();
      } catch (err) {
        console.error("[Scheduler] Scheduled run failed:", err);
      }
    }
  }, 6e4);
  console.log("[Scheduler] Scheduler started - runs daily at 08:00 (with catch-up)");
}

// server/index.ts
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = path3.dirname(__filename3);
var app = express2();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(cookieParser());
var corsOptions = {
  origin: process.env.NODE_ENV === "production" ? process.env.REPLIT_DOMAINS?.split(",").map((d) => `https://${d}`) || ["https://imo-lead-ai-pro.replit.app"] : true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use("/api/", apiRateLimiter);
async function initStripe(retries = 3, delay = 2e3) {
  const databaseUrl = process.env.DATABASE_URL;
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (!databaseUrl) {
    console.log("[Stripe] Skipping initialization - DATABASE_URL not set");
    return;
  }
  if (!replitDomains) {
    console.log("[Stripe] Skipping webhook setup - REPLIT_DOMAINS not set");
    try {
      await runMigrations({ databaseUrl });
      const stripeSync2 = await getStripeSync();
      stripeSync2.syncBackfill().catch(() => {
      });
    } catch (error) {
      console.log("[Stripe] Migration/sync skipped:", error instanceof Error ? error.message : "Unknown error");
    }
    return;
  }
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await runMigrations({ databaseUrl });
      const stripeSync2 = await getStripeSync();
      const webhookBaseUrl = `https://${replitDomains.split(",")[0]}`;
      await stripeSync2.findOrCreateManagedWebhook(
        `${webhookBaseUrl}/api/stripe/webhook`,
        {
          enabled_events: ["*"],
          description: "Managed webhook for ImoLead AI Pro"
        }
      );
      stripeSync2.syncBackfill().catch(() => {
      });
      console.log("[Stripe] Initialization complete");
      return;
    } catch (error) {
      if (attempt < retries && error?.code === "08P01") {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      } else if (attempt === retries) {
        console.log("[Stripe] Initialization failed after retries, will retry on next request");
      }
    }
  }
}
setTimeout(() => initStripe().catch(() => {
}), 1e3);
app.post(
  "/api/stripe/webhook/:uuid",
  express2.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(400).json({ error: "Missing stripe-signature" });
    }
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!Buffer.isBuffer(req.body)) {
        console.error("STRIPE WEBHOOK ERROR: req.body is not a Buffer");
        return res.status(500).json({ error: "Webhook processing error" });
      }
      const { uuid } = req.params;
      await WebhookHandlers.processWebhook(req.body, sig, uuid);
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error.message);
      res.status(400).json({ error: "Webhook processing error" });
    }
  }
);
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
app.use(sanitizeInputs);
app.use((req, res, next) => {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://api.openai.com wss://*.replit.dev wss://*.replit.app",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join("; ");
  res.setHeader("Content-Security-Policy", cspDirectives);
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=(self), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), payment=(self), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  next();
});
app.use((req, res, next) => {
  const suspiciousPatterns = /<script|javascript:|onerror=|onclick=|onload=|eval\(|\.\.\/|\.\.\\|union\s+select|drop\s+table/i;
  const checkSuspicious = (obj, source) => {
    for (const key in obj) {
      if (typeof obj[key] === "string" && suspiciousPatterns.test(obj[key])) {
        logSecurityEvent("SUSPICIOUS_INPUT", {
          ip: req.ip,
          source,
          field: key,
          path: req.path,
          method: req.method,
          userAgent: req.get("user-agent")
        });
      }
    }
  };
  if (req.body && typeof req.body === "object") checkSuspicious(req.body, "body");
  if (req.query && typeof req.query === "object") checkSuspicious(req.query, "query");
  if (req.params) checkSuspicious(req.params, "params");
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api") && res.statusCode >= 400) {
      log(`${req.method} ${path4} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});
var errorHandler = (err, _req, res, _next) => {
  const status = err?.status || err?.statusCode || 500;
  const message = err?.message || "Internal Server Error";
  logError(`${status}: ${message}`, err);
  if (!res.headersSent) {
    res.status(status).json({
      error: message,
      ...process.env.NODE_ENV === "development" && { stack: err.stack }
    });
  }
};
(async () => {
  await registerRoutes(app);
  const server = createServer(app);
  app.use(errorHandler);
  process.on("uncaughtException", (error) => {
    logError("UNCAUGHT EXCEPTION", error);
  });
  process.on("unhandledRejection", (reason) => {
    logError("UNHANDLED REJECTION", reason);
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "127.0.0.1"
    },
    () => {
      log(`serving on port ${port}`);
      startScheduler();
    }
  );
})();
