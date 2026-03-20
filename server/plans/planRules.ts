import { PLAN_CONFIG, type PlanType } from "../core/plans.js";

export type PlanId = PlanType;

export const PLAN_RULES: Record<
  PlanId,
  {
    maxLeadsPerMonth: number;
    autoContact: boolean;
    advancedAI: boolean;
    multiLocation: boolean;
    maxMessagesPerMonth: number;
    reportsLabel: string;
    includedMarkets: string[];
  }
> = {
  basic: {
    maxLeadsPerMonth: PLAN_CONFIG.basic.leadLimit,
    autoContact: PLAN_CONFIG.basic.autoContact,
    advancedAI: PLAN_CONFIG.basic.advancedAI,
    multiLocation: PLAN_CONFIG.basic.multiLocation,
    maxMessagesPerMonth: PLAN_CONFIG.basic.maxMessagesPerMonth,
    reportsLabel: PLAN_CONFIG.basic.reportsLabel,
    includedMarkets: PLAN_CONFIG.basic.includedMarkets,
  },
  pro: {
    maxLeadsPerMonth: PLAN_CONFIG.pro.leadLimit,
    autoContact: PLAN_CONFIG.pro.autoContact,
    advancedAI: PLAN_CONFIG.pro.advancedAI,
    multiLocation: PLAN_CONFIG.pro.multiLocation,
    maxMessagesPerMonth: PLAN_CONFIG.pro.maxMessagesPerMonth,
    reportsLabel: PLAN_CONFIG.pro.reportsLabel,
    includedMarkets: PLAN_CONFIG.pro.includedMarkets,
  },
  custom: {
    maxLeadsPerMonth: PLAN_CONFIG.custom.leadLimit,
    autoContact: PLAN_CONFIG.custom.autoContact,
    advancedAI: PLAN_CONFIG.custom.advancedAI,
    multiLocation: PLAN_CONFIG.custom.multiLocation,
    maxMessagesPerMonth: PLAN_CONFIG.custom.maxMessagesPerMonth,
    reportsLabel: PLAN_CONFIG.custom.reportsLabel,
    includedMarkets: PLAN_CONFIG.custom.includedMarkets,
  },
};
