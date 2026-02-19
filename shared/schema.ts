import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  property: text("property").notNull(),
  propertyType: text("property_type").notNull(),
  location: text("location").notNull(),
  price: text("price").notNull(),
  status: text("status").notNull().default("frio"),
  qualification: text("qualification").default("pendente_visita"), // visitado, pendente_visita, sem_resposta, meu_imovel
  ownerType: text("owner_type").default("particular"), // particular, profissional (agência)
  source: text("source").notNull(),
  sourceUrl: text("source_url"), // Link para o anúncio original
  contact: text("contact").notNull(),
  email: text("email"),
  aiScore: integer("ai_score"),
  aiReasoning: text("ai_reasoning"),
  notes: text("notes"),
  optOut: boolean("opt_out").default(false),
  customerId: varchar("customer_id"),
  lastContact: timestamp("last_contact").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messageTemplates = pgTable("message_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subject: text("subject"),
  content: text("content").notNull(),
  category: text("category").notNull(),
  variables: jsonb("variables").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  eventType: text("event_type").default("visita"), // visita, reuniao, chamada, outro
  status: text("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const interactionHistory = pgTable("interaction_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const configurations = pgTable("configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customers (subscribers)
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  company: text("company"),
  password: text("password"),
  taxId: text("tax_id"), // NIF in Portugal
  stripeCustomerId: text("stripe_customer_id"),
  status: text("status").notNull().default("active"), // active, inactive, suspended
  plan: text("plan").default("trial"), // trial, basic, pro
  trialEndsAt: timestamp("trial_ends_at"), // 7 days from registration
  emailVerified: boolean("email_verified").default(false),
  emailVerifiedAt: timestamp("email_verified_at"),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  googleTokenExpiry: timestamp("google_token_expiry"),
  googleCalendarConnected: boolean("google_calendar_connected").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  planId: text("plan_id").notNull(), // basic, pro, custom
  planName: text("plan_name").notNull(),
  price: integer("price").notNull(), // in cents (e.g., 4999 = €49.99)
  currency: text("currency").notNull().default("EUR"),
  billingCycle: text("billing_cycle").notNull().default("monthly"), // monthly, yearly
  status: text("status").notNull().default("active"), // active, cancelled, past_due, paused
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Message Jobs (scheduled/automated messages)
export const messageJobs = pgTable("message_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  channel: text("channel").notNull(), // whatsapp, email
  templateId: varchar("template_id"),
  content: text("content").notNull(),
  subject: text("subject"), // for email
  status: text("status").notNull().default("pending"), // pending, sent, failed, cancelled
  trigger: text("trigger").notNull(), // new_lead, followup_3d, followup_7d, status_change, manual
  scheduledAt: timestamp("scheduled_at").notNull(),
  sentAt: timestamp("sent_at"),
  attempts: integer("attempts").default(0),
  lastError: text("last_error"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Usage Ledger (consumption tracking)
export const usageLedger = pgTable("usage_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  metric: text("metric").notNull(), // messages_whatsapp, messages_email, leads_analyzed, ai_tokens, casafari_searches
  quantity: integer("quantity").notNull().default(1),
  period: text("period").notNull(), // YYYY-MM format
  source: text("source"), // automation, manual, casafari
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Automation Settings (per customer)
export const automationSettings = pgTable("automation_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull().unique(),
  enabled: boolean("enabled").default(false),
  autoMessageNewLead: boolean("auto_message_new_lead").default(true),
  autoFollowup3Days: boolean("auto_followup_3_days").default(true),
  autoFollowup7Days: boolean("auto_followup_7_days").default(false),
  preferredChannel: text("preferred_channel").default("whatsapp"), // whatsapp, email
  quietHoursStart: integer("quiet_hours_start").default(21), // 21:00
  quietHoursEnd: integer("quiet_hours_end").default(9), // 09:00
  casafariEnabled: boolean("casafari_enabled").default(false),
  casafariSearchParams: jsonb("casafari_search_params"), // legacy - use searchConfig instead
  casafariSchedule: text("casafari_schedule").default("daily"), // daily, twice_daily, weekly
  newLeadTemplateId: varchar("new_lead_template_id"),
  followupTemplateId: varchar("followup_template_id"),
  // Enhanced search configuration
  searchEnabled: boolean("search_enabled").default(false),
  searchSources: jsonb("search_sources").$type<string[] | null>().default(["casafari", "idealista", "olx"]),
  searchLocations: jsonb("search_locations").$type<string[] | null>().default(["Lisboa", "Porto"]),
  searchPropertyTypes: jsonb("search_property_types").$type<string[] | null>().default(["Apartamento", "Moradia"]),
  searchTransactionType: text("search_transaction_type").default("sale"), // sale, rent
  searchPriceMin: integer("search_price_min").default(100000),
  searchPriceMax: integer("search_price_max").default(500000),
  searchBedrooms: integer("search_bedrooms"),
  searchAreaMin: integer("search_area_min"),
  searchAreaMax: integer("search_area_max"),
  searchSchedule: text("search_schedule").default("daily"), // hourly, twice_daily, daily, weekly
  searchMinScore: integer("search_min_score").default(40),
  autoClassifyLeads: boolean("auto_classify_leads").default(true),
  autoContactNewLeads: boolean("auto_contact_new_leads").default(false), // Pro only
  lastSearchAt: timestamp("last_search_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Email Verification Tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payments
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull().default("EUR"),
  status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
  paymentMethod: text("payment_method").notNull(), // mbway, card, multibanco, bank_transfer
  paymentMethodDetails: jsonb("payment_method_details"), // store card last 4, mbway phone, etc.
  stripePaymentId: text("stripe_payment_id"),
  description: text("description"),
  invoiceNumber: text("invoice_number"),
  paidAt: timestamp("paid_at"),
  failedAt: timestamp("failed_at"),
  failureReason: text("failure_reason"),
  refundedAt: timestamp("refunded_at"),
  refundAmount: integer("refund_amount"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat Messages (AI assistant conversation history)
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Qualification enum for leads
export const qualificationEnum = z.enum(["visitado", "pendente_visita", "sem_resposta", "meu_imovel"]);
export type LeadQualification = z.infer<typeof qualificationEnum>;

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastContact: true,
  aiScore: true,
  aiReasoning: true,
}).extend({
  status: z.enum(["quente", "morno", "frio"]).optional().default("frio"),
  qualification: qualificationEnum.optional().default("pendente_visita"),
  source: z.enum(["Idealista", "Imovirtual", "Supercasa", "OLX", "Casafari", "Manual", "Importação CSV", "Demonstração", "Demo"]),
  propertyType: z.enum(["Apartamento", "Moradia", "Terreno", "Comercial", "Garagem", "Arrecadação", "Outro"]),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  category: z.enum(["inicial", "followup", "agendamento", "outro"]),
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["scheduled", "completed", "cancelled"]).default("scheduled"),
  eventType: z.enum(["visita", "reuniao", "chamada", "outro"]).default("visita"),
  startTime: z.union([z.string(), z.date()]).transform((val) => typeof val === "string" ? new Date(val) : val),
  endTime: z.union([z.string(), z.date()]).transform((val) => typeof val === "string" ? new Date(val) : val),
});

export const insertInteractionSchema = createInsertSchema(interactionHistory).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(["message_sent", "message_received", "call", "email", "note", "status_change", "whatsapp"]),
});

export const insertConfigurationSchema = createInsertSchema(configurations).omit({
  id: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  stripeCustomerId: true,
}).extend({
  status: z.enum(["active", "inactive", "suspended"]).optional().default("active"),
  email: z.string().email(),
  phone: z.string().optional(),
  taxId: z.string().optional(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  stripeSubscriptionId: true,
  cancelledAt: true,
}).extend({
  planId: z.enum(["basic", "pro", "custom"]),
  status: z.enum(["active", "cancelled", "past_due", "paused"]).optional().default("active"),
  billingCycle: z.enum(["monthly", "yearly"]).optional().default("monthly"),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  stripePaymentId: true,
  paidAt: true,
  failedAt: true,
  failureReason: true,
  refundedAt: true,
  refundAmount: true,
}).extend({
  status: z.enum(["pending", "completed", "failed", "refunded"]).optional().default("pending"),
  paymentMethod: z.enum(["mbway", "card", "multibanco", "bank_transfer"]),
});

export const insertMessageJobSchema = createInsertSchema(messageJobs).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  attempts: true,
  lastError: true,
  status: true,
}).extend({
  channel: z.enum(["whatsapp", "email"]),
  trigger: z.enum(["new_lead", "followup_3d", "followup_7d", "status_change", "manual"]),
});

export const insertUsageLedgerSchema = createInsertSchema(usageLedger).omit({
  id: true,
  createdAt: true,
}).extend({
  metric: z.enum(["messages_whatsapp", "messages_email", "leads_analyzed", "ai_tokens", "casafari_searches"]),
  source: z.enum(["automation", "manual", "casafari"]).optional(),
});

export const insertAutomationSettingsSchema = createInsertSchema(automationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  preferredChannel: z.enum(["whatsapp", "email"]).optional().default("whatsapp"),
  casafariSchedule: z.enum(["daily", "twice_daily", "weekly"]).optional().default("daily"),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type MessageJob = typeof messageJobs.$inferSelect;
export type InsertMessageJob = z.infer<typeof insertMessageJobSchema>;

export type UsageLedger = typeof usageLedger.$inferSelect;
export type InsertUsageLedger = z.infer<typeof insertUsageLedgerSchema>;

export type AutomationSettings = typeof automationSettings.$inferSelect;
export type InsertAutomationSettings = z.infer<typeof insertAutomationSettingsSchema>;

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;

export type InteractionHistory = typeof interactionHistory.$inferSelect;
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;

export type Configuration = typeof configurations.$inferSelect;
export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
}).extend({
  role: z.enum(["user", "assistant"]),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export const interactions = pgTable("interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull(),
  type: text("type").notNull(), // message_sent, message_received, call, etc
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usageRecords = pgTable("usage_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  type: text("type").notNull(), // message, api_call, etc
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
