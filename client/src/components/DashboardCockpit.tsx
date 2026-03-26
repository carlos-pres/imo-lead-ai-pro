import React from 'react';
import { Sparkles, TrendingUp, Users, AlertCircle, CheckCircle2, Clock, Zap, Target } from 'lucide-react';

/**
 * DashboardCockpit
 * 
 * Cockpit minimalista com paleta GOLD PREMIUM + BLACK:
 * - Agente de IA em posição central (dourado)
 * - 4 métricas principais 
 * - O que fazer AGORA (3 ações)
 * - Status do workspace em rodapé
 */

interface CockpitMetric {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  color: 'gold' | 'gold-light' | 'gold-alt' | 'silver';
}

interface CockpitAction {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  priority: 'high' | 'medium' | 'low';
}

interface DashboardCockpitProps {
  agentStatus?: 'ready' | 'processing' | 'idle';
  agentInsight?: string;
  metrics?: CockpitMetric[];
  actions?: CockpitAction[];
  lastUpdate?: string;
  workspaceStatus?: string;
}

const getColorStyles = (color: string) => {
  const colors = {
    gold: 'bg-gold-500/20 border-gold-500/40 text-gold-400',
    'gold-light': 'bg-gold-400/20 border-gold-400/40 text-gold-300',
    'gold-alt': 'bg-gold-600/20 border-gold-600/40 text-gold-500',
    silver: 'bg-slate-500/20 border-slate-500/40 text-slate-300',
  };
  return colors[color as keyof typeof colors];
};

const getPriorityStyles = (priority: string) => {
  const styles = {
    high: 'bg-gold-500/10 border-gold-500/20',
    medium: 'bg-gold-400/10 border-gold-400/20',
    low: 'bg-slate-700/20 border-slate-600/30',
  };
  return styles[priority as keyof typeof styles];
};

export const DashboardCockpit: React.FC<DashboardCockpitProps> = ({
  agentStatus = 'ready',
  agentInsight = 'Agente preparado para receber ações comerciais e gerar valor',
  metrics,
  actions,
  lastUpdate = 'Agora',
  workspaceStatus = 'Online',
}) => {
  // Mock data se não for fornecido
  const defaultMetrics: CockpitMetric[] = metrics || [
    {
      label: 'Leads Ativos',
      value: '0',
      unit: 'em carteira',
      icon: <Users className="w-5 h-5" />,
      color: 'gold',
    },
    {
      label: 'Score Médio',
      value: '0',
      unit: '%',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'gold-light',
    },
    {
      label: 'Ações Hoje',
      value: '0',
      unit: 'completadas',
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'gold-alt',
    },
    {
      label: 'Follow-ups',
      value: '0',
      unit: 'urgentes',
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'silver',
    },
  ];

  const defaultActions: CockpitAction[] = actions || [
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Primeira ação',
      description: 'Comece a adicionar leads manualmente ou via integração',
      buttonLabel: 'Adicionar lead',
      onClick: () => console.log('Add lead'),
      priority: 'high',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Conectar origem',
      description: 'Ative captura automática de leads de portais imobiliários',
      buttonLabel: 'Conectar API',
      onClick: () => console.log('Connect API'),
      priority: 'medium',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Agendar follow-ups',
      description: 'Configure cadência automática de contactos comerciais',
      buttonLabel: 'Configurar automação',
      onClick: () => console.log('Setup automation'),
      priority: 'medium',
    },
  ];

  const statusColor =
    agentStatus === 'ready'
      ? 'text-gold-400'
      : agentStatus === 'processing'
        ? 'text-gold-300'
        : 'text-slate-400';

  const statusDot =
    agentStatus === 'ready'
      ? 'bg-gold-500'
      : agentStatus === 'processing'
        ? 'bg-gold-400'
        : 'bg-slate-500';

  return (
    <div className="min-h-screen bg-gradient-dark pt-8 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* ===== HEADER ===== */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-2">Cockpit Comercial</h1>
          <p className="text-lg text-slate-300">Seu agente de IA premium e ações prioritárias</p>
        </div>

        {/* ===== AGENT SECTION (CENTRAL & PROMINENT) ===== */}
        <div className="mb-12 p-8 rounded-3xl bg-gradient-to-br from-gold-500/15 to-gold-600/10 border border-gold-500/30 relative overflow-hidden shadow-gold-glow">
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/15 rounded-full blur-3xl" />

          <div className="relative z-10">
            {/* Agent Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-xl bg-gradient-gold shadow-gold-glow">
                  <Sparkles className="w-8 h-8 text-black-900" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Agente Premium</h2>
                  <div className={`flex items-center gap-2 ${statusColor}`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse-gold ${statusDot}`} />
                    <span className="text-sm font-semibold">
                      {agentStatus === 'ready'
                        ? 'Pronto para ação'
                        : agentStatus === 'processing'
                          ? 'A processar'
                          : 'Aguardando dados'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 mb-1">Última atualização</p>
                <p className="text-sm font-semibold text-gold-400">{lastUpdate}</p>
              </div>
            </div>

            {/* Agent Insight */}
            <div className="bg-black-800/50 border border-gold-500/20 rounded-xl p-4 mb-6">
              <p className="text-slate-200 text-sm leading-relaxed font-medium">{agentInsight}</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-3">
              {defaultMetrics.map((metric, idx) => (
                <div key={idx} className={`p-4 rounded-xl border transition-all hover:shadow-lg hover:shadow-gold-500/20 ${getColorStyles(metric.color)}`}>
                  <div className="flex items-center gap-2 mb-2 text-gold-400">
                    <span>{metric.icon}</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{metric.value}</div>
                  <p className="text-xs text-slate-400 mt-1">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== NOW ACTIONS (O QUE FAZER AGORA) ===== */}
        <div className="mb-12">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white">Ações Prioritárias</h3>
            <p className="text-slate-400 mt-2">Próximos passos para ativar seu cockpit comercial</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {defaultActions.map((action, idx) => (
              <div
                key={idx}
                className={`group p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:shadow-gold-500/15 ${getPriorityStyles(
                  action.priority
                )}`}
              >
                {/* Priority Badge */}
                <div className="inline-flex items-center gap-2 mb-4">
                  {action.priority === 'high' && (
                    <span className="px-3 py-1 rounded-full bg-gold-500/90 text-black-900 text-xs font-bold">
                      URGENTE
                    </span>
                  )}
                  {action.priority === 'medium' && (
                    <span className="px-3 py-1 rounded-full bg-gold-400/80 text-black-900 text-xs font-bold">
                      IMPORTANTE
                    </span>
                  )}
                </div>

                {/* Icon */}
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gold-500/20 mb-4 text-gold-400 group-hover:bg-gold-500/30 group-hover:text-gold-300 transition-all">
                  {action.icon}
                </div>

                {/* Title & Description */}
                <h4 className="text-lg font-bold text-white mb-2">{action.title}</h4>
                <p className="text-sm text-slate-300 mb-6 leading-relaxed">{action.description}</p>

                {/* Button */}
                <button
                  onClick={action.onClick}
                  className="w-full px-4 py-2.5 rounded-lg bg-gradient-gold text-black-900 font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-gold-500/30 active:scale-95"
                >
                  {action.buttonLabel}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ===== FOOTER STATUS ===== */}
        <div className="p-6 rounded-xl bg-black-800/50 border border-gold-500/20 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse-gold" />
            <span className="text-white font-semibold">Workspace {workspaceStatus}</span>
          </div>
          <p className="text-xs text-slate-400">
            Agente sincronizado • API conectada • Pronto para operação premium
          </p>
        </div>
      </div>
    </div>
  );
};
