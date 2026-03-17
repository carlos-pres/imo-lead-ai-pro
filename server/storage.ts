import { db } from "./db/index.js";
import { leads, customers } from "./db/schema.js";
import { eq } from "drizzle-orm";

/*
Storage Layer
Responsável por toda comunicação com o banco.
Outros serviços não devem acessar o banco diretamente.
*/

export async function createLead(data: any) {

  const [lead] = await db
    .insert(leads)
    .values(data)
    .returning();

  return lead;
}

export async function getLeads(customerId: string) {

  return db.query.leads.findMany({
    where: eq(leads.customerId, customerId)
  });

}

export async function countLeads(customerId: string) {

  const result = await db.query.leads.findMany({
    where: eq(leads.customerId, customerId)
  });

  return result.length;
}

export async function updateCustomer(id: string, data: any) {

  const [customer] = await db
    .update(customers)
    .set(data)
    .where(eq(customers.id, id))
    .returning();

  return customer;

}