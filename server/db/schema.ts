// server/db/schema.ts

export type CustomerStatus = "active" | "inactive" | "suspended";
export type PlanType = "trial" | "basic" | "pro";

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;

  password: string | null;
  taxId: string | null;

  stripeCustomerId: string | null;

  status: CustomerStatus;
  plan: PlanType;
  trialEndsAt: Date | null;

  googleAccessToken?: string | null;
  googleRefreshToken?: string | null;
  googleTokenExpiry?: Date | null;

  createdAt: Date;
  updatedAt: Date;
};

export type InsertCustomer = Omit<
  Customer,
  "id" | "createdAt" | "updatedAt" | "stripeCustomerId"
>;

export type AutomationSettings = {
  id: string;
  customerId: string;

  enabled: boolean | null;

  autoMessageNewLead: boolean | null;
  autoFollowup3Days: boolean | null;
  autoFollowup7Days: boolean | null;

  lastSearchAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
};

export type InsertAutomationSettings = Omit<
  AutomationSettings,
  "id" | "createdAt" | "updatedAt"
>;
