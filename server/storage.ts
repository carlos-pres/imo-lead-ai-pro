import {
  type Lead,
  type InsertLead,
  type MessageTemplate,
  type InsertMessageTemplate,
  type CalendarEvent,
  type InsertCalendarEvent,
  type InteractionHistory,
  type InsertInteraction,
  type Configuration,
  type InsertConfiguration,
  type Customer,
  type InsertCustomer,
  type Subscription,
  type InsertSubscription,
  type Payment,
  type InsertPayment,
  type MessageJob,
  type InsertMessageJob,
  type UsageLedger,
  type InsertUsageLedger,
  type AutomationSettings,
  type InsertAutomationSettings,
  type EmailVerificationToken,
  type PasswordResetToken,
  type ChatMessage,
  type InsertChatMessage,
  leads,
  messageTemplates,
  calendarEvents,
  interactionHistory,
  configurations,
  customers,
  subscriptions,
  payments,
  messageJobs,
  usageLedger,
  automationSettings,
  emailVerificationTokens,
  passwordResetTokens,
  chatMessages,
} from "@shared/schema";
import { randomUUID, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { eq, ilike, and, or, gte, lte, desc, sql } from "drizzle-orm";

export interface IStorage {
  createLead(lead: InsertLead & Partial<Pick<Lead, 'aiScore' | 'aiReasoning' | 'lastContact'>> & { customerId?: string | null }): Promise<Lead>;
  getLeads(filters?: {
    status?: string;
    source?: string;
    location?: string;
    search?: string;
  }): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;

  createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate>;
  getMessageTemplates(): Promise<MessageTemplate[]>;
  getMessageTemplate(id: string): Promise<MessageTemplate | undefined>;
  updateMessageTemplate(id: string, template: Partial<InsertMessageTemplate>): Promise<MessageTemplate | undefined>;
  deleteMessageTemplate(id: string): Promise<boolean>;

  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  getCalendarEvents(filters?: { startDate?: Date; endDate?: Date }): Promise<CalendarEvent[]>;
  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: string): Promise<boolean>;

  createInteraction(interaction: InsertInteraction): Promise<InteractionHistory>;
  getInteractionsByLead(leadId: string): Promise<InteractionHistory[]>;
  getAllInteractions(): Promise<InteractionHistory[]>;

  getConfiguration(key: string): Promise<Configuration | undefined>;
  setConfiguration(config: InsertConfiguration): Promise<Configuration>;

  // Customer operations
  createCustomer(customer: InsertCustomer & { password?: string | null }): Promise<Customer>;
  getCustomers(filters?: { status?: string; search?: string }): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;

  // Subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptions(filters?: { customerId?: string; status?: string; planId?: string }): Promise<Subscription[]>;
  getSubscription(id: string): Promise<Subscription | undefined>;
  getActiveSubscriptionByCustomer(customerId: string): Promise<Subscription | undefined>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | undefined>;
  cancelSubscription(id: string): Promise<Subscription | undefined>;

  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayments(filters?: {
    customerId?: string;
    subscriptionId?: string;
    status?: string;
    paymentMethod?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined>;
  getPaymentStats(startDate?: Date, endDate?: Date): Promise<{
    totalRevenue: number;
    totalPayments: number;
    byMethod: Record<string, { count: number; amount: number }>;
    byStatus: Record<string, number>;
    byMonth: Array<{ month: string; amount: number; count: number }>;
  }>;

  // Message Jobs operations
  createMessageJob(job: InsertMessageJob): Promise<MessageJob>;
  getPendingMessageJobs(): Promise<MessageJob[]>;
  getMessageJobsForLead(leadId: string): Promise<MessageJob[]>;
  updateMessageJob(id: string, updates: Partial<MessageJob>): Promise<MessageJob | undefined>;

  // Automation Settings operations
  getAutomationSettings(customerId: string): Promise<AutomationSettings | undefined>;
  getAllAutomationSettings(): Promise<AutomationSettings[]>;
  createOrUpdateAutomationSettings(settings: InsertAutomationSettings): Promise<AutomationSettings>;

  // Usage Ledger operations
  createUsageRecord(usage: InsertUsageLedger): Promise<UsageLedger>;
  getUsageByCustomer(customerId: string, period?: string): Promise<UsageLedger[]>;
  getUsageSummary(customerId: string, period: string): Promise<Record<string, number>>;

  // Extended Lead operations
  getLeadsByCustomer(customerId: string): Promise<Lead[]>;
  getLastInteraction(leadId: string): Promise<InteractionHistory | undefined>;

  // Email verification operations
  createEmailVerificationToken(customerId: string): Promise<string>;
  verifyEmailToken(token: string): Promise<{ success: boolean; customerId?: string; error?: string }>;
  getVerificationTokenByCustomer(customerId: string): Promise<{ token: string; expiresAt: Date } | undefined>;

  // Password reset operations
  createPasswordResetToken(customerId: string): Promise<string>;
  verifyPasswordResetToken(token: string): Promise<{ success: boolean; customerId?: string; error?: string }>;
  getPasswordResetTokenByCustomer(customerId: string): Promise<{ token: string; expiresAt: Date } | undefined>;
  resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }>;

  // Chat message operations
  getChatMessages(customerId: string, limit?: number): Promise<ChatMessage[]>;
  saveChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatHistory(customerId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private leads: Map<string, Lead>;
  private messageTemplates: Map<string, MessageTemplate>;
  private calendarEvents: Map<string, CalendarEvent>;
  private interactions: Map<string, InteractionHistory>;
  private configurations: Map<string, Configuration>;
  private customers: Map<string, Customer>;
  private subscriptions: Map<string, Subscription>;
  private payments: Map<string, Payment>;
  private messageJobsMap: Map<string, MessageJob>;
  private usageLedgerMap: Map<string, UsageLedger>;
  private automationSettingsMap: Map<string, AutomationSettings>;

  constructor() {
    this.leads = new Map();
    this.messageTemplates = new Map();
    this.calendarEvents = new Map();
    this.interactions = new Map();
    this.configurations = new Map();
    this.customers = new Map();
    this.subscriptions = new Map();
    this.payments = new Map();
    this.messageJobsMap = new Map();
    this.usageLedgerMap = new Map();
    this.automationSettingsMap = new Map();
    this.seedDemoData();
  }

  private seedDemoData() {
    // Seed some demo customers and payments for the admin panel
    const demoCustomers: Customer[] = [
      {
        id: "cust-001",
        name: "Maria Santos",
        email: "maria@imobiliaria-santos.pt",
        phone: "+351912345678",
        company: "Imobiliária Santos",
        password: null,
        taxId: "123456789",
        stripeCustomerId: null,
        status: "active",
        plan: "pro",
        trialEndsAt: null,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      },
      {
        id: "cust-002",
        name: "João Silva",
        email: "joao@realtor-lisboa.pt",
        phone: "+351923456789",
        company: "Realtor Lisboa",
        password: null,
        taxId: "987654321",
        stripeCustomerId: null,
        status: "active",
        plan: "basic",
        trialEndsAt: null,
        createdAt: new Date("2024-02-10"),
        updatedAt: new Date("2024-02-10"),
      },
      {
        id: "cust-003",
        name: "Ana Costa",
        email: "ana@costa-imoveis.pt",
        phone: "+351934567890",
        company: "Costa Imóveis",
        password: null,
        taxId: "456789123",
        stripeCustomerId: null,
        status: "active",
        plan: "pro",
        trialEndsAt: null,
        createdAt: new Date("2024-03-05"),
        updatedAt: new Date("2024-03-05"),
      },
    ];

    demoCustomers.forEach(c => this.customers.set(c.id, c));

    const demoSubscriptions: Subscription[] = [
      {
        id: "sub-001",
        customerId: "cust-001",
        planId: "pro",
        planName: "Pro",
        price: 19900,
        currency: "EUR",
        billingCycle: "monthly",
        status: "active",
        stripeSubscriptionId: null,
        currentPeriodStart: new Date("2024-11-01"),
        currentPeriodEnd: new Date("2024-12-01"),
        cancelledAt: null,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-11-01"),
      },
      {
        id: "sub-002",
        customerId: "cust-002",
        planId: "basic",
        planName: "Basic",
        price: 4999,
        currency: "EUR",
        billingCycle: "monthly",
        status: "active",
        stripeSubscriptionId: null,
        currentPeriodStart: new Date("2024-11-10"),
        currentPeriodEnd: new Date("2024-12-10"),
        cancelledAt: null,
        createdAt: new Date("2024-02-10"),
        updatedAt: new Date("2024-11-10"),
      },
      {
        id: "sub-003",
        customerId: "cust-003",
        planId: "pro",
        planName: "Pro",
        price: 19900,
        currency: "EUR",
        billingCycle: "monthly",
        status: "active",
        stripeSubscriptionId: null,
        currentPeriodStart: new Date("2024-11-05"),
        currentPeriodEnd: new Date("2024-12-05"),
        cancelledAt: null,
        createdAt: new Date("2024-03-05"),
        updatedAt: new Date("2024-11-05"),
      },
    ];

    demoSubscriptions.forEach(s => this.subscriptions.set(s.id, s));

    const demoPayments: Payment[] = [
      // November payments
      {
        id: "pay-001",
        customerId: "cust-001",
        subscriptionId: "sub-001",
        amount: 19900,
        currency: "EUR",
        status: "completed",
        paymentMethod: "mbway",
        paymentMethodDetails: { phone: "+351912345678" },
        stripePaymentId: null,
        description: "Subscrição Pro - Novembro 2024",
        invoiceNumber: "INV-2024-001",
        paidAt: new Date("2024-11-01"),
        failedAt: null,
        failureReason: null,
        refundedAt: null,
        refundAmount: null,
        createdAt: new Date("2024-11-01"),
      },
      {
        id: "pay-002",
        customerId: "cust-002",
        subscriptionId: "sub-002",
        amount: 4999,
        currency: "EUR",
        status: "completed",
        paymentMethod: "card",
        paymentMethodDetails: { last4: "4242", brand: "visa" },
        stripePaymentId: null,
        description: "Subscrição Basic - Novembro 2024",
        invoiceNumber: "INV-2024-002",
        paidAt: new Date("2024-11-10"),
        failedAt: null,
        failureReason: null,
        refundedAt: null,
        refundAmount: null,
        createdAt: new Date("2024-11-10"),
      },
      {
        id: "pay-003",
        customerId: "cust-003",
        subscriptionId: "sub-003",
        amount: 19900,
        currency: "EUR",
        status: "completed",
        paymentMethod: "multibanco",
        paymentMethodDetails: { entity: "12345", reference: "123456789" },
        stripePaymentId: null,
        description: "Subscrição Pro - Novembro 2024",
        invoiceNumber: "INV-2024-003",
        paidAt: new Date("2024-11-05"),
        failedAt: null,
        failureReason: null,
        refundedAt: null,
        refundAmount: null,
        createdAt: new Date("2024-11-05"),
      },
      // October payments
      {
        id: "pay-004",
        customerId: "cust-001",
        subscriptionId: "sub-001",
        amount: 19900,
        currency: "EUR",
        status: "completed",
        paymentMethod: "mbway",
        paymentMethodDetails: { phone: "+351912345678" },
        stripePaymentId: null,
        description: "Subscrição Pro - Outubro 2024",
        invoiceNumber: "INV-2024-004",
        paidAt: new Date("2024-10-01"),
        failedAt: null,
        failureReason: null,
        refundedAt: null,
        refundAmount: null,
        createdAt: new Date("2024-10-01"),
      },
      {
        id: "pay-005",
        customerId: "cust-002",
        subscriptionId: "sub-002",
        amount: 4999,
        currency: "EUR",
        status: "completed",
        paymentMethod: "card",
        paymentMethodDetails: { last4: "4242", brand: "visa" },
        stripePaymentId: null,
        description: "Subscrição Basic - Outubro 2024",
        invoiceNumber: "INV-2024-005",
        paidAt: new Date("2024-10-10"),
        failedAt: null,
        failureReason: null,
        refundedAt: null,
        refundAmount: null,
        createdAt: new Date("2024-10-10"),
      },
      {
        id: "pay-006",
        customerId: "cust-003",
        subscriptionId: "sub-003",
        amount: 19900,
        currency: "EUR",
        status: "completed",
        paymentMethod: "mbway",
        paymentMethodDetails: { phone: "+351934567890" },
        stripePaymentId: null,
        description: "Subscrição Pro - Outubro 2024",
        invoiceNumber: "INV-2024-006",
        paidAt: new Date("2024-10-05"),
        failedAt: null,
        failureReason: null,
        refundedAt: null,
        refundAmount: null,
        createdAt: new Date("2024-10-05"),
      },
      // September payments
      {
        id: "pay-007",
        customerId: "cust-001",
        subscriptionId: "sub-001",
        amount: 19900,
        currency: "EUR",
        status: "completed",
        paymentMethod: "card",
        paymentMethodDetails: { last4: "1234", brand: "mastercard" },
        stripePaymentId: null,
        description: "Subscrição Pro - Setembro 2024",
        invoiceNumber: "INV-2024-007",
        paidAt: new Date("2024-09-01"),
        failedAt: null,
        failureReason: null,
        refundedAt: null,
        refundAmount: null,
        createdAt: new Date("2024-09-01"),
      },
      // Failed payment example
      {
        id: "pay-008",
        customerId: "cust-002",
        subscriptionId: "sub-002",
        amount: 4999,
        currency: "EUR",
        status: "failed",
        paymentMethod: "mbway",
        paymentMethodDetails: { phone: "+351923456789" },
        stripePaymentId: null,
        description: "Subscrição Basic - Tentativa falhada",
        invoiceNumber: null,
        paidAt: null,
        failedAt: new Date("2024-09-08"),
        failureReason: "Pagamento recusado pelo utilizador",
        refundedAt: null,
        refundAmount: null,
        createdAt: new Date("2024-09-08"),
      },
    ];

    demoPayments.forEach(p => this.payments.set(p.id, p));
  }

  async createLead(insertLead: InsertLead & Partial<Pick<Lead, 'aiScore' | 'aiReasoning' | 'lastContact'>> & { customerId?: string | null }): Promise<Lead> {
    const id = randomUUID();
    const now = new Date();
    const lead: Lead = {
      id,
      name: insertLead.name,
      property: insertLead.property,
      propertyType: insertLead.propertyType,
      location: insertLead.location,
      price: insertLead.price,
      status: insertLead.status || "frio",
      source: insertLead.source,
      contact: insertLead.contact,
      email: insertLead.email || null,
      notes: insertLead.notes || null,
      optOut: false,
      customerId: insertLead.customerId || null,
      createdAt: now,
      updatedAt: now,
      lastContact: insertLead.lastContact || now,
      aiScore: insertLead.aiScore ?? null,
      aiReasoning: insertLead.aiReasoning ?? null,
    };
    this.leads.set(id, lead);
    return lead;
  }

  async getLeads(filters?: {
    status?: string;
    source?: string;
    location?: string;
    search?: string;
  }): Promise<Lead[]> {
    let results = Array.from(this.leads.values());

    if (filters?.status) {
      results = results.filter((lead) => lead.status === filters.status);
    }
    if (filters?.source) {
      results = results.filter((lead) => lead.source === filters.source);
    }
    if (filters?.location) {
      results = results.filter((lead) =>
        lead.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchLower) ||
          lead.property.toLowerCase().includes(searchLower) ||
          lead.location.toLowerCase().includes(searchLower) ||
          lead.contact.toLowerCase().includes(searchLower)
      );
    }

    return results.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async updateLead(
    id: string,
    updates: Partial<InsertLead>
  ): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (!lead) return undefined;

    const updatedLead: Lead = {
      ...lead,
      ...updates,
      updatedAt: new Date(),
    };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async deleteLead(id: string): Promise<boolean> {
    return this.leads.delete(id);
  }

  async createMessageTemplate(
    insertTemplate: InsertMessageTemplate
  ): Promise<MessageTemplate> {
    const id = randomUUID();
    const now = new Date();
    const template: MessageTemplate = {
      ...insertTemplate,
      id,
      subject: insertTemplate.subject || null,
      variables: insertTemplate.variables ? [...insertTemplate.variables] : null,
      createdAt: now,
      updatedAt: now,
    };
    this.messageTemplates.set(id, template);
    return template;
  }

  async getMessageTemplates(): Promise<MessageTemplate[]> {
    return Array.from(this.messageTemplates.values());
  }

  async getMessageTemplate(id: string): Promise<MessageTemplate | undefined> {
    return this.messageTemplates.get(id);
  }

  async updateMessageTemplate(
    id: string,
    updates: Partial<InsertMessageTemplate>
  ): Promise<MessageTemplate | undefined> {
    const template = this.messageTemplates.get(id);
    if (!template) return undefined;

    const updatedTemplate: MessageTemplate = {
      ...template,
      ...updates,
      variables: updates.variables ? [...updates.variables] : template.variables,
      updatedAt: new Date(),
    };
    this.messageTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteMessageTemplate(id: string): Promise<boolean> {
    return this.messageTemplates.delete(id);
  }

  async createCalendarEvent(
    insertEvent: InsertCalendarEvent
  ): Promise<CalendarEvent> {
    const id = randomUUID();
    const now = new Date();
    const event: CalendarEvent = {
      ...insertEvent,
      id,
      leadId: insertEvent.leadId || null,
      description: insertEvent.description || null,
      location: insertEvent.location || null,
      createdAt: now,
      updatedAt: now,
    };
    this.calendarEvents.set(id, event);
    return event;
  }

  async getCalendarEvents(filters?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<CalendarEvent[]> {
    let results = Array.from(this.calendarEvents.values());

    if (filters?.startDate) {
      results = results.filter(
        (event) => event.startTime >= filters.startDate!
      );
    }
    if (filters?.endDate) {
      results = results.filter((event) => event.startTime <= filters.endDate!);
    }

    return results.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
  }

  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    return this.calendarEvents.get(id);
  }

  async updateCalendarEvent(
    id: string,
    updates: Partial<InsertCalendarEvent>
  ): Promise<CalendarEvent | undefined> {
    const event = this.calendarEvents.get(id);
    if (!event) return undefined;

    const updatedEvent: CalendarEvent = {
      ...event,
      ...updates,
      updatedAt: new Date(),
    };
    this.calendarEvents.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    return this.calendarEvents.delete(id);
  }

  async createInteraction(
    insertInteraction: InsertInteraction
  ): Promise<InteractionHistory> {
    const id = randomUUID();
    const now = new Date();
    const interaction: InteractionHistory = {
      ...insertInteraction,
      id,
      metadata: insertInteraction.metadata || null,
      createdAt: now,
    };
    this.interactions.set(id, interaction);
    return interaction;
  }

  async getInteractionsByLead(leadId: string): Promise<InteractionHistory[]> {
    return Array.from(this.interactions.values())
      .filter((interaction) => interaction.leadId === leadId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllInteractions(): Promise<InteractionHistory[]> {
    return Array.from(this.interactions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getConfiguration(key: string): Promise<Configuration | undefined> {
    return Array.from(this.configurations.values()).find(
      (config) => config.key === key
    );
  }

  async setConfiguration(
    insertConfig: InsertConfiguration
  ): Promise<Configuration> {
    const existing = await this.getConfiguration(insertConfig.key);
    const now = new Date();

    if (existing) {
      const updated: Configuration = {
        ...existing,
        value: insertConfig.value,
        updatedAt: now,
      };
      this.configurations.set(existing.id, updated);
      return updated;
    }

    const id = randomUUID();
    const config: Configuration = {
      ...insertConfig,
      id,
      updatedAt: now,
    };
    this.configurations.set(id, config);
    return config;
  }

  // Customer methods
  async createCustomer(insertCustomer: InsertCustomer & { password?: string | null }): Promise<Customer> {
    const id = randomUUID();
    const now = new Date();
    const customer: Customer = {
      id,
      name: insertCustomer.name,
      email: insertCustomer.email,
      phone: insertCustomer.phone || null,
      company: insertCustomer.company || null,
      password: insertCustomer.password || null,
      taxId: insertCustomer.taxId || null,
      stripeCustomerId: null,
      status: insertCustomer.status || "active",
      plan: insertCustomer.plan || "trial",
      trialEndsAt: insertCustomer.trialEndsAt || null,
      createdAt: now,
      updatedAt: now,
    };
    this.customers.set(id, customer);
    return customer;
  }

  async getCustomers(filters?: { status?: string; search?: string }): Promise<Customer[]> {
    let results = Array.from(this.customers.values());

    if (filters?.status) {
      results = results.filter(c => c.status === filters.status);
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        (c.company && c.company.toLowerCase().includes(searchLower))
      );
    }

    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(c => c.email === email);
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;

    const updated: Customer = {
      ...customer,
      ...updates,
      updatedAt: new Date(),
    };
    this.customers.set(id, updated);
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Subscription methods
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const now = new Date();
    const subscription: Subscription = {
      id,
      customerId: insertSubscription.customerId,
      planId: insertSubscription.planId,
      planName: insertSubscription.planName,
      price: insertSubscription.price,
      currency: insertSubscription.currency || "EUR",
      billingCycle: insertSubscription.billingCycle || "monthly",
      status: insertSubscription.status || "active",
      stripeSubscriptionId: null,
      currentPeriodStart: insertSubscription.currentPeriodStart,
      currentPeriodEnd: insertSubscription.currentPeriodEnd,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async getSubscriptions(filters?: { customerId?: string; status?: string; planId?: string }): Promise<Subscription[]> {
    let results = Array.from(this.subscriptions.values());

    if (filters?.customerId) {
      results = results.filter(s => s.customerId === filters.customerId);
    }
    if (filters?.status) {
      results = results.filter(s => s.status === filters.status);
    }
    if (filters?.planId) {
      results = results.filter(s => s.planId === filters.planId);
    }

    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    return this.subscriptions.get(id);
  }

  async getActiveSubscriptionByCustomer(customerId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(
      s => s.customerId === customerId && s.status === "active"
    );
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return undefined;

    const updated: Subscription = {
      ...subscription,
      ...updates,
      updatedAt: new Date(),
    };
    this.subscriptions.set(id, updated);
    return updated;
  }

  async cancelSubscription(id: string): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return undefined;

    const updated: Subscription = {
      ...subscription,
      status: "cancelled",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    };
    this.subscriptions.set(id, updated);
    return updated;
  }

  // Payment methods
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const now = new Date();
    const payment: Payment = {
      id,
      customerId: insertPayment.customerId || null,
      subscriptionId: insertPayment.subscriptionId || null,
      amount: insertPayment.amount,
      currency: insertPayment.currency || "EUR",
      status: insertPayment.status || "pending",
      paymentMethod: insertPayment.paymentMethod,
      paymentMethodDetails: insertPayment.paymentMethodDetails || null,
      stripePaymentId: null,
      description: insertPayment.description || null,
      invoiceNumber: insertPayment.invoiceNumber || null,
      paidAt: null,
      failedAt: null,
      failureReason: null,
      refundedAt: null,
      refundAmount: null,
      createdAt: now,
    };
    this.payments.set(id, payment);
    return payment;
  }

  async getPayments(filters?: {
    customerId?: string;
    subscriptionId?: string;
    status?: string;
    paymentMethod?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Payment[]> {
    let results = Array.from(this.payments.values());

    if (filters?.customerId) {
      results = results.filter(p => p.customerId === filters.customerId);
    }
    if (filters?.subscriptionId) {
      results = results.filter(p => p.subscriptionId === filters.subscriptionId);
    }
    if (filters?.status) {
      results = results.filter(p => p.status === filters.status);
    }
    if (filters?.paymentMethod) {
      results = results.filter(p => p.paymentMethod === filters.paymentMethod);
    }
    if (filters?.startDate) {
      results = results.filter(p => p.createdAt >= filters.startDate!);
    }
    if (filters?.endDate) {
      results = results.filter(p => p.createdAt <= filters.endDate!);
    }

    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;

    const updated: Payment = {
      ...payment,
      ...updates,
    };
    this.payments.set(id, updated);
    return updated;
  }

  async getPaymentStats(startDate?: Date, endDate?: Date): Promise<{
    totalRevenue: number;
    totalPayments: number;
    byMethod: Record<string, { count: number; amount: number }>;
    byStatus: Record<string, number>;
    byMonth: Array<{ month: string; amount: number; count: number }>;
  }> {
    let payments = Array.from(this.payments.values());

    if (startDate) {
      payments = payments.filter(p => p.createdAt >= startDate);
    }
    if (endDate) {
      payments = payments.filter(p => p.createdAt <= endDate);
    }

    const completedPayments = payments.filter(p => p.status === "completed");
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPayments = payments.length;

    const byMethod: Record<string, { count: number; amount: number }> = {};
    const byStatus: Record<string, number> = {};
    const byMonthMap: Record<string, { amount: number; count: number }> = {};

    payments.forEach(p => {
      // By method
      if (!byMethod[p.paymentMethod]) {
        byMethod[p.paymentMethod] = { count: 0, amount: 0 };
      }
      byMethod[p.paymentMethod].count++;
      if (p.status === "completed") {
        byMethod[p.paymentMethod].amount += p.amount;
      }

      // By status
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;

      // By month
      if (p.status === "completed" && p.paidAt) {
        const monthKey = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonthMap[monthKey]) {
          byMonthMap[monthKey] = { amount: 0, count: 0 };
        }
        byMonthMap[monthKey].amount += p.amount;
        byMonthMap[monthKey].count++;
      }
    });

    const byMonth = Object.entries(byMonthMap)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalRevenue,
      totalPayments,
      byMethod,
      byStatus,
      byMonth,
    };
  }

  // Message Jobs
  async createMessageJob(job: InsertMessageJob): Promise<MessageJob> {
    const id = randomUUID();
    const now = new Date();
    const messageJob: MessageJob = {
      id,
      customerId: job.customerId,
      leadId: job.leadId,
      channel: job.channel,
      templateId: job.templateId || null,
      content: job.content,
      subject: job.subject || null,
      status: "pending",
      trigger: job.trigger,
      scheduledAt: job.scheduledAt,
      sentAt: null,
      attempts: 0,
      lastError: null,
      metadata: job.metadata || null,
      createdAt: now,
    };
    this.messageJobsMap.set(id, messageJob);
    return messageJob;
  }

  async getPendingMessageJobs(): Promise<MessageJob[]> {
    return Array.from(this.messageJobsMap.values())
      .filter(j => j.status === "pending")
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }

  async getMessageJobsForLead(leadId: string): Promise<MessageJob[]> {
    return Array.from(this.messageJobsMap.values())
      .filter(j => j.leadId === leadId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateMessageJob(id: string, updates: Partial<MessageJob>): Promise<MessageJob | undefined> {
    const job = this.messageJobsMap.get(id);
    if (!job) return undefined;
    const updated = { ...job, ...updates };
    this.messageJobsMap.set(id, updated);
    return updated;
  }

  // Automation Settings
  async getAutomationSettings(customerId: string): Promise<AutomationSettings | undefined> {
    return Array.from(this.automationSettingsMap.values())
      .find(s => s.customerId === customerId);
  }

  async getAllAutomationSettings(): Promise<AutomationSettings[]> {
    return Array.from(this.automationSettingsMap.values());
  }

  async createOrUpdateAutomationSettings(settings: InsertAutomationSettings): Promise<AutomationSettings> {
    const existing = await this.getAutomationSettings(settings.customerId);
    const now = new Date();

    if (existing) {
      const updated: AutomationSettings = {
        ...existing,
        ...settings,
        updatedAt: now,
      };
      this.automationSettingsMap.set(existing.id, updated);
      return updated;
    }

    const id = randomUUID();
    const newSettings: AutomationSettings = {
      id,
      customerId: settings.customerId,
      enabled: settings.enabled ?? false,
      autoMessageNewLead: settings.autoMessageNewLead ?? true,
      autoFollowup3Days: settings.autoFollowup3Days ?? true,
      autoFollowup7Days: settings.autoFollowup7Days ?? false,
      preferredChannel: settings.preferredChannel || "whatsapp",
      quietHoursStart: settings.quietHoursStart ?? 21,
      quietHoursEnd: settings.quietHoursEnd ?? 9,
      casafariEnabled: settings.casafariEnabled ?? false,
      casafariSearchParams: settings.casafariSearchParams || null,
      casafariSchedule: settings.casafariSchedule || "daily",
      newLeadTemplateId: settings.newLeadTemplateId || null,
      followupTemplateId: settings.followupTemplateId || null,
      createdAt: now,
      updatedAt: now,
    };
    this.automationSettingsMap.set(id, newSettings);
    return newSettings;
  }

  // Usage Ledger
  async createUsageRecord(usage: InsertUsageLedger): Promise<UsageLedger> {
    const id = randomUUID();
    const record: UsageLedger = {
      id,
      customerId: usage.customerId,
      metric: usage.metric,
      quantity: usage.quantity || 1,
      period: usage.period,
      source: usage.source || null,
      metadata: usage.metadata || null,
      createdAt: new Date(),
    };
    this.usageLedgerMap.set(id, record);
    return record;
  }

  async getUsageByCustomer(customerId: string, period?: string): Promise<UsageLedger[]> {
    return Array.from(this.usageLedgerMap.values())
      .filter(u => u.customerId === customerId && (!period || u.period === period));
  }

  async getUsageSummary(customerId: string, period: string): Promise<Record<string, number>> {
    const records = await this.getUsageByCustomer(customerId, period);
    const summary: Record<string, number> = {};
    records.forEach(r => {
      summary[r.metric] = (summary[r.metric] || 0) + r.quantity;
    });
    return summary;
  }

  // Extended Lead operations
  async getLeadsByCustomer(customerId: string): Promise<Lead[]> {
    return Array.from(this.leads.values())
      .filter(l => l.customerId === customerId);
  }

  async getLastInteraction(leadId: string): Promise<InteractionHistory | undefined> {
    const interactions = await this.getInteractionsByLead(leadId);
    return interactions[0];
  }

  // Email verification - MemStorage implementation (in-memory tokens)
  private emailVerificationTokensMap: Map<string, { customerId: string; token: string; expiresAt: Date; usedAt: Date | null }> = new Map();

  async createEmailVerificationToken(customerId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    this.emailVerificationTokensMap.set(token, {
      customerId,
      token,
      expiresAt,
      usedAt: null
    });
    
    return token;
  }

  async verifyEmailToken(token: string): Promise<{ success: boolean; customerId?: string; error?: string }> {
    const tokenData = this.emailVerificationTokensMap.get(token);
    
    if (!tokenData) {
      return { success: false, error: 'Token inválido' };
    }
    
    if (tokenData.usedAt) {
      return { success: false, error: 'Este token já foi utilizado' };
    }
    
    if (new Date() > tokenData.expiresAt) {
      return { success: false, error: 'Token expirado' };
    }
    
    tokenData.usedAt = new Date();
    
    const customer = this.customers.get(tokenData.customerId);
    if (customer) {
      customer.emailVerified = true;
      customer.emailVerifiedAt = new Date();
    }
    
    return { success: true, customerId: tokenData.customerId };
  }

  async getVerificationTokenByCustomer(customerId: string): Promise<{ token: string; expiresAt: Date } | undefined> {
    for (const [, data] of this.emailVerificationTokensMap) {
      if (data.customerId === customerId && !data.usedAt && new Date() < data.expiresAt) {
        return { token: data.token, expiresAt: data.expiresAt };
      }
    }
    return undefined;
  }

  // Password reset - MemStorage implementation
  private passwordResetTokensMap: Map<string, { customerId: string; token: string; expiresAt: Date; usedAt: Date | null }> = new Map();

  async createPasswordResetToken(customerId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    this.passwordResetTokensMap.set(token, {
      customerId,
      token,
      expiresAt,
      usedAt: null
    });
    
    return token;
  }

  async verifyPasswordResetToken(token: string): Promise<{ success: boolean; customerId?: string; error?: string }> {
    const tokenData = this.passwordResetTokensMap.get(token);
    
    if (!tokenData) {
      return { success: false, error: 'Token inválido' };
    }
    
    if (tokenData.usedAt) {
      return { success: false, error: 'Este token já foi utilizado' };
    }
    
    if (new Date() > tokenData.expiresAt) {
      return { success: false, error: 'Token expirado' };
    }
    
    return { success: true, customerId: tokenData.customerId };
  }

  async getPasswordResetTokenByCustomer(customerId: string): Promise<{ token: string; expiresAt: Date } | undefined> {
    for (const [, data] of this.passwordResetTokensMap) {
      if (data.customerId === customerId && !data.usedAt && new Date() < data.expiresAt) {
        return { token: data.token, expiresAt: data.expiresAt };
      }
    }
    return undefined;
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const tokenData = this.passwordResetTokensMap.get(token);
    
    if (!tokenData) {
      return { success: false, error: 'Token inválido' };
    }
    
    if (tokenData.usedAt) {
      return { success: false, error: 'Este token já foi utilizado' };
    }
    
    if (new Date() > tokenData.expiresAt) {
      return { success: false, error: 'Token expirado' };
    }
    
    const customer = this.customers.get(tokenData.customerId);
    if (!customer) {
      return { success: false, error: 'Cliente não encontrado' };
    }
    
    customer.password = await bcrypt.hash(newPassword, 10);
    tokenData.usedAt = new Date();
    
    return { success: true };
  }

  // Chat message methods for MemStorage
  private chatMessages: Map<string, ChatMessage[]> = new Map();

  async getChatMessages(customerId: string, limit: number = 50): Promise<ChatMessage[]> {
    const messages = this.chatMessages.get(customerId) || [];
    return messages.slice(-limit);
  }

  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      id: randomUUID(),
      customerId: message.customerId,
      role: message.role,
      content: message.content,
      createdAt: new Date(),
    };
    
    const existing = this.chatMessages.get(message.customerId) || [];
    existing.push(newMessage);
    this.chatMessages.set(message.customerId, existing);
    
    return newMessage;
  }

  async clearChatHistory(customerId: string): Promise<boolean> {
    this.chatMessages.delete(customerId);
    return true;
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async createLead(insertLead: InsertLead & Partial<Pick<Lead, 'aiScore' | 'aiReasoning' | 'lastContact'>> & { customerId?: string | null }): Promise<Lead> {
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
      lastContact: insertLead.lastContact || new Date(),
    }).returning();
    return lead;
  }

  async getLeads(filters?: { status?: string; source?: string; location?: string; search?: string }): Promise<Lead[]> {
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

  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async updateLead(id: string, updateData: Partial<InsertLead>): Promise<Lead | undefined> {
    const [lead] = await db.update(leads)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  async deleteLead(id: string): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, id));
    return true;
  }

  async createMessageTemplate(insertTemplate: InsertMessageTemplate): Promise<MessageTemplate> {
    const [template] = await db.insert(messageTemplates).values({
      name: insertTemplate.name,
      content: insertTemplate.content,
      category: insertTemplate.category,
      subject: insertTemplate.subject || null,
      variables: insertTemplate.variables ? [...insertTemplate.variables] : null,
    }).returning();
    return template;
  }

  async getMessageTemplates(): Promise<MessageTemplate[]> {
    return db.select().from(messageTemplates).orderBy(desc(messageTemplates.createdAt));
  }

  async getMessageTemplate(id: string): Promise<MessageTemplate | undefined> {
    const [template] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, id));
    return template;
  }

  async updateMessageTemplate(id: string, updateData: Partial<InsertMessageTemplate>): Promise<MessageTemplate | undefined> {
    const updateValues: any = { updatedAt: new Date() };
    if (updateData.name !== undefined) updateValues.name = updateData.name;
    if (updateData.content !== undefined) updateValues.content = updateData.content;
    if (updateData.category !== undefined) updateValues.category = updateData.category;
    if (updateData.subject !== undefined) updateValues.subject = updateData.subject;
    if (updateData.variables !== undefined) updateValues.variables = updateData.variables ? [...updateData.variables] : null;
    
    const [template] = await db.update(messageTemplates)
      .set(updateValues)
      .where(eq(messageTemplates.id, id))
      .returning();
    return template;
  }

  async deleteMessageTemplate(id: string): Promise<boolean> {
    await db.delete(messageTemplates).where(eq(messageTemplates.id, id));
    return true;
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const [event] = await db.insert(calendarEvents).values(insertEvent).returning();
    return event;
  }

  async getCalendarEvents(filters?: { startDate?: Date; endDate?: Date }): Promise<CalendarEvent[]> {
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

  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    const [event] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
    return event;
  }

  async updateCalendarEvent(id: string, updateData: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined> {
    const [event] = await db.update(calendarEvents)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(calendarEvents.id, id))
      .returning();
    return event;
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
    return true;
  }

  async createInteraction(insertInteraction: InsertInteraction): Promise<InteractionHistory> {
    const [interaction] = await db.insert(interactionHistory).values(insertInteraction).returning();
    return interaction;
  }

  async getInteractionsByLead(leadId: string): Promise<InteractionHistory[]> {
    return db.select().from(interactionHistory).where(eq(interactionHistory.leadId, leadId)).orderBy(desc(interactionHistory.createdAt));
  }

  async getAllInteractions(): Promise<InteractionHistory[]> {
    return db.select().from(interactionHistory).orderBy(desc(interactionHistory.createdAt));
  }

  async getConfiguration(key: string): Promise<Configuration | undefined> {
    const [config] = await db.select().from(configurations).where(eq(configurations.key, key));
    return config;
  }

  async setConfiguration(insertConfig: InsertConfiguration): Promise<Configuration> {
    const existing = await this.getConfiguration(insertConfig.key);
    
    if (existing) {
      const [updated] = await db.update(configurations)
        .set({ value: insertConfig.value, updatedAt: new Date() })
        .where(eq(configurations.key, insertConfig.key))
        .returning();
      return updated;
    }
    
    const [config] = await db.insert(configurations).values(insertConfig).returning();
    return config;
  }

  async createCustomer(insertCustomer: InsertCustomer & { password?: string | null }): Promise<Customer> {
    const [customer] = await db.insert(customers).values({
      name: insertCustomer.name,
      email: insertCustomer.email,
      phone: insertCustomer.phone || null,
      company: insertCustomer.company || null,
      password: insertCustomer.password || null,
      taxId: insertCustomer.taxId || null,
      status: insertCustomer.status || "active",
      plan: insertCustomer.plan || "trial",
      trialEndsAt: insertCustomer.trialEndsAt || null,
    }).returning();
    return customer;
  }

  async getCustomers(filters?: { status?: string; search?: string }): Promise<Customer[]> {
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

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db.update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    await db.delete(customers).where(eq(customers.id, id));
    return true;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db.insert(subscriptions).values({
      customerId: insertSubscription.customerId,
      planId: insertSubscription.planId,
      planName: insertSubscription.planName,
      price: insertSubscription.price,
      currency: insertSubscription.currency || "EUR",
      billingCycle: insertSubscription.billingCycle || "monthly",
      status: insertSubscription.status || "active",
      currentPeriodStart: insertSubscription.currentPeriodStart,
      currentPeriodEnd: insertSubscription.currentPeriodEnd,
    }).returning();
    return subscription;
  }

  async getSubscriptions(filters?: { customerId?: string; status?: string; planId?: string }): Promise<Subscription[]> {
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

  async getSubscription(id: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription;
  }

  async getActiveSubscriptionByCustomer(customerId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions)
      .where(and(eq(subscriptions.customerId, customerId), eq(subscriptions.status, "active")));
    return subscription;
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const [subscription] = await db.update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }

  async cancelSubscription(id: string): Promise<Subscription | undefined> {
    const [subscription] = await db.update(subscriptions)
      .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    return payment;
  }

  async getPayments(filters?: {
    customerId?: string;
    subscriptionId?: string;
    status?: string;
    paymentMethod?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Payment[]> {
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

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const [payment] = await db.update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  async getPaymentStats(startDate?: Date, endDate?: Date): Promise<{
    totalRevenue: number;
    totalPayments: number;
    byMethod: Record<string, { count: number; amount: number }>;
    byStatus: Record<string, number>;
    byMonth: Array<{ month: string; amount: number; count: number }>;
  }> {
    let allPayments = await this.getPayments({ startDate, endDate });
    
    const completedPayments = allPayments.filter(p => p.status === "completed");
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPayments = allPayments.length;

    const byMethod: Record<string, { count: number; amount: number }> = {};
    const byStatus: Record<string, number> = {};
    const byMonthMap: Record<string, { amount: number; count: number }> = {};

    allPayments.forEach(p => {
      if (!byMethod[p.paymentMethod]) {
        byMethod[p.paymentMethod] = { count: 0, amount: 0 };
      }
      byMethod[p.paymentMethod].count++;
      if (p.status === "completed") {
        byMethod[p.paymentMethod].amount += p.amount;
      }

      byStatus[p.status] = (byStatus[p.status] || 0) + 1;

      if (p.status === "completed" && p.paidAt) {
        const monthKey = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonthMap[monthKey]) {
          byMonthMap[monthKey] = { amount: 0, count: 0 };
        }
        byMonthMap[monthKey].amount += p.amount;
        byMonthMap[monthKey].count++;
      }
    });

    const byMonth = Object.entries(byMonthMap)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return { totalRevenue, totalPayments, byMethod, byStatus, byMonth };
  }

  // Message Jobs
  async createMessageJob(job: InsertMessageJob): Promise<MessageJob> {
    const [messageJob] = await db.insert(messageJobs).values(job).returning();
    return messageJob;
  }

  async getPendingMessageJobs(): Promise<MessageJob[]> {
    return db.select().from(messageJobs)
      .where(eq(messageJobs.status, "pending"))
      .orderBy(messageJobs.scheduledAt);
  }

  async getMessageJobsForLead(leadId: string): Promise<MessageJob[]> {
    return db.select().from(messageJobs)
      .where(eq(messageJobs.leadId, leadId))
      .orderBy(desc(messageJobs.createdAt));
  }

  async updateMessageJob(id: string, updates: Partial<MessageJob>): Promise<MessageJob | undefined> {
    const [job] = await db.update(messageJobs)
      .set(updates)
      .where(eq(messageJobs.id, id))
      .returning();
    return job;
  }

  // Automation Settings
  async getAutomationSettings(customerId: string): Promise<AutomationSettings | undefined> {
    const [settings] = await db.select().from(automationSettings)
      .where(eq(automationSettings.customerId, customerId));
    return settings;
  }

  async getAllAutomationSettings(): Promise<AutomationSettings[]> {
    return db.select().from(automationSettings);
  }

  async createOrUpdateAutomationSettings(settings: InsertAutomationSettings): Promise<AutomationSettings> {
    const existing = await this.getAutomationSettings(settings.customerId);
    
    if (existing) {
      const [updated] = await db.update(automationSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(automationSettings.customerId, settings.customerId))
        .returning();
      return updated;
    }
    
    const [newSettings] = await db.insert(automationSettings).values(settings).returning();
    return newSettings;
  }

  // Usage Ledger
  async createUsageRecord(usage: InsertUsageLedger): Promise<UsageLedger> {
    const [record] = await db.insert(usageLedger).values(usage).returning();
    return record;
  }

  async getUsageByCustomer(customerId: string, period?: string): Promise<UsageLedger[]> {
    if (period) {
      return db.select().from(usageLedger)
        .where(and(eq(usageLedger.customerId, customerId), eq(usageLedger.period, period)));
    }
    return db.select().from(usageLedger)
      .where(eq(usageLedger.customerId, customerId));
  }

  async getUsageSummary(customerId: string, period: string): Promise<Record<string, number>> {
    const records = await this.getUsageByCustomer(customerId, period);
    const summary: Record<string, number> = {};
    records.forEach(r => {
      summary[r.metric] = (summary[r.metric] || 0) + r.quantity;
    });
    return summary;
  }

  // Extended Lead operations
  async getLeadsByCustomer(customerId: string): Promise<Lead[]> {
    return db.select().from(leads).where(eq(leads.customerId, customerId));
  }

  async getLastInteraction(leadId: string): Promise<InteractionHistory | undefined> {
    const [interaction] = await db.select().from(interactionHistory)
      .where(eq(interactionHistory.leadId, leadId))
      .orderBy(desc(interactionHistory.createdAt))
      .limit(1);
    return interaction;
  }

  // Email verification - DatabaseStorage implementation
  async createEmailVerificationToken(customerId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    // Token valid for 7 days instead of 24 hours
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await db.insert(emailVerificationTokens).values({
      customerId,
      token,
      expiresAt
    });
    
    return token;
  }

  async verifyEmailToken(token: string): Promise<{ success: boolean; customerId?: string; error?: string }> {
    const [tokenData] = await db.select().from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, token));
    
    if (!tokenData) {
      return { success: false, error: 'Token inválido' };
    }
    
    if (tokenData.usedAt) {
      return { success: false, error: 'Este token já foi utilizado' };
    }
    
    if (new Date() > tokenData.expiresAt) {
      return { success: false, error: 'Token expirado' };
    }
    
    await db.update(emailVerificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationTokens.token, token));
    
    await db.update(customers)
      .set({ 
        emailVerified: true, 
        emailVerifiedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(customers.id, tokenData.customerId));
    
    return { success: true, customerId: tokenData.customerId };
  }

  async getVerificationTokenByCustomer(customerId: string): Promise<{ token: string; expiresAt: Date } | undefined> {
    const [tokenData] = await db.select().from(emailVerificationTokens)
      .where(and(
        eq(emailVerificationTokens.customerId, customerId),
        gte(emailVerificationTokens.expiresAt, new Date())
      ))
      .orderBy(desc(emailVerificationTokens.createdAt))
      .limit(1);
    
    if (tokenData && !tokenData.usedAt) {
      return { token: tokenData.token, expiresAt: tokenData.expiresAt };
    }
    return undefined;
  }

  // Password reset - DatabaseStorage implementation
  async createPasswordResetToken(customerId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    await db.insert(passwordResetTokens).values({
      customerId,
      token,
      expiresAt
    });
    
    return token;
  }

  async verifyPasswordResetToken(token: string): Promise<{ success: boolean; customerId?: string; error?: string }> {
    const [tokenData] = await db.select().from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    
    if (!tokenData) {
      return { success: false, error: 'Token inválido' };
    }
    
    if (tokenData.usedAt) {
      return { success: false, error: 'Este token já foi utilizado' };
    }
    
    if (new Date() > tokenData.expiresAt) {
      return { success: false, error: 'Token expirado' };
    }
    
    return { success: true, customerId: tokenData.customerId };
  }

  async getPasswordResetTokenByCustomer(customerId: string): Promise<{ token: string; expiresAt: Date } | undefined> {
    const [tokenData] = await db.select().from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.customerId, customerId),
        gte(passwordResetTokens.expiresAt, new Date())
      ))
      .orderBy(desc(passwordResetTokens.createdAt))
      .limit(1);
    
    if (tokenData && !tokenData.usedAt) {
      return { token: tokenData.token, expiresAt: tokenData.expiresAt };
    }
    return undefined;
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const [tokenData] = await db.select().from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    
    if (!tokenData) {
      return { success: false, error: 'Token inválido' };
    }
    
    if (tokenData.usedAt) {
      return { success: false, error: 'Este token já foi utilizado' };
    }
    
    if (new Date() > tokenData.expiresAt) {
      return { success: false, error: 'Token expirado' };
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.token, token));
    
    await db.update(customers)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(customers.id, tokenData.customerId));
    
    return { success: true };
  }

  // Chat message operations
  async getChatMessages(customerId: string, limit: number = 50): Promise<ChatMessage[]> {
    const messages = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.customerId, customerId))
      .orderBy(chatMessages.createdAt)
      .limit(limit);
    return messages;
  }

  async saveChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values({
      customerId: message.customerId,
      role: message.role,
      content: message.content,
    }).returning();
    return newMessage;
  }

  async clearChatHistory(customerId: string): Promise<boolean> {
    await db.delete(chatMessages)
      .where(eq(chatMessages.customerId, customerId));
    return true;
  }
}

// Use DatabaseStorage for persistent data
export const storage = new DatabaseStorage();
