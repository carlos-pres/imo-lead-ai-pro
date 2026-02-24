import type { Customer } from "../shared/schema.js";
import { PLAN_CONFIG } from "./core/plans.js";
import { fileURLToPath } from 'url';
import path from 'path';
import 'dotenv/config';
import { db } from "./db.js";
import {
  customers,
  leads,
  automationSettings,
  messageJobs,
  interactions,
  usageRecords,
  calendarEvents
} from "../shared/schema";
import { eq } from "drizzle-orm";

export interface DatabaseStorage {
  getCustomer(id: string): Promise<any>;
  getCustomers(): Promise<any[]>;
  createCustomer(data: any): Promise<any>;
  updateCustomer(id: string, data: any): Promise<any>;

  getLead(id: string): Promise<any>;
  getLeadsByCustomer(customerId: string): Promise<any[]>;
  createLead(data: any): Promise<any>;

  getAutomationSettings(customerId: string): Promise<any>;
  getAllAutomationSettings(): Promise<any[]>;
  createOrUpdateAutomationSettings(data: any): Promise<any>;

  createMessageJob(data: any): Promise<any>;
  updateMessageJob(id: string, data: any): Promise<any>;
  getPendingMessageJobs(): Promise<any[]>;
  getMessageJobsForLead(leadId: string): Promise<any[]>;

  createInteraction(data: any): Promise<any>;
  getLastInteraction(leadId: string): Promise<any>;

  createUsageRecord(data: any): Promise<any>;

  getCalendarEvents(): Promise<any[]>;
}

export class DatabaseStorageImpl implements DatabaseStorage {

  // ================= CUSTOMERS =================

  async getCustomer(id: string): Promise<Customer | undefined> {
  const result = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id));

  return result[0];
}


  async getCustomers() {
    return await db.select().from(customers);
  }

  async createCustomer(data: any) {
    const result = await db.insert(customers).values(data).returning();
    return result[0];
  }

  async updateCustomer(id: string, data: any) {
    const result = await db
      .update(customers)
      .set(data)
      .where(eq(customers.id, id))
      .returning();
    return result[0];
  }

  // ================= LEADS =================

async getLead(id: string) {
  const result = await db
    .select()
    .from(leads)
    .where(eq(leads.id, id));

  return result[0];
}
async getLeadsByCustomer(customerId: string) {
  return await db
    .select()
    .from(leads)
    .where(eq(leads.customerId, customerId));
}
async countLeadsThisMonth(customerId: string): Promise<number> {
  const now = new Date();
  const firstDayOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );
  const result = await db
    .select()
    .from(leads)
    .where(eq(leads.customerId, customerId));

  return result.filter(
    (lead: any) => lead.createdAt >= firstDayOfMonth
  ).length;
}
async createLead(data: any) {
  const customer = await this.getCustomer(data.customerId);

  if (!customer) {
    throw new Error("Cliente não encontrado.");
  }

  if (!customer.plan) {
    throw new Error("Plano do cliente não definido.");
  }

 const config = PLAN_CONFIG[customer.plan as keyof typeof PLAN_CONFIG];

  if (config.leadLimit !== Infinity) {
    const leadsThisMonth = await this.countLeadsThisMonth(customer.id);

    if (leadsThisMonth >= config.leadLimit) {
      throw new Error(
        "Limite do plano Basic atingido. Faça upgrade para continuar."
      );
    }
  }

  const result = await db
    .insert(leads)
    .values(data)
    .returning();

  return result[0];
}

  // ================= AUTOMATION =================

  async getAutomationSettings(customerId: string) {
    const result = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.customerId, customerId));
    return result[0];
  }

  async getAllAutomationSettings() {
    return await db.select().from(automationSettings);
  }

  async createOrUpdateAutomationSettings(data: any) {
    const existing = await this.getAutomationSettings(data.customerId);

    if (existing) {
      const result = await db
        .update(automationSettings)
        .set(data)
        .where(eq(automationSettings.customerId, data.customerId))
        .returning();
      return result[0];
    }

    const result = await db.insert(automationSettings).values(data).returning();
    return result[0];
  }

  // ================= MESSAGE JOBS =================

  async createMessageJob(data: any) {
    const result = await db.insert(messageJobs).values(data).returning();
    return result[0];
  }

  async updateMessageJob(id: string, data: any) {
    const result = await db
      .update(messageJobs)
      .set(data)
      .where(eq(messageJobs.id, id))
      .returning();
    return result[0];
  }

  async getPendingMessageJobs() {
    return await db
      .select()
      .from(messageJobs)
      .where(eq(messageJobs.status, "pending"));
  }

  async getMessageJobsForLead(leadId: string) {
    return await db
      .select()
      .from(messageJobs)
      .where(eq(messageJobs.leadId, leadId));
  }

  // ================= INTERACTIONS =================

  async createInteraction(data: any) {
    const result = await db.insert(interactions).values(data).returning();
    return result[0];
  }

  async getLastInteraction(leadId: string) {
    const result = await db
      .select()
      .from(interactions)
      .where(eq(interactions.leadId, leadId))
      .orderBy(interactions.createdAt)
      .limit(1);
    return result[0];
  }

  // ================= USAGE =================

  async createUsageRecord(data: any) {
    const result = await db.insert(usageRecords).values(data).returning();
    return result[0];
  }

  // ================= CALENDAR =================

  async getCalendarEvents() {
    return await db.select().from(calendarEvents);
  }
}

export const storage = new DatabaseStorageImpl();
