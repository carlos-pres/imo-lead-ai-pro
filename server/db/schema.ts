import { pgTable, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// =========================
// CUSTOMERS
// =========================

export const customers = pgTable("customers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  company: text("company"),

  password: text("password"),
  taxId: text("tax_id"),

  stripeCustomerId: text("stripe_customer_id"),

  status: varchar("status", { length: 20 })
    .notNull()
    .default("active"),

  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  googleTokenExpiry: timestamp("google_token_expiry"),

  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow(),
});

// =========================
// SUBSCRIPTIONS
// =========================

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  customerId: varchar("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),

  plan: varchar("plan", { length: 20 })
    .notNull()
    .default("basic"), // basic | pro | custom

  status: varchar("status", { length: 20 })
    .notNull()
    .default("trial"), // trial | active | canceled

  leadsLimit: integer("leads_limit")
    .notNull()
    .default(50),

  leadsUsed: integer("leads_used")
    .notNull()
    .default(0),

  trialEndsAt: timestamp("trial_ends_at"),

  currentPeriodStart: timestamp("current_period_start")
    .notNull()
    .defaultNow(),

  currentPeriodEnd: timestamp("current_period_end")
    .notNull(),

  stripeSubscriptionId: text("stripe_subscription_id"),

  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow(),
});
