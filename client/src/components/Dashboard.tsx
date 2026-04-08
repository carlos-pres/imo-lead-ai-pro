import React from 'react';
import { 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Zap,
  Target,
  Calendar
} from 'lucide-react';
import { AgentPanel } from './AgentPanel';
import type { Lead, LeadStats } from '../services/api';

interface MetricCard {
  label: string;
  value: string | number;
  changeText?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'lead' | 'action' | 'success' | 'alert';
}

type DashboardProps = {
  stats: LeadStats;
  topHotLeads: Lead[];
  followUpQueue: Lead[];
};

function formatRelativeLabel(value?: string | null) {
  if (!value) return 'Sem data';

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return 'Sem data';

  const diffMs = timestamp.getTime() - Date.now();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffHours / 24);

  if (diffHours < 0) {
    if (Math.abs(diffHours) >= 24) {
      return `Atrasado ${Math.abs(diffDays)}d`;
    }
    return `Atrasado ${Math.abs(diffHours)}h`;
  }

  if (diffHours === 0) {
    return 'Agora';
  }

  if (diffHours >= 24) {
    return `Em ${diffDays}d`;
  }

  return `Em ${diffHours}h`;
}

const getActivityTypeStyles = (type: string) => {
  const styles = {
    success: 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200',
    lead: 'bg-indigo-500/10 border-indigo-400/30 text-indigo-200',
    alert: 'bg-rose-500/10 border-rose-400/30 text-rose-200',
    action: 'bg-slate-700/30 border-slate-600/40 text-slate-200',
  };
  return styles[type as keyof typeof styles];
};

const getActivityIcon = (type: string) => {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4" />,
    lead: <Activity className="w-4 h-4" />,
    alert: <AlertCircle className="w-4 h-4" />,
    action: <Zap className="w-4 h-4" />,
  };
  return icons[type as keyof typeof icons];
};

export const Dashboard: React.FC<DashboardProps> = ({ stats, topHotLeads, followUpQueue }) => {
  const hotLeadRate =
    stats.total > 0 ? Math.round((stats.quente / stats.total) * 100) : 0;

  const liveMetrics: MetricCard[] = [
    {
      label: 'Leads Ativos',
      value: stats.total,
      changeText: `${stats.contacted_today} contactados hoje`,
      icon: <Users className="w-5 h-5" />,
      trend: stats.contacted_today > 0 ? 'up' : 'down',
    },
    {
      label: 'Score Médio IA',
      value: `${stats.average_ai_score}%`,
      changeText: `${hotLeadRate}% quentes`,
      icon: <TrendingUp className="w-5 h-5" />,
      trend: stats.quente > 0 ? 'up' : 'down',
    },
    {
      label: 'Ações Urgentes',
      value: stats.urgent_actions,
      changeText: `${stats.flagship_queue} flagship`,
      icon: <CheckCircle2 className="w-5 h-5" />,
      trend: stats.urgent_actions <= stats.flagship_queue ? 'up' : 'down',
    },
    {
      label: 'Follow-ups Pendentes',
      value: stats.overdue_followups,
      changeText: `${followUpQueue.length} na fila`,
      icon: <AlertCircle className="w-5 h-5" />,
      trend: stats.overdue_followups > 0 ? 'down' : 'up',
    },
  ];

  const liveActivity: ActivityItem[] = [
    ...topHotLeads.slice(0, 2).map((lead) => ({
      id: `hot-${lead.id}`,
      title: 'Lead Quente Prioritária',
      description: `${lead.name} · ${lead.location} · Score ${lead.aiScore}%`,
      timestamp: formatRelativeLabel(lead.lastContactAt),
      type: 'success' as const,
    })),
    ...followUpQueue.slice(0, 2).map((lead) => ({
      id: `follow-${lead.id}`,
      title: 'Follow-up em Fila',
      description: `${lead.name} · ${lead.nextStep || 'Rever contexto e contactar'}`,
      timestamp: formatRelativeLabel(lead.followUpAt),
      type: 'alert' as const,
    })),
  ];

  const activityFeed = liveActivity.length > 0
    ? liveActivity
    : [
        {
          id: 'empty',
          title: 'Sem atividade recente',
          description: 'Assim que entrarem novas leads, o cockpit mostra prioridades aqui.',
          timestamp: 'Agora',
          type: 'action' as const,
        },
      ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 pt-8 pb-16">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Cockpit de IA
          </h1>
          <p className="text-lg text-slate-400">
            Decisões comerciais inteligentes em tempo real
          </p>
        </div>

        {/* Agent Panel - Featured */}
        <div className="relative" id="agent-panel">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-indigo-500/25 to-blue-500/25 rounded-2xl blur-xl opacity-60" />
          <div className="relative bg-slate-900/70 backdrop-blur-lg border border-purple-500/30 rounded-2xl p-6 md:p-8 shadow-2xl shadow-purple-900/30">
            <AgentPanel />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {liveMetrics.map((metric, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-xl bg-slate-900/70 backdrop-blur-sm border border-slate-800 p-6 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/25"
            >
              {/* Gradient background on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 transition-opacity duration-300" />

              <div className="relative z-10">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
                  <div className="text-white">
                    {metric.icon}
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm text-slate-400 mb-2">{metric.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">
                    {metric.value}
                  </span>
                  {metric.changeText ? (
                    <span className={`text-sm font-semibold ${
                      metric.trend === 'up' 
                        ? 'text-indigo-300' 
                        : 'text-slate-500'
                    }`}>
                      {metric.changeText}
                    </span>
                  ) : null}
                </div>

                {/* Bottom accent */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-black-950/50 backdrop-blur-sm border border-gold-500/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Atividade Recente</h2>
                <button className="text-gold-400 hover:text-gold-300 transition-colors text-sm font-semibold">
                  Ver tudo
                </button>
              </div>

              <div className="space-y-3">
                {activityFeed.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 hover:shadow-md hover:shadow-gold-500/10 ${getActivityTypeStyles(item.type)}`}
                  >
                    {/* Icon */}
                    <div className="mt-1">
                      {getActivityIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="text-sm text-slate-300 mt-1">{item.description}</p>
                    </div>

                    {/* Timestamp */}
                    <div className="flex-shrink-0">
                      <p className="text-xs text-slate-400 whitespace-nowrap">
                        {item.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            {/* Próximas ações */}
            <div className="rounded-xl bg-black-950/50 backdrop-blur-sm border border-gold-500/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-gold-400" />
                <h3 className="font-bold text-white">Próximas Ações</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/25">
                  <span className="text-sm text-white">Contactar leads quentes</span>
                  <span className="text-xs font-bold text-indigo-200">{stats.quente}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/25">
                  <span className="text-sm text-white">Follow-ups pendentes</span>
                  <span className="text-xs font-bold text-purple-200">{followUpQueue.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/25">
                  <span className="text-sm text-white">Propostas para enviar</span>
                  <span className="text-xs font-bold text-blue-200">{stats.growth_queue}</span>
                </div>
              </div>
            </div>

            {/* Próximas reuniões */}
            <div className="rounded-xl bg-black-950/50 backdrop-blur-sm border border-gold-500/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-gold-400" />
                <h3 className="font-bold text-white">Agendadas</h3>
              </div>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-semibold text-white">
                    {followUpQueue[0] ? `Follow-up · ${followUpQueue[0].name}` : 'Sem reuniões agendadas'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {followUpQueue[0] ? formatRelativeLabel(followUpQueue[0].followUpAt) : 'Adiciona data no pipeline'}
                  </p>
                </div>
                <div className="w-full h-px bg-slate-800" />
                <div className="text-sm">
                  <p className="font-semibold text-white">
                    {followUpQueue[1] ? `Contacto · ${followUpQueue[1].name}` : 'Fila pronta para priorização'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {followUpQueue[1] ? formatRelativeLabel(followUpQueue[1].followUpAt) : 'Sem segundo compromisso'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Performance Trends */}
        <div className="rounded-xl bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 p-6">
          <h2 className="text-xl font-bold text-white mb-6">Performance Mensal</h2>
          
          {/* Simplified chart placeholder */}
          <div className="h-64 flex items-end justify-around gap-4 p-4 bg-black-900/30 rounded-lg">
            {[
              { label: 'Hot', value: stats.quente, max: Math.max(stats.total, 1) },
              { label: 'Warm', value: stats.morno, max: Math.max(stats.total, 1) },
              { label: 'Cold', value: stats.frio, max: Math.max(stats.total, 1) },
              { label: 'Flag', value: stats.flagship_queue, max: Math.max(stats.total, 1) },
              { label: 'Grow', value: stats.growth_queue, max: Math.max(stats.total, 1) },
              { label: 'Nurt', value: stats.nurture_queue, max: Math.max(stats.total, 1) },
              { label: 'Urg', value: stats.urgent_actions, max: Math.max(stats.total, 1) },
            ].map((entry) => {
              const ratio = Math.min(100, Math.max(8, Math.round((entry.value / entry.max) * 100)));
              return (
              <div key={entry.label} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full bg-gradient-to-t from-purple-500 via-indigo-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/40" 
                     style={{ height: `${ratio}%` }} 
                />
                <span className="text-xs text-slate-400">
                  {entry.label}
                </span>
              </div>
            )})}
          </div>
        </div>
      </div>
    </div>
  );
};
