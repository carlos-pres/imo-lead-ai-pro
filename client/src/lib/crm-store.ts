import { createContext, useContext } from "react";
import type { Lead, LeadStats, PipelineStage } from "../services/api";
import { selectAverageAIScore, selectPipelineValue, selectPriorityLead, selectRecommendedNextAction, selectUrgentLeadCount } from "./selectors";

export type CrmTask = {
  id: string;
  title: string;
  done: boolean;
  leadId?: string;
};

export type CrmAutomation = {
  id: string;
  name: string;
  status: "ativa" | "pausada" | "rascunho";
  trigger: string;
  objective: string;
  lastRun: string;
};

export type CrmStoreState = {
  leads: Lead[];
  pipelineStages: PipelineStage[];
  tasks: CrmTask[];
  aiInsights: string[];
  automations: CrmAutomation[];
  focusLeadId: string | null;
  recommendations: string[];
  stats: LeadStats;
};

export type CrmStoreActions = {
  moveLead: (leadId: string, stage: PipelineStage) => void;
  updateLeadStatus: (leadId: string, status: Lead["status"]) => void;
  setFocusLead: (leadId: string | null) => void;
  completeTask: (taskId: string) => void;
  scheduleFollowUp: (leadId: string, followUpAt: string) => void;
  refreshDashboardInsights: () => void;
  activateAutomation: (automationId: string) => void;
  pauseAutomation: (automationId: string) => void;
};

export type CrmStoreSelectors = {
  selectPriorityLead: () => Lead | undefined;
  selectUrgentLeadCount: () => number;
  selectPipelineValue: () => number;
  selectAverageAIScore: () => number;
  selectRecommendedNextAction: () => string;
};

export type CrmStoreValue = CrmStoreState & CrmStoreActions & CrmStoreSelectors;

export const CrmStoreContext = createContext<CrmStoreValue | null>(null);

export function useCrmStore() {
  const context = useContext(CrmStoreContext);
  if (!context) {
    throw new Error("CrmStoreContext não foi encontrado.");
  }

  return context;
}

export function createCrmStoreSelectors(leads: Lead[], stats: LeadStats): CrmStoreSelectors {
  return {
    selectPriorityLead: () => selectPriorityLead(leads),
    selectUrgentLeadCount: () => selectUrgentLeadCount(stats),
    selectPipelineValue: () => selectPipelineValue(leads),
    selectAverageAIScore: () => selectAverageAIScore(leads),
    selectRecommendedNextAction: () => selectRecommendedNextAction(selectPriorityLead(leads)),
  };
}

