export type PlanType = "basic" | "pro";
export type PlanStatus = "trial" | "active" | "inactive";

export const PLAN_CONFIG = {
  basic: {
    leadLimit: 100,
    advancedAI: false,
  },
  pro: {
    leadLimit: Infinity,
    advancedAI: true,
  },
};
