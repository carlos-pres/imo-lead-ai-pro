import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* ===================== CUSTOMERS ===================== */

export const customers = pgTable("customers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  name: text("name").notNull(),

  email: text("email")
    .notNull()
    .unique(),

  password: text("password").notNull(),

  plan: varchar("plan", { length: 20 })
    .notNull()
    .default("basic"), // basic | pro | custom

  status: varchar("status", { length: 20 })
    .notNull()
    .default("active"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

/* ===================== INSERT CUSTOMER ===================== */

export const insertCustomerSchema = createInsertSchema(customers).extend({
  email: z.string().email(),
  plan: z.enum(["basic", "pro", "custom"]).default("basic"),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

/* ===================== LEADS ===================== */

export const leads = pgTable("leads", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  customerId: varchar("customer_id").notNull(),

  name: text("name").notNull(),

  property: text("property").notNull(),

  status: varchar("status", { length: 20 })
    .notNull()
    .default("frio"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

/* ===================== INSERT LEAD ===================== */

export const insertLeadSchema = createInsertSchema(leads).extend({
  status: z.enum(["quente", "morno", "frio"]).default("frio"),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;