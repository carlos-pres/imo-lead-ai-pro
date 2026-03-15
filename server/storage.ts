import { db } from "./db";
import { customers, leads } from "../shared/schema";
import { eq } from "drizzle-orm";

/* ================= CUSTOMERS ================= */

export async function getCustomerByEmail(email: string) {
  return db.query.customers.findFirst({
    where: eq(customers.email, email),
  });
}

export async function getCustomer(id: string) {
  return db.query.customers.findFirst({
    where: eq(customers.id, id),
  });
}

export async function createCustomer(data: any) {
  const [customer] = await db.insert(customers).values(data).returning();
  return customer;
}

/* ================= LEADS ================= */

export async function createLead(data: any) {
  const [lead] = await db.insert(leads).values(data).returning();
  return lead;
}

export async function getLeads(customerId: string) {
  return db.query.leads.findMany({
    where: eq(leads.customerId, customerId),
  });
}

export async function countLeads(customerId: string) {
  const result = await db.query.leads.findMany({
    where: eq(leads.customerId, customerId),
  });

  return result.length;
}
export async function updateCustomer(id: string, data: any) {

  const [customer] = await db
    .update(customers)
    .set(data)
    .where(eq(customers.id, id))
    .returning()

  return customer
}
