import React from 'react';
import { Dashboard } from './Dashboard';
import type { LeadStats } from '../services/api';

/**
 * DashboardPage
 *
 * Wrapper page para o dashboard premium com o AgentPanel em destaque.
 */
export const DashboardPage: React.FC = () => {
  const emptyStats: LeadStats = {
    total: 0,
    quente: 0,
    morno: 0,
    frio: 0,
    average_ai_score: 0,
    flagship_queue: 0,
    growth_queue: 0,
    nurture_queue: 0,
    urgent_actions: 0,
    active_teams: 0,
    active_offices: 0,
    overdue_followups: 0,
    contacted_today: 0,
    european_markets: 0,
  };

  return <Dashboard stats={emptyStats} topHotLeads={[]} followUpQueue={[]} />;
};
