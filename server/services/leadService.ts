import { desc } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db, schema } from "../db";

export type Lead = InferSelectModel<typeof schema.leads>;
export type NewLead = InferInsertModel<typeof schema.leads>;

const DEFAULT_LIMIT = 50;

export async function listLeads(limit?: number, offset?: number) {
  const safeLimit = Math.min(Number(limit) || DEFAULT_LIMIT, 200);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  return db
    .select()
    .from(schema.leads)
    .orderBy(desc(schema.leads.createdAt))
    .limit(safeLimit)
    .offset(safeOffset);
}

export async function createLead(input: Partial<NewLead>) {
  const required = ["name", "property", "location", "price", "source", "status"] as const;
  for (const key of required) {
    if (!input[key]) {
      throw new Error(`Field ${key} is required`);
    }
  }

  const payload: NewLead = {
    name: input.name!,
    property: input.property!,
    location: input.location!,
    price: Number(input.price),
    source: input.source!,
    status: input.status!,
    area: input.area ? Number(input.area) : null,
    aiScore: input.aiScore ? Number(input.aiScore) : null,
    reasoning: input.reasoning ?? null,
    recommendedAction: input.recommendedAction ?? null,
    routingBucket: input.routingBucket ?? null,
    slaHours: input.slaHours ? Number(input.slaHours) : null,
    assignedTeam: input.assignedTeam ?? null,
    assignedOwner: input.assignedOwner ?? null,
    officeName: input.officeName ?? null,
    pipelineStage: input.pipelineStage ?? null,
    nextStep: input.nextStep ?? null,
    followUpAt: input.followUpAt ? new Date(input.followUpAt as any) : null,
    lastContactAt: input.lastContactAt ? new Date(input.lastContactAt as any) : null,
    strategyGoal: input.strategyGoal ?? null,
    outreachChannel: input.outreachChannel ?? null,
    outreachMessage: input.outreachMessage ?? null,
    market: input.market ?? null,
    countryCode: input.countryCode ?? null,
    preferredLanguage: input.preferredLanguage ?? null,
    currencyCode: input.currencyCode ?? null,
    planId: input.planId ?? null,
    planName: input.planName ?? null,
    agentLabel: input.agentLabel ?? null,
    intelligenceVersion: input.intelligenceVersion ? Number(input.intelligenceVersion) : null,
    contact: input.contact ?? null,
    notes: input.notes ?? null,
    createdAt: undefined,
    id: input.id ?? undefined,
  };

  const [lead] = await db.insert(schema.leads).values(payload).returning();
  return lead;
}
