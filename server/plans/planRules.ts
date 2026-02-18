export type PlanId = "basic" | "pro" | "custom";

export const PLAN_RULES: Record<
  PlanId,
  {
    maxLeadsPerMonth: number;
    autoContact: boolean;
    advancedAI: boolean;
    multiLocation: boolean;
    maxMessagesPerMonth: number;
  }
> = {
  basic: {
    maxLeadsPerMonth: 100,
    autoContact: false,
    advancedAI: false,
    multiLocation: false,
    maxMessagesPerMonth: 100,
  },
  pro: {
    maxLeadsPerMonth: 500,
    autoContact: true,
    advancedAI: true,
    multiLocation: true,
    maxMessagesPerMonth: 500,
  },
  custom: {
    maxLeadsPerMonth: 999999,
    autoContact: true,
    advancedAI: true,
    multiLocation: true,
    maxMessagesPerMonth: 999999,
  },
};
