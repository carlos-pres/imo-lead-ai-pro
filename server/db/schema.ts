import { pgTable, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const leads = pgTable("leads", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  name: text("name").notNull(),
  property: text("property").notNull(),
  location: text("location").notNull(),
  price: integer("price").notNull(),
  area: integer("area"),
  source: text("source").notNull(),
  status: text("status").notNull(),
  aiScore: integer("ai_score"),
  reasoning: text("reasoning"),
  recommendedAction: text("recommended_action"),
  routingBucket: text("routing_bucket"),
  slaHours: integer("sla_hours"),
  assignedTeam: text("assigned_team"),
  assignedOwner: text("assigned_owner"),
  officeName: text("office_name"),
  pipelineStage: text("pipeline_stage"),
  nextStep: text("next_step"),
  followUpAt: timestamp("follow_up_at"),
  lastContactAt: timestamp("last_contact_at"),
  strategyGoal: text("strategy_goal"),
  outreachChannel: text("outreach_channel"),
  outreachMessage: text("outreach_message"),
  market: text("market"),
  countryCode: text("country_code"),
  preferredLanguage: text("preferred_language"),
  currencyCode: text("currency_code"),
  intelligenceVersion: integer("intelligence_version"),
  contact: text("contact"),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
});
