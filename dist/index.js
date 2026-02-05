var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  automationSettings: () => automationSettings,
  calendarEvents: () => calendarEvents,
  configurations: () => configurations,
  customers: () => customers,
  insertAutomationSettingsSchema: () => insertAutomationSettingsSchema,
  insertCalendarEventSchema: () => insertCalendarEventSchema,
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
  leads: () => leads,
  messageJobs: () => messageJobs,
  messageTemplates: () => messageTemplates,
  payments: () => payments,
  subscriptions: () => subscriptions,
  usageLedger: () => usageLedger
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var leads, messageTemplates, calendarEvents, interactionHistory, configurations, customers, subscriptions, messageJobs, usageLedger, automationSettings, payments, insertLeadSchema, insertMessageTemplateSchema, insertCalendarEventSchema, insertInteractionSchema, insertConfigurationSchema, insertCustomerSchema, insertSubscriptionSchema, insertPaymentSchema, insertMessageJobSchema, insertUsageLedgerSchema, insertAutomationSettingsSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    leads = pgTable("leads", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      property: text("property").notNull(),
      propertyType: text("property_type").notNull(),
      location: text("location").notNull(),
      price: text("price").notNull(),
      status: text("status").notNull().default("frio"),
      source: text("source").notNull(),
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
    messageTemplates = pgTable("message_templates", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      subject: text("subject"),
      content: text("content").notNull(),
      category: text("category").notNull(),
      variables: jsonb("variables").$type(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    calendarEvents = pgTable("calendar_events", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      leadId: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }),
      title: text("title").notNull(),
      description: text("description"),
      startTime: timestamp("start_time").notNull(),
      endTime: timestamp("end_time").notNull(),
      location: text("location"),
      status: text("status").notNull().default("scheduled"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    interactionHistory = pgTable("interaction_history", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      leadId: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
      type: text("type").notNull(),
      content: text("content").notNull(),
      metadata: jsonb("metadata"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    configurations = pgTable("configurations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      key: text("key").notNull().unique(),
      value: jsonb("value").notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    customers = pgTable("customers", {
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
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    subscriptions = pgTable("subscriptions", {
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
    messageJobs = pgTable("message_jobs", {
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
    usageLedger = pgTable("usage_ledger", {
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
    automationSettings = pgTable("automation_settings", {
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
      // location, priceMin, priceMax, propertyType
      casafariSchedule: text("casafari_schedule").default("daily"),
      // daily, twice_daily, weekly
      newLeadTemplateId: varchar("new_lead_template_id"),
      followupTemplateId: varchar("followup_template_id"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    payments = pgTable("payments", {
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
    insertLeadSchema = createInsertSchema(leads).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      lastContact: true,
      aiScore: true,
      aiReasoning: true
    }).extend({
      status: z.enum(["quente", "morno", "frio"]).optional().default("frio"),
      source: z.enum(["Idealista", "OLX", "Casafari", "Manual"]),
      propertyType: z.enum(["Apartamento", "Moradia", "Terreno", "Comercial", "Outro"]),
      email: z.string().email().optional().or(z.literal("")),
      notes: z.string().optional().or(z.literal(""))
    });
    insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      category: z.enum(["inicial", "followup", "agendamento", "outro"])
    });
    insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      status: z.enum(["scheduled", "completed", "cancelled"]).default("scheduled")
    });
    insertInteractionSchema = createInsertSchema(interactionHistory).omit({
      id: true,
      createdAt: true
    }).extend({
      type: z.enum(["message_sent", "message_received", "call", "email", "note", "status_change", "whatsapp"])
    });
    insertConfigurationSchema = createInsertSchema(configurations).omit({
      id: true,
      updatedAt: true
    });
    insertCustomerSchema = createInsertSchema(customers).omit({
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
    insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
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
    insertPaymentSchema = createInsertSchema(payments).omit({
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
    insertMessageJobSchema = createInsertSchema(messageJobs).omit({
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
    insertUsageLedgerSchema = createInsertSchema(usageLedger).omit({
      id: true,
      createdAt: true
    }).extend({
      metric: z.enum(["messages_whatsapp", "messages_email", "leads_analyzed", "ai_tokens", "casafari_searches"]),
      source: z.enum(["automation", "manual", "casafari"]).optional()
    });
    insertAutomationSettingsSchema = createInsertSchema(automationSettings).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      preferredChannel: z.enum(["whatsapp", "email"]).optional().default("whatsapp"),
      casafariSchedule: z.enum(["daily", "twice_daily", "weekly"]).optional().default("daily")
    });
  }
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema: schema_exports });
  }
});

// server/storage.ts
import { eq, ilike, and, or, gte, lte, desc } from "drizzle-orm";
var DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    DatabaseStorage = class {
      async createLead(insertLead) {
        const [lead] = await db.insert(leads).values({
          name: insertLead.name,
          property: insertLead.property,
          propertyType: insertLead.propertyType,
          location: insertLead.location,
          price: insertLead.price,
          status: insertLead.status || "frio",
          source: insertLead.source,
          contact: insertLead.contact,
          customerId: insertLead.customerId || null,
          email: insertLead.email || null,
          notes: insertLead.notes || null,
          aiScore: insertLead.aiScore || null,
          aiReasoning: insertLead.aiReasoning || null,
          lastContact: insertLead.lastContact || /* @__PURE__ */ new Date()
        }).returning();
        return lead;
      }
      async getLeads(filters) {
        let conditions = [];
        if (filters?.status) {
          conditions.push(eq(leads.status, filters.status));
        }
        if (filters?.source) {
          conditions.push(eq(leads.source, filters.source));
        }
        if (filters?.location) {
          conditions.push(ilike(leads.location, `%${filters.location}%`));
        }
        if (filters?.search) {
          conditions.push(
            or(
              ilike(leads.name, `%${filters.search}%`),
              ilike(leads.property, `%${filters.search}%`),
              ilike(leads.location, `%${filters.search}%`)
            )
          );
        }
        if (conditions.length > 0) {
          return db.select().from(leads).where(and(...conditions)).orderBy(desc(leads.createdAt));
        }
        return db.select().from(leads).orderBy(desc(leads.createdAt));
      }
      async getLead(id) {
        const [lead] = await db.select().from(leads).where(eq(leads.id, id));
        return lead;
      }
      async updateLead(id, updateData) {
        const [lead] = await db.update(leads).set({ ...updateData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(leads.id, id)).returning();
        return lead;
      }
      async deleteLead(id) {
        const result = await db.delete(leads).where(eq(leads.id, id));
        return true;
      }
      async createMessageTemplate(insertTemplate) {
        const [template] = await db.insert(messageTemplates).values({
          name: insertTemplate.name,
          content: insertTemplate.content,
          category: insertTemplate.category,
          subject: insertTemplate.subject || null,
          variables: insertTemplate.variables ? [...insertTemplate.variables] : null
        }).returning();
        return template;
      }
      async getMessageTemplates() {
        return db.select().from(messageTemplates).orderBy(desc(messageTemplates.createdAt));
      }
      async getMessageTemplate(id) {
        const [template] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, id));
        return template;
      }
      async updateMessageTemplate(id, updateData) {
        const updateValues = { updatedAt: /* @__PURE__ */ new Date() };
        if (updateData.name !== void 0) updateValues.name = updateData.name;
        if (updateData.content !== void 0) updateValues.content = updateData.content;
        if (updateData.category !== void 0) updateValues.category = updateData.category;
        if (updateData.subject !== void 0) updateValues.subject = updateData.subject;
        if (updateData.variables !== void 0) updateValues.variables = updateData.variables ? [...updateData.variables] : null;
        const [template] = await db.update(messageTemplates).set(updateValues).where(eq(messageTemplates.id, id)).returning();
        return template;
      }
      async deleteMessageTemplate(id) {
        await db.delete(messageTemplates).where(eq(messageTemplates.id, id));
        return true;
      }
      async createCalendarEvent(insertEvent) {
        const [event] = await db.insert(calendarEvents).values(insertEvent).returning();
        return event;
      }
      async getCalendarEvents(filters) {
        let conditions = [];
        if (filters?.startDate) {
          conditions.push(gte(calendarEvents.startTime, filters.startDate));
        }
        if (filters?.endDate) {
          conditions.push(lte(calendarEvents.endTime, filters.endDate));
        }
        if (conditions.length > 0) {
          return db.select().from(calendarEvents).where(and(...conditions)).orderBy(desc(calendarEvents.startTime));
        }
        return db.select().from(calendarEvents).orderBy(desc(calendarEvents.startTime));
      }
      async getCalendarEvent(id) {
        const [event] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
        return event;
      }
      async updateCalendarEvent(id, updateData) {
        const [event] = await db.update(calendarEvents).set({ ...updateData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(calendarEvents.id, id)).returning();
        return event;
      }
      async deleteCalendarEvent(id) {
        await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
        return true;
      }
      async createInteraction(insertInteraction) {
        const [interaction] = await db.insert(interactionHistory).values(insertInteraction).returning();
        return interaction;
      }
      async getInteractionsByLead(leadId) {
        return db.select().from(interactionHistory).where(eq(interactionHistory.leadId, leadId)).orderBy(desc(interactionHistory.createdAt));
      }
      async getAllInteractions() {
        return db.select().from(interactionHistory).orderBy(desc(interactionHistory.createdAt));
      }
      async getConfiguration(key) {
        const [config] = await db.select().from(configurations).where(eq(configurations.key, key));
        return config;
      }
      async setConfiguration(insertConfig) {
        const existing = await this.getConfiguration(insertConfig.key);
        if (existing) {
          const [updated] = await db.update(configurations).set({ value: insertConfig.value, updatedAt: /* @__PURE__ */ new Date() }).where(eq(configurations.key, insertConfig.key)).returning();
          return updated;
        }
        const [config] = await db.insert(configurations).values(insertConfig).returning();
        return config;
      }
      async createCustomer(insertCustomer) {
        const [customer] = await db.insert(customers).values({
          name: insertCustomer.name,
          email: insertCustomer.email,
          phone: insertCustomer.phone || null,
          company: insertCustomer.company || null,
          password: insertCustomer.password || null,
          taxId: insertCustomer.taxId || null,
          status: insertCustomer.status || "active",
          plan: insertCustomer.plan || "trial",
          trialEndsAt: insertCustomer.trialEndsAt || null
        }).returning();
        return customer;
      }
      async getCustomers(filters) {
        let conditions = [];
        if (filters?.status) {
          conditions.push(eq(customers.status, filters.status));
        }
        if (filters?.search) {
          conditions.push(
            or(
              ilike(customers.name, `%${filters.search}%`),
              ilike(customers.email, `%${filters.search}%`),
              ilike(customers.company, `%${filters.search}%`)
            )
          );
        }
        if (conditions.length > 0) {
          return db.select().from(customers).where(and(...conditions)).orderBy(desc(customers.createdAt));
        }
        return db.select().from(customers).orderBy(desc(customers.createdAt));
      }
      async getCustomer(id) {
        const [customer] = await db.select().from(customers).where(eq(customers.id, id));
        return customer;
      }
      async getCustomerByEmail(email) {
        const [customer] = await db.select().from(customers).where(eq(customers.email, email));
        return customer;
      }
      async updateCustomer(id, updates) {
        const [customer] = await db.update(customers).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(customers.id, id)).returning();
        return customer;
      }
      async deleteCustomer(id) {
        await db.delete(customers).where(eq(customers.id, id));
        return true;
      }
      async createSubscription(insertSubscription) {
        const [subscription] = await db.insert(subscriptions).values({
          customerId: insertSubscription.customerId,
          planId: insertSubscription.planId,
          planName: insertSubscription.planName,
          price: insertSubscription.price,
          currency: insertSubscription.currency || "EUR",
          billingCycle: insertSubscription.billingCycle || "monthly",
          status: insertSubscription.status || "active",
          currentPeriodStart: insertSubscription.currentPeriodStart,
          currentPeriodEnd: insertSubscription.currentPeriodEnd
        }).returning();
        return subscription;
      }
      async getSubscriptions(filters) {
        let conditions = [];
        if (filters?.customerId) {
          conditions.push(eq(subscriptions.customerId, filters.customerId));
        }
        if (filters?.status) {
          conditions.push(eq(subscriptions.status, filters.status));
        }
        if (filters?.planId) {
          conditions.push(eq(subscriptions.planId, filters.planId));
        }
        if (conditions.length > 0) {
          return db.select().from(subscriptions).where(and(...conditions)).orderBy(desc(subscriptions.createdAt));
        }
        return db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
      }
      async getSubscription(id) {
        const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
        return subscription;
      }
      async getActiveSubscriptionByCustomer(customerId) {
        const [subscription] = await db.select().from(subscriptions).where(and(eq(subscriptions.customerId, customerId), eq(subscriptions.status, "active")));
        return subscription;
      }
      async updateSubscription(id, updates) {
        const [subscription] = await db.update(subscriptions).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(subscriptions.id, id)).returning();
        return subscription;
      }
      async cancelSubscription(id) {
        const [subscription] = await db.update(subscriptions).set({ status: "cancelled", cancelledAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq(subscriptions.id, id)).returning();
        return subscription;
      }
      async createPayment(insertPayment) {
        const [payment] = await db.insert(payments).values(insertPayment).returning();
        return payment;
      }
      async getPayments(filters) {
        let conditions = [];
        if (filters?.customerId) {
          conditions.push(eq(payments.customerId, filters.customerId));
        }
        if (filters?.subscriptionId) {
          conditions.push(eq(payments.subscriptionId, filters.subscriptionId));
        }
        if (filters?.status) {
          conditions.push(eq(payments.status, filters.status));
        }
        if (filters?.paymentMethod) {
          conditions.push(eq(payments.paymentMethod, filters.paymentMethod));
        }
        if (filters?.startDate) {
          conditions.push(gte(payments.createdAt, filters.startDate));
        }
        if (filters?.endDate) {
          conditions.push(lte(payments.createdAt, filters.endDate));
        }
        if (conditions.length > 0) {
          return db.select().from(payments).where(and(...conditions)).orderBy(desc(payments.createdAt));
        }
        return db.select().from(payments).orderBy(desc(payments.createdAt));
      }
      async getPayment(id) {
        const [payment] = await db.select().from(payments).where(eq(payments.id, id));
        return payment;
      }
      async updatePayment(id, updates) {
        const [payment] = await db.update(payments).set(updates).where(eq(payments.id, id)).returning();
        return payment;
      }
      async getPaymentStats(startDate, endDate) {
        let allPayments = await this.getPayments({ startDate, endDate });
        const completedPayments = allPayments.filter((p) => p.status === "completed");
        const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalPayments = allPayments.length;
        const byMethod = {};
        const byStatus = {};
        const byMonthMap = {};
        allPayments.forEach((p) => {
          if (!byMethod[p.paymentMethod]) {
            byMethod[p.paymentMethod] = { count: 0, amount: 0 };
          }
          byMethod[p.paymentMethod].count++;
          if (p.status === "completed") {
            byMethod[p.paymentMethod].amount += p.amount;
          }
          byStatus[p.status] = (byStatus[p.status] || 0) + 1;
          if (p.status === "completed" && p.paidAt) {
            const monthKey = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, "0")}`;
            if (!byMonthMap[monthKey]) {
              byMonthMap[monthKey] = { amount: 0, count: 0 };
            }
            byMonthMap[monthKey].amount += p.amount;
            byMonthMap[monthKey].count++;
          }
        });
        const byMonth = Object.entries(byMonthMap).map(([month, data]) => ({ month, ...data })).sort((a, b) => a.month.localeCompare(b.month));
        return { totalRevenue, totalPayments, byMethod, byStatus, byMonth };
      }
      // Message Jobs
      async createMessageJob(job) {
        const [messageJob] = await db.insert(messageJobs).values(job).returning();
        return messageJob;
      }
      async getPendingMessageJobs() {
        return db.select().from(messageJobs).where(eq(messageJobs.status, "pending")).orderBy(messageJobs.scheduledAt);
      }
      async getMessageJobsForLead(leadId) {
        return db.select().from(messageJobs).where(eq(messageJobs.leadId, leadId)).orderBy(desc(messageJobs.createdAt));
      }
      async updateMessageJob(id, updates) {
        const [job] = await db.update(messageJobs).set(updates).where(eq(messageJobs.id, id)).returning();
        return job;
      }
      // Automation Settings
      async getAutomationSettings(customerId) {
        const [settings] = await db.select().from(automationSettings).where(eq(automationSettings.customerId, customerId));
        return settings;
      }
      async getAllAutomationSettings() {
        return db.select().from(automationSettings);
      }
      async createOrUpdateAutomationSettings(settings) {
        const existing = await this.getAutomationSettings(settings.customerId);
        if (existing) {
          const [updated] = await db.update(automationSettings).set({ ...settings, updatedAt: /* @__PURE__ */ new Date() }).where(eq(automationSettings.customerId, settings.customerId)).returning();
          return updated;
        }
        const [newSettings] = await db.insert(automationSettings).values(settings).returning();
        return newSettings;
      }
      // Usage Ledger
      async createUsageRecord(usage) {
        const [record] = await db.insert(usageLedger).values(usage).returning();
        return record;
      }
      async getUsageByCustomer(customerId, period) {
        if (period) {
          return db.select().from(usageLedger).where(and(eq(usageLedger.customerId, customerId), eq(usageLedger.period, period)));
        }
        return db.select().from(usageLedger).where(eq(usageLedger.customerId, customerId));
      }
      async getUsageSummary(customerId, period) {
        const records = await this.getUsageByCustomer(customerId, period);
        const summary = {};
        records.forEach((r) => {
          summary[r.metric] = (summary[r.metric] || 0) + r.quantity;
        });
        return summary;
      }
      // Extended Lead operations
      async getLeadsByCustomer(customerId) {
        return db.select().from(leads).where(eq(leads.customerId, customerId));
      }
      async getLastInteraction(leadId) {
        const [interaction] = await db.select().from(interactionHistory).where(eq(interactionHistory.leadId, leadId)).orderBy(desc(interactionHistory.createdAt)).limit(1);
        return interaction;
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/services/emailService.ts
import OpenAI2 from "openai";
async function generateAIMessage(leadName, leadLocation, leadProperty, leadPrice, triggerType, channel) {
  const triggerDescriptions = {
    new_lead: "primeiro contacto com um novo lead",
    followup_3d: "follow-up apos 3 dias sem resposta",
    followup_7d: "follow-up apos 7 dias sem resposta",
    status_change: "mudanca de estado do lead"
  };
  const prompt = `Gera uma mensagem profissional em portugues europeu para um consultor imobiliario.

Contexto:
- Tipo: ${triggerDescriptions[triggerType]}
- Canal: ${channel === "whatsapp" ? "WhatsApp" : "Email"}
- Nome do lead: ${leadName}
- Localizacao: ${leadLocation}
- Propriedade: ${leadProperty}
- Preco: ${leadPrice}

Requisitos:
- Tom profissional mas acolhedor
- Maximo 150 palavras para WhatsApp, 250 para email
- Nao uses emojis
- Inclui uma chamada para acao clara
- ${channel === "email" ? "Inclui tambem um assunto curto e atrativo (max 60 caracteres)" : ""}

Responde em formato JSON:
${channel === "email" ? '{"subject": "assunto aqui", "content": "mensagem aqui"}' : '{"content": "mensagem aqui"}'}`;
  try {
    const response = await openai2.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7
    });
    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      subject: result.subject,
      content: result.content || "Ola! Gostaria de saber se posso ajuda-lo com mais informacoes sobre este imovel."
    };
  } catch (error) {
    console.error("Error generating AI message:", error);
    return {
      subject: channel === "email" ? `Imovel em ${leadLocation} - Informacoes` : void 0,
      content: `Ola ${leadName}! Sou consultor imobiliario e gostaria de saber se posso ajuda-lo com mais informacoes sobre o imovel em ${leadLocation}. Aguardo o seu contacto.`
    };
  }
}
async function sendEmail(params, config) {
  if (!config?.apiKey) {
    console.log("Email service not configured - simulating send to:", params.to);
    return { success: true };
  }
  try {
    if (config.provider === "sendgrid") {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: params.to }] }],
          from: { email: config.fromEmail, name: config.fromName },
          subject: params.subject,
          content: [
            { type: "text/plain", value: params.body },
            ...params.html ? [{ type: "text/html", value: params.html }] : []
          ]
        })
      });
      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }
      return { success: true };
    }
    if (config.provider === "resend") {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: `${config.fromName} <${config.fromEmail}>`,
          to: params.to,
          subject: params.subject,
          text: params.body,
          html: params.html
        })
      });
      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }
      return { success: true };
    }
    return { success: false, error: "Provider not supported" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
async function sendTrialExpiredEmail(to, customerName, trialEndDate, config) {
  const formattedDate = trialEndDate.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  const subject = "O seu per\xEDodo de teste ImoLead AI Pro expirou";
  const body = `Ol\xE1 ${customerName},

O seu per\xEDodo de teste gratuito do ImoLead AI Pro terminou em ${formattedDate}.

Para continuar a usar todas as funcionalidades da plataforma, incluindo:
- Prospe\xE7\xE3o autom\xE1tica de leads
- Classifica\xE7\xE3o com IA
- Mensagens autom\xE1ticas via WhatsApp e Email
- Relat\xF3rios di\xE1rios
- CRM integrado

Por favor, subscreva um dos nossos planos:

\u{1F3E0} ImoLead Basic - \u20AC39/m\xEAs
   Ideal para consultores individuais

\u{1F3E2} ImoLead Pro - \u20AC99.99/m\xEAs
   Para equipas e ag\xEAncias imobili\xE1rias

Aceda \xE0 sua conta em: https://imo-lead-ai-pro.replit.app/loja

Se tiver alguma quest\xE3o, responda a este email.

Cumprimentos,
Equipa ImoLead AI Pro`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .plan { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0; }
    .plan-title { font-size: 18px; font-weight: bold; color: #1e3a5f; }
    .plan-price { font-size: 24px; color: #2563eb; font-weight: bold; }
    .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ImoLead AI Pro</h1>
      <p>O seu per\xEDodo de teste terminou</p>
    </div>
    <div class="content">
      <p>Ol\xE1 <strong>${customerName}</strong>,</p>
      <p>O seu per\xEDodo de teste gratuito do ImoLead AI Pro terminou em <strong>${formattedDate}</strong>.</p>
      <p>Para continuar a usar todas as funcionalidades da plataforma, subscreva um dos nossos planos:</p>
      
      <div class="plan">
        <div class="plan-title">\u{1F3E0} ImoLead Basic</div>
        <div class="plan-price">\u20AC39/m\xEAs</div>
        <p>Ideal para consultores individuais</p>
      </div>
      
      <div class="plan">
        <div class="plan-title">\u{1F3E2} ImoLead Pro</div>
        <div class="plan-price">\u20AC99.99/m\xEAs</div>
        <p>Para equipas e ag\xEAncias imobili\xE1rias</p>
      </div>
      
      <center>
        <a href="https://imo-lead-ai-pro.replit.app/loja" class="btn">Ver Planos</a>
      </center>
      
      <p style="margin-top: 30px;">Se tiver alguma quest\xE3o, responda a este email.</p>
      <p>Cumprimentos,<br><strong>Equipa ImoLead AI Pro</strong></p>
    </div>
    <div class="footer">
      <p>\xA9 2025 ImoLead AI Pro. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`;
  return sendEmail({ to, subject, body, html }, config);
}
async function sendWhatsApp(phone, message, config) {
  const cleanPhone = phone.replace(/\s+/g, "").replace(/^\+/, "");
  if (!config?.apiKey || !config?.phoneNumberId) {
    const encodedMessage = encodeURIComponent(message);
    const fallbackUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    console.log("WhatsApp Business API not configured - using fallback URL");
    return { success: true, fallbackUrl };
  }
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "text",
          text: { body: message }
        })
      }
    );
    if (!response.ok) {
      const error = await response.text();
      const encodedMessage = encodeURIComponent(message);
      return {
        success: false,
        error,
        fallbackUrl: `https://wa.me/${cleanPhone}?text=${encodedMessage}`
      };
    }
    return { success: true };
  } catch (error) {
    const encodedMessage = encodeURIComponent(message);
    return {
      success: false,
      error: error.message,
      fallbackUrl: `https://wa.me/${cleanPhone}?text=${encodedMessage}`
    };
  }
}
var openai2;
var init_emailService = __esm({
  "server/services/emailService.ts"() {
    "use strict";
    openai2 = new OpenAI2({ apiKey: process.env.OPENAI_API_KEY });
  }
});

// server/services/casafariService.ts
import OpenAI4 from "openai";
async function searchCasafari(params, apiKey) {
  if (!apiKey) {
    console.log("Casafari API key not configured - returning mock data for demo");
    return { listings: generateMockListings(params) };
  }
  try {
    const queryParams = new URLSearchParams();
    if (params.location) queryParams.append("location", params.location);
    if (params.priceMin) queryParams.append("price_min", params.priceMin.toString());
    if (params.priceMax) queryParams.append("price_max", params.priceMax.toString());
    if (params.propertyType) queryParams.append("property_type", params.propertyType);
    const response = await fetch(
      `https://api.casafari.com/v1/listings?${queryParams.toString()}`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );
    if (!response.ok) {
      const error = await response.text();
      return { listings: [], error };
    }
    const data = await response.json();
    return { listings: normalizeListings(data.listings || []) };
  } catch (error) {
    console.error("Casafari API error:", error);
    return { listings: [], error: error.message };
  }
}
function normalizeListings(rawListings) {
  return rawListings.map((listing, index) => ({
    id: listing.id || `casafari-${Date.now()}-${index}`,
    title: listing.title || listing.description?.substring(0, 100) || "Propriedade",
    price: formatPrice(listing.price),
    location: listing.location || listing.address || "Portugal",
    propertyType: normalizePropertyType(listing.property_type || listing.type),
    bedrooms: listing.bedrooms,
    area: listing.area,
    contact: listing.contact_phone || listing.phone || "",
    email: listing.contact_email || listing.email || "",
    source: "Casafari",
    url: listing.url,
    description: listing.description
  }));
}
function formatPrice(price) {
  if (!price) return "Sob consulta";
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(numPrice);
}
function normalizePropertyType(type) {
  const typeMap = {
    apartment: "Apartamento",
    house: "Moradia",
    villa: "Moradia",
    land: "Terreno",
    commercial: "Comercial",
    office: "Comercial",
    shop: "Comercial"
  };
  return typeMap[type?.toLowerCase()] || "Outro";
}
function generateMockListings(params) {
  const locations = params.location ? [params.location] : ["Lisboa", "Porto", "Cascais", "Sintra", "Oeiras"];
  const propertyTypes = params.propertyType ? [params.propertyType] : ["Apartamento", "Moradia", "Terreno"];
  const mockListings = [];
  const count = Math.floor(Math.random() * 5) + 3;
  for (let i = 0; i < count; i++) {
    const location = locations[Math.floor(Math.random() * locations.length)];
    const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const basePrice = params.priceMin || 15e4;
    const maxPrice = params.priceMax || 8e5;
    const price = Math.floor(Math.random() * (maxPrice - basePrice) + basePrice);
    const bedrooms = Math.floor(Math.random() * 4) + 1;
    const area = Math.floor(Math.random() * 150) + 50;
    mockListings.push({
      id: `casafari-demo-${Date.now()}-${i}`,
      title: `${propertyType} T${bedrooms} em ${location}`,
      price: formatPrice(price),
      location,
      propertyType,
      bedrooms,
      area,
      contact: `+351 9${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 1e7).toString().padStart(7, "0")}`,
      email: `proprietario${i + 1}@example.com`,
      source: "Casafari",
      description: `Excelente ${propertyType.toLowerCase()} com ${bedrooms} quartos e ${area}m2 em ${location}.`
    });
  }
  return mockListings;
}
function convertToLead(listing) {
  return {
    name: extractOwnerName(listing) || `Proprietario - ${listing.location}`,
    property: listing.title,
    propertyType: listing.propertyType,
    location: listing.location,
    price: listing.price,
    source: "Casafari",
    contact: listing.contact || "",
    email: listing.email
  };
}
function extractOwnerName(listing) {
  return null;
}
async function analyzeListingWithAI(listing) {
  try {
    const prompt = `Analisa este anuncio imobiliario e classifica a qualidade do lead para um consultor imobiliario.

Dados do Anuncio:
- Titulo: ${listing.title}
- Localizacao: ${listing.location}
- Preco: ${listing.price}
- Tipo: ${listing.propertyType}
- Quartos: ${listing.bedrooms || "N/A"}
- Area: ${listing.area ? `${listing.area}m2` : "N/A"}
- Contacto: ${listing.contact ? "Disponivel" : "Nao disponivel"}
- Email: ${listing.email ? "Disponivel" : "Nao disponivel"}
- Fonte: ${listing.source}

Criterios de avaliacao:
1. Qualidade da localizacao (Lisboa, Porto, Cascais = premium)
2. Relacao preco/mercado
3. Completude das informacoes de contacto
4. Potencial de negocio

Responde em JSON:
{
  "score": numero de 0 a 100,
  "status": "quente" | "morno" | "frio",
  "reasoning": "explicacao curta em portugues"
}`;
    const response = await openai4.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3
    });
    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      score: result.score || 50,
      status: result.status || "morno",
      reasoning: result.reasoning || "Analise padrao aplicada."
    };
  } catch (error) {
    console.error("AI analysis error:", error);
    const hasContact = !!(listing.contact || listing.email);
    const isPremiumLocation = ["Lisboa", "Porto", "Cascais", "Sintra"].some(
      (loc) => listing.location.toLowerCase().includes(loc.toLowerCase())
    );
    let score = 50;
    if (hasContact) score += 20;
    if (isPremiumLocation) score += 15;
    return {
      score,
      status: score >= 70 ? "quente" : score >= 50 ? "morno" : "frio",
      reasoning: "Classificacao baseada em criterios padrao (contacto e localizacao)."
    };
  }
}
async function checkDuplicateLead(listing, existingLeads) {
  const normalizedContact = listing.contact?.replace(/\s+/g, "").replace(/^\+/, "");
  const normalizedEmail = listing.email?.toLowerCase();
  return existingLeads.some((lead) => {
    const existingContact = lead.contact?.replace(/\s+/g, "").replace(/^\+/, "");
    const existingEmail = lead.email?.toLowerCase();
    if (normalizedContact && existingContact === normalizedContact) return true;
    if (normalizedEmail && existingEmail === normalizedEmail) return true;
    if (lead.location.toLowerCase() === listing.location.toLowerCase() && (!normalizedContact || !existingContact)) {
      return true;
    }
    return false;
  });
}
var openai4;
var init_casafariService = __esm({
  "server/services/casafariService.ts"() {
    "use strict";
    openai4 = new OpenAI4({ apiKey: process.env.OPENAI_API_KEY });
  }
});

// server/services/schedulerService.ts
var schedulerService_exports = {};
__export(schedulerService_exports, {
  scheduleManualMessage: () => scheduleManualMessage,
  startScheduler: () => startScheduler
});
function startScheduler() {
  if (schedulerRunning) return;
  schedulerRunning = true;
  console.log("Automation scheduler started");
  setInterval(async () => {
    try {
      await processMessageJobs();
      await processFollowups();
      await processCasafariSearches();
    } catch (error) {
      console.error("Scheduler error:", error);
    }
  }, SCHEDULER_INTERVAL);
}
async function processMessageJobs() {
  const pendingJobs = await storage.getPendingMessageJobs();
  const now = /* @__PURE__ */ new Date();
  for (const job of pendingJobs) {
    if (new Date(job.scheduledAt) > now) continue;
    const settings = await storage.getAutomationSettings(job.customerId);
    if (!settings?.enabled) {
      await storage.updateMessageJob(job.id, { status: "cancelled" });
      continue;
    }
    if (isQuietHours(settings)) {
      continue;
    }
    try {
      const lead = await storage.getLead(job.leadId);
      if (!lead || lead.optOut) {
        await storage.updateMessageJob(job.id, { status: "cancelled" });
        continue;
      }
      let result;
      if (job.channel === "whatsapp" && lead.contact) {
        result = await sendWhatsApp(lead.contact, job.content);
      } else if (job.channel === "email" && lead.email) {
        result = await sendEmail({
          to: lead.email,
          subject: job.subject || `ImoLead - ${lead.location}`,
          body: job.content
        });
      } else {
        result = { success: false, error: "No valid contact method" };
      }
      if (result.success) {
        await storage.updateMessageJob(job.id, {
          status: "sent",
          sentAt: /* @__PURE__ */ new Date(),
          metadata: result.fallbackUrl ? { fallbackUrl: result.fallbackUrl } : void 0
        });
        await storage.createInteraction({
          leadId: job.leadId,
          type: job.channel,
          content: job.content,
          metadata: {
            automated: true,
            trigger: job.trigger,
            fallbackUrl: result.fallbackUrl
          }
        });
        await trackUsage(job.customerId, job.channel === "whatsapp" ? "messages_whatsapp" : "messages_email", 1, "automation");
      } else {
        const attempts = (job.attempts || 0) + 1;
        if (attempts >= 3) {
          await storage.updateMessageJob(job.id, {
            status: "failed",
            attempts,
            lastError: result.error
          });
        } else {
          await storage.updateMessageJob(job.id, {
            attempts,
            lastError: result.error,
            scheduledAt: new Date(Date.now() + 5 * 60 * 1e3)
          });
        }
      }
    } catch (error) {
      console.error("Message job error:", error);
      await storage.updateMessageJob(job.id, {
        attempts: (job.attempts || 0) + 1,
        lastError: error.message
      });
    }
  }
}
async function processFollowups() {
  const allSettings = await storage.getAllAutomationSettings();
  const now = /* @__PURE__ */ new Date();
  for (const settings of allSettings) {
    if (!settings.enabled) continue;
    const leads2 = await storage.getLeadsByCustomer(settings.customerId);
    for (const lead of leads2) {
      if (lead.optOut) continue;
      const lastInteraction = await storage.getLastInteraction(lead.id);
      if (!lastInteraction) continue;
      const daysSinceContact = Math.floor(
        (now.getTime() - new Date(lastInteraction.createdAt).getTime()) / (1e3 * 60 * 60 * 24)
      );
      const existingJobs = await storage.getMessageJobsForLead(lead.id);
      const hasPendingJob = existingJobs.some((j) => j.status === "pending");
      if (hasPendingJob) continue;
      let trigger = null;
      if (settings.autoFollowup3Days && daysSinceContact >= 3 && daysSinceContact < 7) {
        const has3dFollowup = existingJobs.some((j) => j.trigger === "followup_3d");
        if (!has3dFollowup) trigger = "followup_3d";
      } else if (settings.autoFollowup7Days && daysSinceContact >= 7) {
        const has7dFollowup = existingJobs.some((j) => j.trigger === "followup_7d");
        if (!has7dFollowup) trigger = "followup_7d";
      }
      if (trigger) {
        await scheduleFollowupMessage(settings, lead, trigger);
      }
    }
  }
}
async function scheduleFollowupMessage(settings, lead, trigger) {
  const channel = settings.preferredChannel;
  const hasContact = channel === "whatsapp" ? !!lead.contact : !!lead.email;
  if (!hasContact) return;
  const message = await generateAIMessage(
    lead.name,
    lead.location,
    lead.property,
    lead.price,
    trigger,
    channel
  );
  const scheduledAt = getNextSendTime(settings);
  await storage.createMessageJob({
    customerId: settings.customerId,
    leadId: lead.id,
    channel,
    content: message.content,
    subject: message.subject,
    trigger,
    scheduledAt
  });
}
async function processCasafariSearches() {
  const allSettings = await storage.getAllAutomationSettings();
  const now = /* @__PURE__ */ new Date();
  const currentHour = now.getHours();
  for (const settings of allSettings) {
    if (!settings.enabled || !settings.casafariEnabled) continue;
    if (!settings.casafariSearchParams) continue;
    const shouldRun = settings.casafariSchedule === "daily" && currentHour === 9 || settings.casafariSchedule === "twice_daily" && (currentHour === 9 || currentHour === 15) || settings.casafariSchedule === "weekly" && now.getDay() === 1 && currentHour === 9;
    if (!shouldRun) continue;
    const params = settings.casafariSearchParams;
    const casafariApiKey = process.env.CASAFARI_API_KEY;
    const { listings, error } = await searchCasafari(params, casafariApiKey);
    if (error) {
      console.error("Casafari search error:", error);
      continue;
    }
    await trackUsage(settings.customerId, "casafari_searches", 1, "automation");
    const existingLeads = await storage.getLeadsByCustomer(settings.customerId);
    const existingContactInfo = existingLeads.map((l) => ({
      contact: l.contact,
      email: l.email || void 0,
      location: l.location
    }));
    for (const listing of listings) {
      const isDuplicate = await checkDuplicateLead(listing, existingContactInfo);
      if (isDuplicate) continue;
      const analysis = await analyzeListingWithAI(listing);
      await trackUsage(settings.customerId, "leads_analyzed", 1, "casafari");
      if (analysis.score < 40) continue;
      const leadData = convertToLead(listing);
      const newLead = await storage.createLead({
        ...leadData,
        aiScore: analysis.score,
        aiReasoning: analysis.reasoning,
        status: analysis.status
      });
      await storage.createInteraction({
        leadId: newLead.id,
        type: "note",
        content: `Lead descoberto automaticamente via Casafari. Score: ${analysis.score}. ${analysis.reasoning}`,
        metadata: { automated: true, source: "casafari" }
      });
      if (settings.autoMessageNewLead) {
        await scheduleNewLeadMessage(settings, newLead);
      }
    }
  }
}
async function scheduleNewLeadMessage(settings, lead) {
  const channel = settings.preferredChannel;
  const hasContact = channel === "whatsapp" ? !!lead.contact : !!lead.email;
  if (!hasContact) return;
  const message = await generateAIMessage(
    lead.name,
    lead.location,
    lead.property,
    lead.price,
    "new_lead",
    channel
  );
  const scheduledAt = getNextSendTime(settings);
  await storage.createMessageJob({
    customerId: settings.customerId,
    leadId: lead.id,
    channel,
    content: message.content,
    subject: message.subject,
    trigger: "new_lead",
    scheduledAt
  });
}
function isQuietHours(settings) {
  const now = /* @__PURE__ */ new Date();
  const currentHour = now.getHours();
  const start = settings.quietHoursStart || 21;
  const end = settings.quietHoursEnd || 9;
  if (start > end) {
    return currentHour >= start || currentHour < end;
  }
  return currentHour >= start && currentHour < end;
}
function getNextSendTime(settings) {
  const now = /* @__PURE__ */ new Date();
  const currentHour = now.getHours();
  const end = settings.quietHoursEnd || 9;
  if (isQuietHours(settings)) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + (currentHour >= (settings.quietHoursStart || 21) ? 1 : 0));
    tomorrow.setHours(end, 0, 0, 0);
    return tomorrow;
  }
  return new Date(now.getTime() + 5 * 60 * 1e3);
}
async function trackUsage(customerId, metric, quantity, source) {
  const period = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  await storage.createUsageRecord({
    customerId,
    metric,
    quantity,
    period,
    source
  });
}
async function scheduleManualMessage(customerId, leadId, channel, content, subject) {
  const lead = await storage.getLead(leadId);
  if (!lead) throw new Error("Lead not found");
  await storage.createMessageJob({
    customerId,
    leadId,
    channel,
    content,
    subject,
    trigger: "manual",
    scheduledAt: /* @__PURE__ */ new Date()
  });
  await trackUsage(customerId, channel === "whatsapp" ? "messages_whatsapp" : "messages_email", 1, "manual");
}
var SCHEDULER_INTERVAL, schedulerRunning;
var init_schedulerService = __esm({
  "server/services/schedulerService.ts"() {
    "use strict";
    init_storage();
    init_emailService();
    init_casafariService();
    SCHEDULER_INTERVAL = 6e4;
    schedulerRunning = false;
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
init_storage();
init_schema();
import { createServer } from "http";

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

Lead:
- Nome: ${leadData.name}
- Im\xF3vel: ${leadData.property}
- Tipo: ${leadData.propertyType}
- Localiza\xE7\xE3o: ${leadData.location}
- Pre\xE7o: ${leadData.price}
- Contacto: ${leadData.contact}
- Origem: ${leadData.source}

Classifica este lead como "quente" (alto potencial), "morno" (m\xE9dio potencial) ou "frio" (baixo potencial) baseado em:
1. Qualidade do im\xF3vel e localiza\xE7\xE3o
2. Pre\xE7o de mercado e razoabilidade
3. Completude das informa\xE7\xF5es de contacto
4. Origem do lead (Casafari e Idealista tendem a ter mais qualidade)

Responde APENAS com um objeto JSON neste formato exato:
{
  "status": "quente" | "morno" | "frio",
  "score": n\xFAmero entre 0-100,
  "reasoning": "breve explica\xE7\xE3o em portugu\xEAs (m\xE1x 100 palavras)"
}`;
  try {
    const result = await pRetry(
      async () => {
        const completion = await client.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content: "\xC9s um especialista em an\xE1lise de leads imobili\xE1rios em Portugal. Responde sempre com JSON v\xE1lido."
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
    console.log(`Lead analyzed with ${openrouter ? "DeepSeek" : "OpenAI"}: ${result.status} (score: ${result.score})`);
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
async function chatWithAI(message, context) {
  const client = openrouter || openai;
  const model = openrouter ? "deepseek/deepseek-chat-v3.1" : "gpt-4o-mini";
  if (!client) {
    return "O assistente IA est\xE1 temporariamente indispon\xEDvel. Por favor, configure a API key nas defini\xE7\xF5es para ativar todas as funcionalidades de IA.";
  }
  const systemPrompt = `\xC9s o assistente IA do ImoLead Pro, uma plataforma de gest\xE3o de leads imobili\xE1rios em Portugal.

Contexto atual do utilizador:
- Total de leads: ${context?.totalLeads || 0}
- Leads quentes: ${context?.hotLeads || 0}
- Leads mornos: ${context?.warmLeads || 0}
- Leads frios: ${context?.coldLeads || 0}

As tuas capacidades incluem:
1. Analisar e priorizar leads baseado no potencial de convers\xE3o
2. Gerar mensagens personalizadas para contacto com clientes
3. Sugerir estrat\xE9gias de follow-up
4. Dar dicas sobre o mercado imobili\xE1rio portugu\xEAs
5. Ajudar com templates de WhatsApp e email
6. Fornecer insights sobre melhores pr\xE1ticas de prospe\xE7\xE3o

Regras:
- Responde sempre em portugu\xEAs de Portugal
- S\xEA conciso mas informativo
- Usa formata\xE7\xE3o clara (listas quando apropriado)
- Foca em a\xE7\xF5es pr\xE1ticas e conselhos \xFAteis
- Menciona dados espec\xEDficos do contexto quando relevante`;
  try {
    const result = await pRetry(
      async () => {
        const completion = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          temperature: 0.7,
          max_tokens: 1e3
        });
        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error("No response from AI");
        }
        return content;
      },
      {
        retries: 2,
        minTimeout: 1e3,
        maxTimeout: 5e3,
        shouldRetry: (error) => isRateLimitError(error)
      }
    );
    console.log(`AI chat response generated with ${openrouter ? "DeepSeek" : "OpenAI"}`);
    return result;
  } catch (error) {
    console.error("Error in AI chat:", error);
    return "Desculpe, ocorreu um erro ao processar o seu pedido. Por favor, tente novamente em alguns momentos.";
  }
}

// server/routes.ts
init_emailService();

// server/lib/casafari.ts
var MOCK_PROPERTIES = [
  {
    id: "cf-001",
    title: "Apartamento T3 com Vista Rio - Parque das Na\xE7\xF5es",
    description: "Magn\xEDfico apartamento T3 totalmente renovado com vista desafogada sobre o rio Tejo. Cozinha equipada, ar condicionado, lugar de garagem.",
    price: 485e3,
    pricePerSqm: 4850,
    propertyType: "Apartamento",
    transactionType: "sale",
    location: {
      address: "Rua do Mar Vermelho, 15",
      city: "Lisboa",
      district: "Parque das Na\xE7\xF5es",
      postalCode: "1990-073",
      coordinates: { lat: 38.7677, lng: -9.0931 }
    },
    features: {
      bedrooms: 3,
      bathrooms: 2,
      area: 100,
      floor: 8,
      hasParking: true,
      hasGarden: false,
      hasPool: false,
      hasElevator: true,
      energyCertificate: "B"
    },
    images: [],
    source: "Casafari",
    sourceUrl: "https://casafari.com/property/cf-001",
    listedAt: /* @__PURE__ */ new Date("2024-11-15"),
    updatedAt: /* @__PURE__ */ new Date("2024-11-28"),
    sellerContact: {
      name: "Ant\xF3nio Silva",
      phone: "+351 912 345 678",
      type: "private"
    }
  },
  {
    id: "cf-002",
    title: "Moradia V4 com Piscina - Cascais",
    description: "Moradia de luxo com 4 quartos, piscina aquecida, jardim privativo e vista mar. Acabamentos de alta qualidade.",
    price: 125e4,
    pricePerSqm: 5208,
    propertyType: "Moradia",
    transactionType: "sale",
    location: {
      address: "Avenida das Palmeiras, 42",
      city: "Cascais",
      district: "Estoril",
      postalCode: "2765-045",
      coordinates: { lat: 38.7013, lng: -9.3975 }
    },
    features: {
      bedrooms: 4,
      bathrooms: 4,
      area: 240,
      hasParking: true,
      hasGarden: true,
      hasPool: true,
      hasElevator: false,
      energyCertificate: "A"
    },
    images: [],
    source: "Casafari",
    sourceUrl: "https://casafari.com/property/cf-002",
    listedAt: /* @__PURE__ */ new Date("2024-10-20"),
    updatedAt: /* @__PURE__ */ new Date("2024-11-25"),
    sellerContact: {
      name: "RE/MAX Cascais",
      phone: "+351 214 567 890",
      email: "cascais@remax.pt",
      type: "agency"
    }
  },
  {
    id: "cf-003",
    title: "T2 Renovado - Baixa do Porto",
    description: "Apartamento T2 totalmente renovado no cora\xE7\xE3o do Porto. Ideal para habita\xE7\xE3o pr\xF3pria ou investimento. Elevada rentabilidade.",
    price: 295e3,
    pricePerSqm: 4214,
    propertyType: "Apartamento",
    transactionType: "sale",
    location: {
      address: "Rua das Flores, 78",
      city: "Porto",
      district: "Baixa",
      postalCode: "4050-265",
      coordinates: { lat: 41.1456, lng: -8.6127 }
    },
    features: {
      bedrooms: 2,
      bathrooms: 1,
      area: 70,
      floor: 2,
      hasParking: false,
      hasGarden: false,
      hasPool: false,
      hasElevator: true,
      energyCertificate: "C"
    },
    images: [],
    source: "Casafari",
    sourceUrl: "https://casafari.com/property/cf-003",
    listedAt: /* @__PURE__ */ new Date("2024-11-01"),
    updatedAt: /* @__PURE__ */ new Date("2024-11-30"),
    sellerContact: {
      name: "Maria Costa",
      phone: "+351 918 765 432",
      email: "maria.costa@email.pt",
      type: "private"
    }
  },
  {
    id: "cf-004",
    title: "Loja Comercial - Avenida da Liberdade",
    description: "Espa\xE7o comercial de 150m\xB2 em localiza\xE7\xE3o premium. Ideal para com\xE9rcio de luxo ou servi\xE7os. Grande montra.",
    price: 89e4,
    pricePerSqm: 5933,
    propertyType: "Comercial",
    transactionType: "sale",
    location: {
      address: "Avenida da Liberdade, 180",
      city: "Lisboa",
      district: "Avenidas Novas",
      postalCode: "1250-146",
      coordinates: { lat: 38.7204, lng: -9.1456 }
    },
    features: {
      bedrooms: 0,
      bathrooms: 2,
      area: 150,
      floor: 0,
      hasParking: false,
      hasGarden: false,
      hasPool: false,
      hasElevator: false,
      energyCertificate: "D"
    },
    images: [],
    source: "Casafari",
    sourceUrl: "https://casafari.com/property/cf-004",
    listedAt: /* @__PURE__ */ new Date("2024-09-10"),
    updatedAt: /* @__PURE__ */ new Date("2024-11-20"),
    sellerContact: {
      name: "Cushman & Wakefield",
      phone: "+351 213 456 789",
      email: "lisboa@cushwake.pt",
      type: "agency"
    }
  },
  {
    id: "cf-005",
    title: "Terreno para Constru\xE7\xE3o - Sintra",
    description: "Terreno de 2000m\xB2 com projeto aprovado para moradia unifamiliar. Vistas para a Serra de Sintra. Acesso por estrada alcatroada.",
    price: 18e4,
    pricePerSqm: 90,
    propertyType: "Terreno",
    transactionType: "sale",
    location: {
      address: "Estrada da Malveira, s/n",
      city: "Sintra",
      district: "Colares",
      postalCode: "2705-001",
      coordinates: { lat: 38.8029, lng: -9.4448 }
    },
    features: {
      bedrooms: 0,
      bathrooms: 0,
      area: 2e3,
      hasParking: false,
      hasGarden: false,
      hasPool: false,
      hasElevator: false
    },
    images: [],
    source: "Casafari",
    sourceUrl: "https://casafari.com/property/cf-005",
    listedAt: /* @__PURE__ */ new Date("2024-08-15"),
    updatedAt: /* @__PURE__ */ new Date("2024-11-10"),
    sellerContact: {
      name: "Jo\xE3o Ferreira",
      phone: "+351 916 234 567",
      type: "private"
    }
  },
  {
    id: "cf-006",
    title: "T1 para Arrendamento - Alfama",
    description: "Est\xFAdio encantador em edif\xEDcio reabilitado no cora\xE7\xE3o de Alfama. Mobiliado e equipado. Ideal para jovem profissional.",
    price: 950,
    pricePerSqm: 23.75,
    propertyType: "Apartamento",
    transactionType: "rent",
    location: {
      address: "Beco do Surra, 5",
      city: "Lisboa",
      district: "Alfama",
      postalCode: "1100-045",
      coordinates: { lat: 38.7134, lng: -9.1282 }
    },
    features: {
      bedrooms: 1,
      bathrooms: 1,
      area: 40,
      floor: 3,
      hasParking: false,
      hasGarden: false,
      hasPool: false,
      hasElevator: false,
      energyCertificate: "C"
    },
    images: [],
    source: "Casafari",
    sourceUrl: "https://casafari.com/property/cf-006",
    listedAt: /* @__PURE__ */ new Date("2024-11-20"),
    updatedAt: /* @__PURE__ */ new Date("2024-11-29"),
    sellerContact: {
      name: "Ana Rodrigues",
      phone: "+351 914 567 890",
      email: "ana.rodrigues@gmail.com",
      type: "private"
    }
  }
];
var CasafariService = class {
  apiKey;
  constructor(apiKey) {
    this.apiKey = apiKey || null;
  }
  async searchProperties(params) {
    let filteredProperties = [...MOCK_PROPERTIES];
    if (params.location) {
      const locationLower = params.location.toLowerCase();
      filteredProperties = filteredProperties.filter(
        (p) => p.location.city.toLowerCase().includes(locationLower) || p.location.district.toLowerCase().includes(locationLower) || p.location.address.toLowerCase().includes(locationLower)
      );
    }
    if (params.propertyType) {
      filteredProperties = filteredProperties.filter(
        (p) => p.propertyType.toLowerCase() === params.propertyType.toLowerCase()
      );
    }
    if (params.transactionType) {
      filteredProperties = filteredProperties.filter(
        (p) => p.transactionType === params.transactionType
      );
    }
    if (params.minPrice !== void 0) {
      filteredProperties = filteredProperties.filter((p) => p.price >= params.minPrice);
    }
    if (params.maxPrice !== void 0) {
      filteredProperties = filteredProperties.filter((p) => p.price <= params.maxPrice);
    }
    if (params.minArea !== void 0) {
      filteredProperties = filteredProperties.filter((p) => p.features.area >= params.minArea);
    }
    if (params.maxArea !== void 0) {
      filteredProperties = filteredProperties.filter((p) => p.features.area <= params.maxArea);
    }
    if (params.bedrooms !== void 0) {
      filteredProperties = filteredProperties.filter(
        (p) => p.features.bedrooms >= params.bedrooms
      );
    }
    const limit = params.limit || 10;
    const offset = params.offset || 0;
    const paginatedProperties = filteredProperties.slice(offset, offset + limit);
    return {
      properties: paginatedProperties,
      total: filteredProperties.length,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < filteredProperties.length
    };
  }
  async getPropertyById(id) {
    const property = MOCK_PROPERTIES.find((p) => p.id === id);
    return property || null;
  }
  async convertToLead(property) {
    const priceStr = property.transactionType === "rent" ? `${property.price}\u20AC/m\xEAs` : `${property.price.toLocaleString("pt-PT")}\u20AC`;
    return {
      name: property.sellerContact?.name || "Propriet\xE1rio",
      contact: property.sellerContact?.phone || "",
      email: property.sellerContact?.email || null,
      property: property.title,
      propertyType: property.propertyType,
      location: `${property.location.city}, ${property.location.district}`,
      price: priceStr,
      source: "Casafari",
      notes: `${property.description}

Fonte: ${property.sourceUrl}
T${property.features.bedrooms} | ${property.features.area}m\xB2 | Cert. Energ\xE9tico: ${property.features.energyCertificate || "N/A"}`
    };
  }
};
var casafariService = new CasafariService(process.env.CASAFARI_API_KEY);

// server/lib/payments.ts
var PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 39,
    currency: "EUR",
    interval: "month",
    features: [
      "At\xE9 50 leads por m\xEAs",
      "Integra\xE7\xE3o Casafari API",
      "Pesquisa em Idealista + OLX",
      "Classifica\xE7\xE3o com IA integrada",
      "WhatsApp Business integrado",
      "Mensagens autom\xE1ticas com IA",
      "Relat\xF3rios semanais",
      "Pagamento via MBWay",
      "Suporte por email"
    ]
  },
  {
    id: "basic-yearly",
    name: "Basic Anual",
    price: 390,
    currency: "EUR",
    interval: "year",
    features: [
      "At\xE9 50 leads por m\xEAs",
      "Integra\xE7\xE3o Casafari API",
      "Pesquisa em Idealista + OLX",
      "Classifica\xE7\xE3o com IA integrada",
      "WhatsApp Business integrado",
      "Mensagens autom\xE1ticas com IA",
      "Relat\xF3rios semanais",
      "Pagamento via MBWay",
      "Suporte por email",
      "2 meses gr\xE1tis (poupan\xE7a de 78\u20AC)"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    price: 99.99,
    currency: "EUR",
    interval: "month",
    features: [
      "Leads ilimitados",
      "Integra\xE7\xE3o Casafari API completa",
      "Todos os sites (Idealista, OLX, Casafari)",
      "IA avan\xE7ada com an\xE1lise preditiva",
      "WhatsApp Business integrado",
      "Disparo autom\xE1tico de mensagens IA",
      "Templates personaliz\xE1veis ilimitados",
      "Relat\xF3rios di\xE1rios + PDF",
      "Integra\xE7\xE3o Google Calendar",
      "Pagamento via MBWay",
      "Suporte priorit\xE1rio 24/7"
    ]
  },
  {
    id: "pro-yearly",
    name: "Pro Anual",
    price: 999,
    currency: "EUR",
    interval: "year",
    features: [
      "Leads ilimitados",
      "Integra\xE7\xE3o Casafari API completa",
      "Todos os sites (Idealista, OLX, Casafari)",
      "IA avan\xE7ada com an\xE1lise preditiva",
      "WhatsApp Business integrado",
      "Disparo autom\xE1tico de mensagens IA",
      "Templates personaliz\xE1veis ilimitados",
      "Relat\xF3rios di\xE1rios + PDF",
      "Integra\xE7\xE3o Google Calendar",
      "Pagamento via MBWay",
      "Suporte priorit\xE1rio 24/7",
      "2 meses gr\xE1tis (poupan\xE7a de 200\u20AC)"
    ]
  }
];
var PaymentService = class {
  mbwayKey;
  stripeKey;
  constructor() {
    this.mbwayKey = process.env.MBWAY_API_KEY || null;
    this.stripeKey = process.env.STRIPE_SECRET_KEY || null;
  }
  getPlans() {
    return PLANS;
  }
  getPlan(planId) {
    return PLANS.find((p) => p.id === planId);
  }
  async createMBWayPayment(request) {
    const requestId = `mbway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      requestId,
      orderId: request.orderId,
      amount: request.amount.toFixed(2),
      status: "000",
      message: "Pagamento iniciado. Por favor confirme no seu telem\xF3vel dentro de 4 minutos."
    };
  }
  async initiatePayment(request) {
    const plan = this.getPlan(request.planId);
    if (!plan) {
      return {
        success: false,
        paymentId: "",
        status: "failed",
        message: "Plano n\xE3o encontrado"
      };
    }
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (request.paymentMethod === "mbway") {
      const formattedPhone = request.customerPhone.replace(/\s/g, "").replace("+", "");
      const phoneNumber = formattedPhone.startsWith("351") ? formattedPhone : `351${formattedPhone}`;
      const mbwayResult = await this.createMBWayPayment({
        orderId: paymentId,
        amount: plan.price,
        mobileNumber: phoneNumber,
        email: request.customerEmail,
        description: `ImoLead AI Pro - Plano ${plan.name}`
      });
      return {
        success: true,
        paymentId,
        status: "pending",
        message: mbwayResult.message,
        expiresAt: new Date(Date.now() + 4 * 60 * 1e3)
      };
    }
    if (request.paymentMethod === "multibanco") {
      const entity = "21312";
      const reference = Math.floor(1e8 + Math.random() * 9e8).toString();
      return {
        success: true,
        paymentId,
        status: "pending",
        message: `Refer\xEAncia Multibanco gerada:
Entidade: ${entity}
Refer\xEAncia: ${reference}
Valor: ${plan.price}\u20AC
V\xE1lida por 72 horas.`,
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1e3)
      };
    }
    return {
      success: true,
      paymentId,
      status: "pending",
      message: "Redirecionando para p\xE1gina de pagamento...",
      redirectUrl: `/checkout/${paymentId}`
    };
  }
  async checkPaymentStatus(paymentId) {
    return {
      success: true,
      paymentId,
      status: "completed",
      message: "Pagamento confirmado com sucesso!"
    };
  }
  async processWebhook(payload) {
    console.log("Processing payment webhook:", payload);
    return { success: true, paymentId: payload.paymentId };
  }
};
var paymentService = new PaymentService();

// server/lib/whatsapp.ts
import OpenAI3 from "openai";
var openai3 = new OpenAI3({
  apiKey: process.env.OPENAI_API_KEY
});
var DEFAULT_TEMPLATES = [
  {
    id: "tpl-001",
    name: "Primeiro Contacto - Im\xF3vel Espec\xEDfico",
    category: "first_contact",
    content: `Ol\xE1 {{leadName}}! \u{1F44B}

Vi o seu an\xFAncio do im\xF3vel em {{propertyLocation}} e fiquei interessado/a.

{{propertyDescription}}

Seria poss\xEDvel agendar uma visita? Estou dispon\xEDvel esta semana.

Cumprimentos,
{{agentName}}
ImoLead AI Pro`,
    variables: ["leadName", "propertyLocation", "propertyDescription", "agentName"],
    isActive: true
  },
  {
    id: "tpl-002",
    name: "Follow-up - Sem Resposta",
    category: "follow_up",
    content: `Bom dia {{leadName}}! 

Enviei-lhe uma mensagem h\xE1 alguns dias sobre o im\xF3vel em {{propertyLocation}}.

Gostaria de saber se ainda est\xE1 dispon\xEDvel e se podemos agendar uma visita.

Aguardo o seu contacto.

Cumprimentos,
{{agentName}}`,
    variables: ["leadName", "propertyLocation", "agentName"],
    isActive: true
  },
  {
    id: "tpl-003",
    name: "Agendamento de Visita",
    category: "scheduling",
    content: `Ol\xE1 {{leadName}}!

Confirmo a visita ao im\xF3vel em {{propertyLocation}} para {{visitDate}} \xE0s {{visitTime}}.

Endere\xE7o: {{propertyAddress}}
Pre\xE7o: {{propertyPrice}}

Estarei \xE0 sua espera. Se precisar de remarcar, avise-me com anteced\xEAncia.

At\xE9 breve!
{{agentName}}`,
    variables: ["leadName", "propertyLocation", "visitDate", "visitTime", "propertyAddress", "propertyPrice", "agentName"],
    isActive: true
  },
  {
    id: "tpl-004",
    name: "Proposta de Valor",
    category: "offer",
    content: `Prezado/a {{leadName}},

Agrade\xE7o a visita ao im\xF3vel em {{propertyLocation}}.

Gostaria de apresentar uma proposta formal:
\u2022 Valor: {{offerAmount}}
\u2022 Condi\xE7\xF5es: {{offerConditions}}

Esta proposta \xE9 v\xE1lida por {{validityDays}} dias.

Fico a aguardar a sua resposta.

Com os melhores cumprimentos,
{{agentName}}`,
    variables: ["leadName", "propertyLocation", "offerAmount", "offerConditions", "validityDays", "agentName"],
    isActive: true
  },
  {
    id: "tpl-005",
    name: "Fecho de Neg\xF3cio",
    category: "closing",
    content: `Caro/a {{leadName}},

Excelente not\xEDcia! A proposta foi aceite. \u{1F389}

Pr\xF3ximos passos:
1. Contrato Promessa de Compra e Venda
2. Escritura no not\xE1rio
3. Entrega das chaves

Vou enviar toda a documenta\xE7\xE3o necess\xE1ria por email.

Parab\xE9ns pela aquisi\xE7\xE3o!

{{agentName}}
ImoLead AI Pro`,
    variables: ["leadName", "agentName"],
    isActive: true
  }
];
var WhatsAppService = class {
  apiKey;
  phoneNumberId;
  constructor() {
    this.apiKey = process.env.WHATSAPP_API_KEY || null;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || null;
  }
  getTemplates() {
    return DEFAULT_TEMPLATES;
  }
  getTemplate(id) {
    return DEFAULT_TEMPLATES.find((t) => t.id === id);
  }
  async generateAIMessage(params) {
    const messageTypeDescriptions = {
      first_contact: "primeiro contacto para demonstrar interesse no im\xF3vel",
      follow_up: "follow-up ap\xF3s n\xE3o ter recebido resposta",
      scheduling: "agendamento de visita ao im\xF3vel",
      offer: "apresenta\xE7\xE3o de proposta de compra",
      closing: "fecho de neg\xF3cio e pr\xF3ximos passos"
    };
    const urgencyLevel = {
      quente: "muito interessado e pronto para avan\xE7ar",
      morno: "interessado mas ainda a avaliar op\xE7\xF5es",
      frio: "contacto inicial para despertar interesse"
    };
    const prompt = `Gera uma mensagem WhatsApp profissional em portugu\xEAs de Portugal para um agente imobili\xE1rio.

Contexto:
- Nome do lead: ${params.leadName}
- Im\xF3vel: ${params.propertyDescription}
- Localiza\xE7\xE3o: ${params.propertyLocation}
- Pre\xE7o: ${params.propertyPrice}
- N\xEDvel de interesse do lead: ${urgencyLevel[params.leadStatus]}
- Tipo de mensagem: ${messageTypeDescriptions[params.messageType]}
- Nome do agente: ${params.agentName || "Agente ImoLead"}

Requisitos:
- Mensagem curta e direta (m\xE1ximo 200 palavras)
- Tom profissional mas amig\xE1vel
- Usar portugu\xEAs de Portugal (n\xE3o brasileiro)
- Incluir call-to-action claro
- N\xE3o usar emojis excessivos (m\xE1ximo 1-2)

Responde APENAS com a mensagem, sem explica\xE7\xF5es adicionais.`;
    try {
      const response = await openai3.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "\xC9s um assistente especializado em comunica\xE7\xE3o imobili\xE1ria em Portugal. Geras mensagens WhatsApp profissionais e eficazes." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      return response.choices[0]?.message?.content || this.getDefaultMessage(params);
    } catch (error) {
      console.warn("OpenAI unavailable for WhatsApp message generation, using template:", error);
      return this.getDefaultMessage(params);
    }
  }
  getDefaultMessage(params) {
    const templates = {
      first_contact: `Ol\xE1 ${params.leadName}!

Vi o seu an\xFAncio do ${params.propertyDescription} em ${params.propertyLocation} (${params.propertyPrice}) e gostaria de saber mais informa\xE7\xF5es.

Podemos agendar uma visita?

Cumprimentos,
${params.agentName || "Agente ImoLead"}`,
      follow_up: `Bom dia ${params.leadName}!

Gostaria de dar seguimento ao nosso contacto sobre o im\xF3vel em ${params.propertyLocation}.

Ainda est\xE1 dispon\xEDvel? Continuo interessado/a.

${params.agentName || "Agente ImoLead"}`,
      scheduling: `Ol\xE1 ${params.leadName}!

Gostaria de agendar uma visita ao im\xF3vel em ${params.propertyLocation}.

Est\xE1 dispon\xEDvel esta semana?

${params.agentName || "Agente ImoLead"}`,
      offer: `Prezado/a ${params.leadName},

Ap\xF3s a visita ao im\xF3vel em ${params.propertyLocation}, gostaria de apresentar uma proposta.

Podemos conversar sobre os termos?

${params.agentName || "Agente ImoLead"}`,
      closing: `Caro/a ${params.leadName},

Parab\xE9ns! O neg\xF3cio est\xE1 fechado.

Vou enviar toda a documenta\xE7\xE3o por email.

${params.agentName || "Agente ImoLead"}`
    };
    return templates[params.messageType] || templates.first_contact;
  }
  async sendMessage(phoneNumber, message) {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[WhatsApp] Sending message to ${phoneNumber}:`, message.substring(0, 50) + "...");
    return {
      id: messageId,
      leadId: "",
      to: phoneNumber,
      content: message,
      status: "sent",
      sentAt: /* @__PURE__ */ new Date()
    };
  }
  formatPhoneNumber(phone) {
    let cleaned = phone.replace(/[\s\-\(\)]/g, "");
    if (cleaned.startsWith("+")) {
      cleaned = cleaned.substring(1);
    }
    if (!cleaned.startsWith("351") && cleaned.length === 9) {
      cleaned = "351" + cleaned;
    }
    return cleaned;
  }
};
var whatsappService = new WhatsAppService();

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
  const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
  const targetEnvironment = isProduction ? "production" : "development";
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
async function getUncachableStripeClient() {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey, {
    apiVersion: "2025-08-27.basil"
  });
}
async function getStripePublishableKey() {
  const { publishableKey } = await getCredentials();
  return publishableKey;
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

// server/lib/stripeService.ts
init_db();
import { sql as sql3 } from "drizzle-orm";
var StripeService = class {
  async createCustomer(email, name, metadata) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      name,
      metadata: metadata || {}
    });
  }
  async createCheckoutSession(customerId, priceId, successUrl, cancelUrl, mode = "subscription", trialDays) {
    const stripe = await getUncachableStripeClient();
    const sessionConfig = {
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl
    };
    if (mode === "subscription" && trialDays && trialDays > 0) {
      sessionConfig.subscription_data = {
        trial_period_days: trialDays
      };
    }
    return await stripe.checkout.sessions.create(sessionConfig);
  }
  async isPriceBasicPlan(priceId) {
    const result = await db.execute(
      sql3`
        SELECT p.name 
        FROM stripe.prices pr 
        JOIN stripe.products p ON pr.product = p.id 
        WHERE pr.id = ${priceId}
      `
    );
    const productName = result.rows[0]?.name || "";
    return productName.toLowerCase().includes("basic");
  }
  async createCustomerPortalSession(customerId, returnUrl) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });
  }
  async getProduct(productId) {
    const result = await db.execute(
      sql3`SELECT * FROM stripe.products WHERE id = ${productId}`
    );
    return result.rows[0] || null;
  }
  async listProducts(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql3`SELECT * FROM stripe.products WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
    );
    return result.rows;
  }
  async listProductsWithPrices(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql3`
        WITH paginated_products AS (
          SELECT id, name, description, metadata, active
          FROM stripe.products
          WHERE active = ${active}
          ORDER BY id
          LIMIT ${limit} OFFSET ${offset}
        )
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active,
          pr.metadata as price_metadata
        FROM paginated_products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        ORDER BY p.id, pr.unit_amount
      `
    );
    return result.rows;
  }
  async getPrice(priceId) {
    const result = await db.execute(
      sql3`SELECT * FROM stripe.prices WHERE id = ${priceId}`
    );
    return result.rows[0] || null;
  }
  async listPrices(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql3`SELECT * FROM stripe.prices WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
    );
    return result.rows;
  }
  async getPricesForProduct(productId) {
    const result = await db.execute(
      sql3`SELECT * FROM stripe.prices WHERE product = ${productId} AND active = true`
    );
    return result.rows;
  }
  async getSubscription(subscriptionId) {
    const result = await db.execute(
      sql3`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return result.rows[0] || null;
  }
  async getCustomerSubscriptions(customerId) {
    const result = await db.execute(
      sql3`SELECT * FROM stripe.subscriptions WHERE customer = ${customerId}`
    );
    return result.rows;
  }
};
var stripeService = new StripeService();

// server/lib/authMiddleware.ts
init_storage();
import crypto from "crypto";
var SESSION_SECRET = process.env.SESSION_SECRET || "default-session-secret";
function verifySignedToken(token) {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return { valid: false };
    const [prefix, customerId, timestamp2, providedSignature] = parts;
    if (prefix !== "customer") return { valid: false };
    const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(`customer:${customerId}:${timestamp2}`).digest("hex");
    if (providedSignature !== expectedSignature) return { valid: false };
    const tokenTime = parseInt(timestamp2);
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1e3;
    if (now - tokenTime >= dayInMs) return { valid: false };
    return { valid: true, customerId };
  } catch {
    return { valid: false };
  }
}
function verifyLegacyToken(token) {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return { valid: false };
    const [prefix, customerId, timestamp2] = parts;
    if (prefix !== "customer" || !customerId || !timestamp2) return { valid: false };
    const tokenTime = parseInt(timestamp2);
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1e3;
    if (now - tokenTime >= dayInMs) return { valid: false };
    return { valid: true, customerId };
  } catch {
    return { valid: false };
  }
}
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token de autentica\xE7\xE3o n\xE3o fornecido" });
    }
    const token = authHeader.substring(7);
    let verification = verifySignedToken(token);
    if (!verification.valid) {
      verification = verifyLegacyToken(token);
    }
    if (!verification.valid || !verification.customerId) {
      return res.status(401).json({ error: "Token inv\xE1lido ou expirado" });
    }
    const customer = await storage.getCustomer(verification.customerId);
    if (!customer) {
      return res.status(401).json({ error: "Cliente n\xE3o encontrado" });
    }
    req.customerId = verification.customerId;
    req.customer = {
      id: customer.id,
      name: customer.name,
      email: customer.email
    };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Erro de autentica\xE7\xE3o" });
  }
}

// server/routes.ts
import bcrypt from "bcryptjs";
import crypto2 from "crypto";
var SESSION_SECRET2 = process.env.SESSION_SECRET || "default-session-secret";
var createUserToken = (customerId) => {
  const timestamp2 = Date.now().toString();
  const signature = crypto2.createHmac("sha256", SESSION_SECRET2).update(`customer:${customerId}:${timestamp2}`).digest("hex");
  return Buffer.from(`customer:${customerId}:${timestamp2}:${signature}`).toString("base64");
};
var verifyUserToken = (token) => {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return { valid: false };
    const [prefix, customerId, timestamp2, providedSignature] = parts;
    if (prefix !== "customer") return { valid: false };
    const expectedSignature = crypto2.createHmac("sha256", SESSION_SECRET2).update(`customer:${customerId}:${timestamp2}`).digest("hex");
    if (providedSignature !== expectedSignature) return { valid: false };
    const tokenTime = parseInt(timestamp2);
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1e3;
    if (now - tokenTime >= dayInMs) return { valid: false };
    return { valid: true, customerId };
  } catch {
    return { valid: false };
  }
};
async function registerRoutes(app2) {
  const createAdminToken = () => {
    const secret = process.env.ADMIN_PASSWORD || "default-secret";
    const timestamp2 = Date.now().toString();
    const signature = crypto2.createHmac("sha256", secret).update(`admin:${timestamp2}`).digest("hex");
    return Buffer.from(`admin:${timestamp2}:${signature}`).toString("base64");
  };
  app2.post("/api/admin/auth", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD;
      console.log("Admin auth attempt - password length:", password?.length, "expected length:", adminPassword?.length);
      if (!adminPassword) {
        return res.status(500).json({ error: "Admin password not configured" });
      }
      if (password?.trim() === adminPassword?.trim()) {
        const token = createAdminToken();
        res.json({ success: true, token });
      } else {
        res.status(401).json({ error: "Password incorreta" });
      }
    } catch (error) {
      console.error("Admin auth error:", error);
      res.status(500).json({ error: "Erro de autentica\xE7\xE3o" });
    }
  });
  app2.post("/api/admin/verify", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(401).json({ valid: false });
      }
      try {
        const secret = process.env.ADMIN_PASSWORD || "default-secret";
        const decoded = Buffer.from(token, "base64").toString("utf-8");
        const parts = decoded.split(":");
        if (parts.length !== 3) {
          return res.status(401).json({ valid: false });
        }
        const [prefix, timestamp2, providedSignature] = parts;
        if (prefix !== "admin") {
          return res.status(401).json({ valid: false });
        }
        const expectedSignature = crypto2.createHmac("sha256", secret).update(`admin:${timestamp2}`).digest("hex");
        if (providedSignature !== expectedSignature) {
          return res.status(401).json({ valid: false });
        }
        const tokenTime = parseInt(timestamp2);
        const now = Date.now();
        const hourInMs = 60 * 60 * 1e3;
        if (now - tokenTime < hourInMs * 24) {
          return res.json({ valid: true });
        }
        res.status(401).json({ valid: false });
      } catch (e) {
        res.status(401).json({ valid: false });
      }
    } catch (error) {
      console.error("Token verify error:", error);
      res.status(500).json({ valid: false });
    }
  });
  const validateAdminToken = (token) => {
    if (!token) return false;
    try {
      const secret = process.env.ADMIN_PASSWORD || "default-secret";
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const parts = decoded.split(":");
      if (parts.length !== 3) return false;
      const [prefix, timestamp2, providedSignature] = parts;
      if (prefix !== "admin") return false;
      const expectedSignature = crypto2.createHmac("sha256", secret).update(`admin:${timestamp2}`).digest("hex");
      if (providedSignature !== expectedSignature) return false;
      const tokenTime = parseInt(timestamp2);
      const now = Date.now();
      const hourInMs = 60 * 60 * 1e3;
      return now - tokenTime < hourInMs * 24;
    } catch (e) {
      return false;
    }
  };
  app2.get("/api/admin/home/customers", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "");
      if (!validateAdminToken(token)) {
        return res.status(401).json({ error: "N\xE3o autorizado" });
      }
      const customers2 = await storage.getCustomers({});
      res.json(customers2);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });
  app2.patch("/api/admin/home/customers/:id/status", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "");
      if (!validateAdminToken(token)) {
        return res.status(401).json({ error: "N\xE3o autorizado" });
      }
      const { id } = req.params;
      const { status } = req.body;
      if (!status || !["active", "inactive", "suspended"].includes(status)) {
        return res.status(400).json({ error: "Estado inv\xE1lido" });
      }
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ error: "Cliente n\xE3o encontrado" });
      }
      const updatedCustomer = await storage.updateCustomer(id, { status });
      res.json(updatedCustomer);
    } catch (error) {
      console.error("Error updating customer status:", error);
      res.status(500).json({ error: "Erro ao atualizar estado" });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, phone, company, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Nome, email e password s\xE3o obrigat\xF3rios" });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "A password deve ter pelo menos 6 caracteres" });
      }
      const existingCustomer = await storage.getCustomerByEmail(email);
      if (existingCustomer) {
        return res.status(400).json({ error: "Este email j\xE1 est\xE1 registado" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const trialEndsAt = /* @__PURE__ */ new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);
      const customer = await storage.createCustomer({
        name,
        email,
        phone: phone || null,
        company: company || null,
        password: hashedPassword,
        status: "active",
        plan: "trial",
        trialEndsAt
      });
      const token = createUserToken(customer.id);
      res.json({
        success: true,
        token,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          plan: customer.plan,
          trialEndsAt: customer.trialEndsAt
        }
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Erro ao criar conta" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log("[LOGIN] Attempt for email:", email);
      if (!email || !password) {
        console.log("[LOGIN] Missing email or password");
        return res.status(400).json({ error: "Email e password s\xE3o obrigat\xF3rios" });
      }
      const customer = await storage.getCustomerByEmail(email);
      console.log("[LOGIN] Customer found:", !!customer, customer?.id);
      if (!customer || !customer.password) {
        return res.status(401).json({ error: "Email ou password incorretos" });
      }
      let isValidPassword = false;
      console.log("[LOGIN] Password starts with $2:", customer.password.startsWith("$2"));
      if (customer.password.startsWith("$2")) {
        isValidPassword = await bcrypt.compare(password, customer.password);
        console.log("[LOGIN] Bcrypt compare result:", isValidPassword);
      } else {
        if (customer.password === password) {
          isValidPassword = true;
          const hashedPassword = await bcrypt.hash(password, 10);
          await storage.updateCustomer(customer.id, { password: hashedPassword });
          console.log(`Upgraded password hash for customer ${customer.id}`);
        }
      }
      if (!isValidPassword) {
        console.log("[LOGIN] Invalid password for:", email);
        return res.status(401).json({ error: "Email ou password incorretos" });
      }
      const hasActiveSubscription = customer.status === "active" || customer.plan === "pro" || customer.plan === "basic";
      const trialEndDate = customer.trialEndsAt ? new Date(customer.trialEndsAt) : null;
      const isTrialExpired = trialEndDate && trialEndDate < /* @__PURE__ */ new Date();
      if (isTrialExpired && !hasActiveSubscription) {
        console.log("[LOGIN] Trial expired for:", email, "Trial ended:", trialEndDate);
        sendTrialExpiredEmail(customer.email, customer.name || "Cliente", trialEndDate).then((result) => {
          if (result.success) {
            console.log("[EMAIL] Trial expired email sent to:", customer.email);
          } else {
            console.log("[EMAIL] Failed to send trial expired email:", result.error);
          }
        }).catch((err) => console.error("[EMAIL] Error sending trial expired email:", err));
        return res.status(403).json({
          error: "O seu per\xEDodo de teste expirou. Por favor, subscreva um plano para continuar.",
          trialExpired: true,
          trialEndDate: trialEndDate.toISOString()
        });
      }
      const token = createUserToken(customer.id);
      res.json({
        success: true,
        token,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          plan: customer.plan,
          trialEndsAt: customer.trialEndsAt
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Erro ao iniciar sess\xE3o" });
    }
  });
  app2.post("/api/auth/verify", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(401).json({ valid: false });
      }
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
              company: customer.company
            }
          });
        }
      }
      try {
        const decoded = Buffer.from(token, "base64").toString("utf-8");
        const parts = decoded.split(":");
        if (parts.length === 3) {
          const [prefix, customerId, timestamp2] = parts;
          if (prefix === "customer" && customerId && timestamp2) {
            const tokenTime = parseInt(timestamp2);
            const now = Date.now();
            const dayInMs = 24 * 60 * 60 * 1e3;
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
                    company: customer.company
                  }
                });
              }
            }
          }
        }
      } catch (e) {
      }
      res.status(401).json({ valid: false });
    } catch (error) {
      console.error("Token verify error:", error);
      res.status(500).json({ valid: false });
    }
  });
  app2.get("/api/customers/:id", authMiddleware, async (req, res) => {
    try {
      if (req.customerId !== req.params.id) {
        return res.status(403).json({ error: "Acesso n\xE3o autorizado" });
      }
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Cliente n\xE3o encontrado" });
      }
      const { password, ...safeCustomer } = customer;
      res.json({ customer: safeCustomer });
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ error: "Erro ao buscar cliente" });
    }
  });
  app2.patch("/api/customers/:id", authMiddleware, async (req, res) => {
    try {
      if (req.customerId !== req.params.id) {
        return res.status(403).json({ error: "Acesso n\xE3o autorizado" });
      }
      const { name, email, phone, company } = req.body;
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Cliente n\xE3o encontrado" });
      }
      if (email && email !== customer.email) {
        const existingCustomer = await storage.getCustomerByEmail(email);
        if (existingCustomer && existingCustomer.id !== customer.id) {
          return res.status(400).json({ error: "Este email j\xE1 est\xE1 registado" });
        }
      }
      const updatedCustomer = await storage.updateCustomer(req.params.id, {
        name: name || customer.name,
        email: email || customer.email,
        phone: phone !== void 0 ? phone : customer.phone,
        company: company !== void 0 ? company : customer.company
      });
      if (!updatedCustomer) {
        return res.status(404).json({ error: "Erro ao atualizar cliente" });
      }
      const { password, ...safeCustomer } = updatedCustomer;
      res.json({
        success: true,
        customer: safeCustomer
      });
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ error: "Erro ao atualizar cliente" });
    }
  });
  app2.post("/api/ai/chat", authMiddleware, async (req, res) => {
    try {
      const { message, context } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Mensagem \xE9 obrigat\xF3ria" });
      }
      const response = await chatWithAI(message, context);
      res.json({ response });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ error: "Erro ao processar o comando" });
    }
  });
  app2.get("/api/ai/status", authMiddleware, async (req, res) => {
    try {
      const hasOpenRouter = !!(process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL && process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY);
      const hasOpenAI = !!process.env.OPENAI_API_KEY;
      res.json({
        active: hasOpenRouter || hasOpenAI,
        provider: hasOpenRouter ? "DeepSeek (OpenRouter)" : hasOpenAI ? "OpenAI" : null
      });
    } catch (error) {
      console.error("Error checking AI status:", error);
      res.status(500).json({ error: "Erro ao verificar estado da IA" });
    }
  });
  app2.post("/api/leads", authMiddleware, async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const aiAnalysis = await analyzeLeadWithAI({
        name: validatedData.name,
        property: validatedData.property,
        propertyType: validatedData.propertyType,
        location: validatedData.location,
        price: validatedData.price,
        contact: validatedData.contact,
        source: validatedData.source
      });
      const lead = await storage.createLead({
        ...validatedData,
        status: aiAnalysis.status,
        aiScore: aiAnalysis.score,
        aiReasoning: aiAnalysis.reasoning
      });
      await storage.createInteraction({
        leadId: lead.id,
        type: "note",
        content: `Lead criado com classifica\xE7\xE3o AI: ${aiAnalysis.status} (score: ${aiAnalysis.score})`,
        metadata: { aiAnalysis }
      });
      res.json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(400).json({ error: error.message || "Failed to create lead" });
    }
  });
  app2.get("/api/leads", authMiddleware, async (req, res) => {
    try {
      const { status, source, location, search } = req.query;
      const leads2 = await storage.getLeads({
        status,
        source,
        location,
        search
      });
      res.json(leads2);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });
  app2.get("/api/leads/:id", authMiddleware, async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  });
  app2.patch("/api/leads/:id", authMiddleware, async (req, res) => {
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
          content: `Estado alterado para: ${updates.status}`
        });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(400).json({ error: error.message || "Failed to update lead" });
    }
  });
  app2.delete("/api/leads/:id", authMiddleware, async (req, res) => {
    try {
      const deleted = await storage.deleteLead(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });
  app2.get("/api/leads/:id/interactions", authMiddleware, async (req, res) => {
    try {
      const interactions = await storage.getInteractionsByLead(req.params.id);
      res.json(interactions);
    } catch (error) {
      console.error("Error fetching interactions:", error);
      res.status(500).json({ error: "Failed to fetch interactions" });
    }
  });
  app2.get("/api/interactions", authMiddleware, async (req, res) => {
    try {
      const interactions = await storage.getAllInteractions();
      res.json(interactions);
    } catch (error) {
      console.error("Error fetching all interactions:", error);
      res.status(500).json({ error: "Failed to fetch interactions" });
    }
  });
  app2.post("/api/interactions", authMiddleware, async (req, res) => {
    try {
      const validatedData = insertInteractionSchema.parse(req.body);
      const interaction = await storage.createInteraction(validatedData);
      res.json(interaction);
    } catch (error) {
      console.error("Error creating interaction:", error);
      res.status(400).json({ error: error.message || "Failed to create interaction" });
    }
  });
  app2.post("/api/message-templates", authMiddleware, async (req, res) => {
    try {
      const validatedData = insertMessageTemplateSchema.parse(req.body);
      const template = await storage.createMessageTemplate(validatedData);
      res.json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(400).json({ error: error.message || "Failed to create template" });
    }
  });
  app2.get("/api/message-templates", async (req, res) => {
    try {
      const templates = await storage.getMessageTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });
  app2.get("/api/message-templates/:id", async (req, res) => {
    try {
      const template = await storage.getMessageTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });
  app2.patch("/api/message-templates/:id", async (req, res) => {
    try {
      const updates = insertMessageTemplateSchema.partial().parse(req.body);
      const template = await storage.updateMessageTemplate(req.params.id, updates);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(400).json({ error: error.message || "Failed to update template" });
    }
  });
  app2.delete("/api/message-templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteMessageTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });
  app2.post("/api/calendar-events", async (req, res) => {
    try {
      const validatedData = insertCalendarEventSchema.parse(req.body);
      const event = await storage.createCalendarEvent(validatedData);
      if (event.leadId) {
        await storage.createInteraction({
          leadId: event.leadId,
          type: "note",
          content: `Visita agendada: ${event.title}`,
          metadata: { eventId: event.id }
        });
      }
      res.json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(400).json({ error: error.message || "Failed to create event" });
    }
  });
  app2.get("/api/calendar-events", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const events = await storage.getCalendarEvents({
        startDate: startDate ? new Date(startDate) : void 0,
        endDate: endDate ? new Date(endDate) : void 0
      });
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });
  app2.get("/api/calendar-events/:id", async (req, res) => {
    try {
      const event = await storage.getCalendarEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });
  app2.patch("/api/calendar-events/:id", async (req, res) => {
    try {
      const updates = insertCalendarEventSchema.partial().parse(req.body);
      const event = await storage.updateCalendarEvent(req.params.id, updates);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(400).json({ error: error.message || "Failed to update event" });
    }
  });
  app2.delete("/api/calendar-events/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCalendarEvent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });
  app2.get("/api/reports/daily", async (req, res) => {
    try {
      const allLeads = await storage.getLeads();
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const todayLeads = allLeads.filter(
        (lead) => lead.createdAt >= today
      );
      const leadsByStatus = {
        quente: allLeads.filter((l) => l.status === "quente").length,
        morno: allLeads.filter((l) => l.status === "morno").length,
        frio: allLeads.filter((l) => l.status === "frio").length
      };
      const leadsBySource = allLeads.reduce((acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1;
        return acc;
      }, {});
      const upcomingEvents = await storage.getCalendarEvents({
        startDate: /* @__PURE__ */ new Date()
      });
      res.json({
        summary: {
          totalLeads: allLeads.length,
          newLeadsToday: todayLeads.length,
          leadsByStatus,
          leadsBySource,
          upcomingVisits: upcomingEvents.filter((e) => e.status === "scheduled").length
        },
        todayLeads,
        upcomingEvents: upcomingEvents.slice(0, 10)
      });
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });
  app2.get("/api/casafari/search", async (req, res) => {
    try {
      const params = {
        location: req.query.location,
        propertyType: req.query.propertyType,
        transactionType: req.query.transactionType,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : void 0,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : void 0,
        minArea: req.query.minArea ? Number(req.query.minArea) : void 0,
        maxArea: req.query.maxArea ? Number(req.query.maxArea) : void 0,
        bedrooms: req.query.bedrooms ? Number(req.query.bedrooms) : void 0,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        offset: req.query.offset ? Number(req.query.offset) : 0
      };
      const result = await casafariService.searchProperties(params);
      res.json(result);
    } catch (error) {
      console.error("Error searching Casafari:", error);
      res.status(500).json({ error: "Failed to search properties" });
    }
  });
  app2.get("/api/casafari/properties/:id", async (req, res) => {
    try {
      const property = await casafariService.getPropertyById(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ error: "Failed to fetch property" });
    }
  });
  app2.post("/api/casafari/import/:id", async (req, res) => {
    try {
      const property = await casafariService.getPropertyById(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      const leadData = await casafariService.convertToLead(property);
      const aiAnalysis = await analyzeLeadWithAI({
        name: leadData.name,
        property: leadData.property,
        propertyType: leadData.propertyType,
        location: leadData.location,
        price: leadData.price,
        contact: leadData.contact,
        source: leadData.source
      });
      const lead = await storage.createLead({
        ...leadData,
        email: leadData.email || void 0,
        propertyType: leadData.propertyType,
        source: "Casafari",
        status: aiAnalysis.status,
        aiScore: aiAnalysis.score,
        aiReasoning: aiAnalysis.reasoning
      });
      await storage.createInteraction({
        leadId: lead.id,
        type: "note",
        content: `Lead importado da Casafari: ${property.sourceUrl}`,
        metadata: { casafariId: property.id, aiAnalysis }
      });
      res.json(lead);
    } catch (error) {
      console.error("Error importing from Casafari:", error);
      res.status(500).json({ error: "Failed to import property" });
    }
  });
  app2.get("/api/payments/plans", async (_req, res) => {
    try {
      const plans = paymentService.getPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  });
  app2.post("/api/payments/initiate", async (req, res) => {
    try {
      const paymentRequest = {
        planId: req.body.planId,
        customerName: req.body.customerName,
        customerEmail: req.body.customerEmail,
        customerPhone: req.body.customerPhone,
        paymentMethod: req.body.paymentMethod
      };
      const result = await paymentService.initiatePayment(paymentRequest);
      res.json(result);
    } catch (error) {
      console.error("Error initiating payment:", error);
      res.status(500).json({ error: "Failed to initiate payment" });
    }
  });
  app2.get("/api/payments/status/:paymentId", async (req, res) => {
    try {
      const result = await paymentService.checkPaymentStatus(req.params.paymentId);
      res.json(result);
    } catch (error) {
      console.error("Error checking payment status:", error);
      res.status(500).json({ error: "Failed to check payment status" });
    }
  });
  app2.post("/api/payments/webhook", async (req, res) => {
    try {
      const result = await paymentService.processWebhook(req.body);
      res.json(result);
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });
  app2.get("/api/whatsapp/templates", async (_req, res) => {
    try {
      const templates = whatsappService.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching WhatsApp templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });
  app2.post("/api/whatsapp/generate-message", async (req, res) => {
    try {
      const params = {
        leadName: req.body.leadName,
        propertyDescription: req.body.propertyDescription,
        propertyLocation: req.body.propertyLocation,
        propertyPrice: req.body.propertyPrice,
        leadStatus: req.body.leadStatus,
        messageType: req.body.messageType,
        agentName: req.body.agentName
      };
      const message = await whatsappService.generateAIMessage(params);
      res.json({ message });
    } catch (error) {
      console.error("Error generating WhatsApp message:", error);
      res.status(500).json({ error: "Failed to generate message" });
    }
  });
  app2.post("/api/whatsapp/send", async (req, res) => {
    try {
      const { leadId, phoneNumber, message } = req.body;
      const formattedPhone = whatsappService.formatPhoneNumber(phoneNumber);
      const result = await whatsappService.sendMessage(formattedPhone, message);
      if (leadId) {
        await storage.createInteraction({
          leadId,
          type: "whatsapp",
          content: message,
          metadata: { messageId: result.id, status: result.status }
        });
      }
      res.json(result);
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });
  app2.post("/api/leads/:id/send-whatsapp", async (req, res) => {
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
        leadStatus: lead.status,
        messageType,
        agentName
      });
      const formattedPhone = whatsappService.formatPhoneNumber(lead.contact);
      const result = await whatsappService.sendMessage(formattedPhone, message);
      await storage.createInteraction({
        leadId: lead.id,
        type: "whatsapp",
        content: message,
        metadata: { messageId: result.id, status: result.status, messageType }
      });
      res.json({ ...result, message });
    } catch (error) {
      console.error("Error sending WhatsApp to lead:", error);
      res.status(500).json({ error: "Failed to send WhatsApp message" });
    }
  });
  app2.get("/api/admin/customers", async (req, res) => {
    try {
      const { status, search } = req.query;
      const customers2 = await storage.getCustomers({
        status,
        search
      });
      res.json(customers2);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });
  app2.get("/api/admin/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });
  app2.post("/api/admin/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(400).json({ error: error.message || "Failed to create customer" });
    }
  });
  app2.patch("/api/admin/customers/:id", async (req, res) => {
    try {
      const updates = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, updates);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(400).json({ error: error.message || "Failed to update customer" });
    }
  });
  app2.delete("/api/admin/customers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCustomer(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });
  app2.get("/api/admin/subscriptions", async (req, res) => {
    try {
      const { customerId, status, planId } = req.query;
      const subscriptions2 = await storage.getSubscriptions({
        customerId,
        status,
        planId
      });
      res.json(subscriptions2);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });
  app2.get("/api/admin/subscriptions/:id", async (req, res) => {
    try {
      const subscription = await storage.getSubscription(req.params.id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });
  app2.post("/api/admin/subscriptions", async (req, res) => {
    try {
      const validatedData = insertSubscriptionSchema.parse(req.body);
      const subscription = await storage.createSubscription(validatedData);
      res.json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(400).json({ error: error.message || "Failed to create subscription" });
    }
  });
  app2.patch("/api/admin/subscriptions/:id", async (req, res) => {
    try {
      const subscription = await storage.updateSubscription(req.params.id, req.body);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(400).json({ error: error.message || "Failed to update subscription" });
    }
  });
  app2.post("/api/admin/subscriptions/:id/cancel", async (req, res) => {
    try {
      const subscription = await storage.cancelSubscription(req.params.id);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      res.json(subscription);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });
  app2.get("/api/admin/payments", async (req, res) => {
    try {
      const { customerId, subscriptionId, status, paymentMethod, startDate, endDate } = req.query;
      const payments2 = await storage.getPayments({
        customerId,
        subscriptionId,
        status,
        paymentMethod,
        startDate: startDate ? new Date(startDate) : void 0,
        endDate: endDate ? new Date(endDate) : void 0
      });
      res.json(payments2);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });
  app2.get("/api/admin/payments/stats", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const stats = await storage.getPaymentStats(
        startDate ? new Date(startDate) : void 0,
        endDate ? new Date(endDate) : void 0
      );
      res.json(stats);
    } catch (error) {
      console.error("Error fetching payment stats:", error);
      res.status(500).json({ error: "Failed to fetch payment stats" });
    }
  });
  app2.get("/api/admin/payments/:id", async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      console.error("Error fetching payment:", error);
      res.status(500).json({ error: "Failed to fetch payment" });
    }
  });
  app2.post("/api/admin/payments", async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      res.json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(400).json({ error: error.message || "Failed to create payment" });
    }
  });
  app2.patch("/api/admin/payments/:id", async (req, res) => {
    try {
      const payment = await storage.updatePayment(req.params.id, req.body);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(400).json({ error: error.message || "Failed to update payment" });
    }
  });
  app2.post("/api/admin/payments/:id/refund", async (req, res) => {
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
        refundedAt: /* @__PURE__ */ new Date(),
        refundAmount
      });
      res.json(updatedPayment);
    } catch (error) {
      console.error("Error refunding payment:", error);
      res.status(500).json({ error: "Failed to refund payment" });
    }
  });
  app2.get("/api/admin/dashboard", async (_req, res) => {
    try {
      const customers2 = await storage.getCustomers({ status: "active" });
      const subscriptions2 = await storage.getSubscriptions({ status: "active" });
      const paymentStats = await storage.getPaymentStats();
      const monthlyRecurringRevenue = subscriptions2.reduce((sum, sub) => sum + sub.price, 0);
      res.json({
        totalCustomers: customers2.length,
        activeSubscriptions: subscriptions2.length,
        monthlyRecurringRevenue,
        ...paymentStats
      });
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });
  app2.get("/api/stripe/config", async (_req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error fetching Stripe config:", error);
      res.status(500).json({ error: "Failed to fetch Stripe configuration" });
    }
  });
  app2.get("/api/stripe/products", async (_req, res) => {
    try {
      const products = await stripeService.listProducts();
      res.json({ data: products });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  app2.get("/api/stripe/products-with-prices", async (_req, res) => {
    try {
      const rows = await stripeService.listProductsWithPrices();
      const productsMap = /* @__PURE__ */ new Map();
      for (const row of rows) {
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
            metadata: row.price_metadata
          });
        }
      }
      res.json({ data: Array.from(productsMap.values()) });
    } catch (error) {
      console.error("Error fetching products with prices:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  app2.get("/api/stripe/prices", async (_req, res) => {
    try {
      const prices = await stripeService.listPrices();
      res.json({ data: prices });
    } catch (error) {
      console.error("Error fetching prices:", error);
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });
  app2.get("/api/stripe/products/:productId/prices", async (req, res) => {
    try {
      const { productId } = req.params;
      const product = await stripeService.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      const prices = await stripeService.getPricesForProduct(productId);
      res.json({ data: prices });
    } catch (error) {
      console.error("Error fetching product prices:", error);
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });
  app2.post("/api/stripe/checkout", async (req, res) => {
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
      const trialDays = isBasicPlan ? 7 : void 0;
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const session = await stripeService.createCheckoutSession(
        customer.id,
        priceId,
        successUrl || `${baseUrl}/checkout/success`,
        cancelUrl || `${baseUrl}/checkout/cancel`,
        "subscription",
        trialDays
      );
      res.json({ url: session.url, sessionId: session.id, hasTrial: isBasicPlan });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });
  app2.post("/api/stripe/customer-portal", async (req, res) => {
    try {
      const { customerId, returnUrl } = req.body;
      if (!customerId) {
        return res.status(400).json({ error: "Customer ID is required" });
      }
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const session = await stripeService.createCustomerPortalSession(
        customerId,
        returnUrl || `${baseUrl}/dashboard`
      );
      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating customer portal session:", error);
      res.status(500).json({ error: "Failed to create customer portal session" });
    }
  });
  app2.get("/api/automation-settings/:customerId", authMiddleware, async (req, res) => {
    try {
      if (req.customerId !== req.params.customerId) {
        return res.status(403).json({ error: "Acesso n\xE3o autorizado" });
      }
      const settings = await storage.getAutomationSettings(req.params.customerId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching automation settings:", error);
      res.status(500).json({ error: "Failed to fetch automation settings" });
    }
  });
  app2.post("/api/automation-settings", authMiddleware, async (req, res) => {
    try {
      const { customerId, ...settingsData } = req.body;
      if (!customerId) {
        return res.status(400).json({ error: "Customer ID is required" });
      }
      if (req.customerId !== customerId) {
        return res.status(403).json({ error: "Acesso n\xE3o autorizado" });
      }
      const settings = await storage.createOrUpdateAutomationSettings({ ...settingsData, customerId });
      res.json(settings);
    } catch (error) {
      console.error("Error saving automation settings:", error);
      res.status(400).json({ error: error.message || "Failed to save automation settings" });
    }
  });
  app2.patch("/api/automation-settings/:customerId", authMiddleware, async (req, res) => {
    try {
      if (req.customerId !== req.params.customerId) {
        return res.status(403).json({ error: "Acesso n\xE3o autorizado" });
      }
      const settings = await storage.createOrUpdateAutomationSettings({ ...req.body, customerId: req.params.customerId });
      res.json(settings);
    } catch (error) {
      console.error("Error updating automation settings:", error);
      res.status(400).json({ error: error.message || "Failed to update automation settings" });
    }
  });
  app2.get("/api/message-jobs", authMiddleware, async (req, res) => {
    try {
      const jobs = await storage.getPendingMessageJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching message jobs:", error);
      res.status(500).json({ error: "Failed to fetch message jobs" });
    }
  });
  app2.get("/api/leads/:id/message-jobs", authMiddleware, async (req, res) => {
    try {
      const jobs = await storage.getMessageJobsForLead(req.params.id);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching message jobs:", error);
      res.status(500).json({ error: "Failed to fetch message jobs" });
    }
  });
  app2.post("/api/message-jobs", authMiddleware, async (req, res) => {
    try {
      const job = await storage.createMessageJob(req.body);
      res.json(job);
    } catch (error) {
      console.error("Error creating message job:", error);
      res.status(400).json({ error: error.message || "Failed to create message job" });
    }
  });
  app2.patch("/api/message-jobs/:id", authMiddleware, async (req, res) => {
    try {
      const job = await storage.updateMessageJob(req.params.id, req.body);
      if (!job) {
        return res.status(404).json({ error: "Message job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error updating message job:", error);
      res.status(400).json({ error: error.message || "Failed to update message job" });
    }
  });
  app2.post("/api/message-jobs/:id/cancel", authMiddleware, async (req, res) => {
    try {
      const job = await storage.updateMessageJob(req.params.id, {
        status: "cancelled"
      });
      if (!job) {
        return res.status(404).json({ error: "Message job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error cancelling message job:", error);
      res.status(500).json({ error: "Failed to cancel message job" });
    }
  });
  app2.get("/api/usage/:customerId", authMiddleware, async (req, res) => {
    try {
      if (req.customerId !== req.params.customerId) {
        return res.status(403).json({ error: "Acesso n\xE3o autorizado" });
      }
      const { period } = req.query;
      const entries = await storage.getUsageByCustomer(
        req.params.customerId,
        period
      );
      res.json(entries);
    } catch (error) {
      console.error("Error fetching usage data:", error);
      res.status(500).json({ error: "Failed to fetch usage data" });
    }
  });
  app2.get("/api/usage/:customerId/summary", authMiddleware, async (req, res) => {
    try {
      if (req.customerId !== req.params.customerId) {
        return res.status(403).json({ error: "Acesso n\xE3o autorizado" });
      }
      const { period } = req.query;
      const entries = await storage.getUsageByCustomer(
        req.params.customerId,
        period
      );
      const summary = {};
      entries.forEach((entry) => {
        if (!summary[entry.metric]) {
          summary[entry.metric] = { count: 0, totalUnits: 0, totalCost: 0 };
        }
        summary[entry.metric].count++;
        summary[entry.metric].totalUnits += entry.quantity || 1;
      });
      res.json(summary);
    } catch (error) {
      console.error("Error fetching usage summary:", error);
      res.status(500).json({ error: "Failed to fetch usage summary" });
    }
  });
  app2.post("/api/usage", authMiddleware, async (req, res) => {
    try {
      const entry = await storage.createUsageRecord(req.body);
      res.json(entry);
    } catch (error) {
      console.error("Error recording usage:", error);
      res.status(400).json({ error: error.message || "Failed to record usage" });
    }
  });
  app2.post("/api/automation/process", authMiddleware, async (req, res) => {
    try {
      const { startScheduler: startScheduler2 } = await Promise.resolve().then(() => (init_schedulerService(), schedulerService_exports));
      startScheduler2();
      res.json({ success: true, message: "Automation processing triggered" });
    } catch (error) {
      console.error("Error triggering automation:", error);
      res.status(500).json({ error: "Failed to trigger automation" });
    }
  });
  app2.post("/api/automation/test-casafari", authMiddleware, async (req, res) => {
    try {
      const isConfigured = !!process.env.CASAFARI_API_KEY;
      res.json({
        configured: isConfigured,
        message: isConfigured ? "Casafari API is configured" : "Casafari API key not configured"
      });
    } catch (error) {
      console.error("Error testing Casafari:", error);
      res.status(500).json({ error: "Failed to test Casafari connection" });
    }
  });
  app2.post("/api/automation/test-email", authMiddleware, async (req, res) => {
    try {
      const hasSendGrid = !!process.env.SENDGRID_API_KEY;
      const hasResend = !!process.env.RESEND_API_KEY;
      const hasSmtp = !!process.env.SMTP_HOST;
      const isConfigured = hasSendGrid || hasResend || hasSmtp;
      const provider = hasSendGrid ? "sendgrid" : hasResend ? "resend" : hasSmtp ? "smtp" : null;
      res.json({
        configured: isConfigured,
        provider,
        message: isConfigured ? `Email configured with ${provider}` : "Email service not configured"
      });
    } catch (error) {
      console.error("Error testing email:", error);
      res.status(500).json({ error: "Failed to test email configuration" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
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
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
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
        import.meta.dirname,
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
  const distPath = path2.resolve(import.meta.dirname, "public");
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
var app = express2();
async function initStripe(retries = 3, delay = 2e3) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return;
  }
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await runMigrations({ databaseUrl });
      const stripeSync2 = await getStripeSync();
      const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
      await stripeSync2.findOrCreateManagedWebhook(
        `${webhookBaseUrl}/api/stripe/webhook`,
        {
          enabled_events: ["*"],
          description: "Managed webhook for ImoLead AI Pro"
        }
      );
      stripeSync2.syncBackfill().catch(() => {
      });
      return;
    } catch (error) {
      if (attempt < retries && error?.code === "08P01") {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      } else if (attempt === retries) {
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
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api") && res.statusCode >= 400) {
      log(`${req.method} ${path3} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`[ERROR] ${status}: ${message}`, err.stack || "");
    if (!res.headersSent) {
      res.status(status).json({
        error: message,
        ...process.env.NODE_ENV === "development" && { stack: err.stack }
      });
    }
  });
  process.on("uncaughtException", (error) => {
    console.error("[UNCAUGHT EXCEPTION]", error);
  });
  process.on("unhandledRejection", (reason, promise) => {
    console.error("[UNHANDLED REJECTION]", reason);
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
