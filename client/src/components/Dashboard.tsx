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

interface MetricCard {
  label: string;
  value: string | number;
  change?: number;
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

const mockMetrics: MetricCard[] = [
  {
    label: 'Leads Ativos',
    value: '247',
    change: 12,
    icon: <Users className="w-5 h-5" />,
    trend: 'up',
  },
  {
    label: 'Taxa de Conversão',
    value: '34.5%',
    change: 5.2,
    icon: <TrendingUp className="w-5 h-5" />,
    trend: 'up',
  },
  {
    label: 'Ações Completadas',
    value: '89',
    change: -2,
    icon: <CheckCircle2 className="w-5 h-5" />,
    trend: 'down',
  },
  {
    label: 'Follow-ups Pendentes',
    value: '23',
    change: 8,
    icon: <AlertCircle className="w-5 h-5" />,
    trend: 'down',
  },
];

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    title: 'Lead Qualificado',
    description: 'João Silva avançou para fase de proposta',
    timestamp: '2 minutos atrás',
    type: 'success',
  },
  {
    id: '2',
    title: 'Contacto Sugerido',
    description: 'Maria Oliveira - Score de 85%',
    timestamp: '15 minutos atrás',
    type: 'lead',
  },
  {
    id: '3',
    title: 'Follow-up urgente',
    description: 'Pedro Santos - Sem contacto há 5 dias',
    timestamp: '30 minutos atrás',
    type: 'alert',
  },
  {
    id: '4',
    title: 'Tarefa Automatizada',
    description: 'Email de acompanhamento enviado a 12 leads',
    timestamp: '1 hora atrás',
    type: 'action',
  },
];

const getActivityTypeStyles = (type: string) => {
  const styles = {
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    lead: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    alert: 'bg-red-500/10 border-red-500/30 text-red-400',
    action: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
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

export const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-dark pt-8 pb-16">
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
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl opacity-50" />
          <div className="relative bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6 md:p-8">
            <AgentPanel />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockMetrics.map((metric, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-xl bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 p-6 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
            >
              {/* Gradient background on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-purple-600/5 to-blue-600/5 transition-opacity duration-300" />

              <div className="relative z-10">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-agent mb-4">
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
                  {metric.change !== undefined && (
                    <span className={`text-sm font-semibold ${
                      metric.trend === 'up' 
                        ? 'text-green-400' 
                        : 'text-red-400'
                    }`}>
                      {metric.trend === 'up' ? '+' : ''}{metric.change}%
                    </span>
                  )}
                </div>

                {/* Bottom accent */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Atividade Recente</h2>
                <button className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-semibold">
                  Ver tudo
                </button>
              </div>

              <div className="space-y-3">
                {mockActivity.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 hover:shadow-md hover:shadow-purple-500/10 ${getActivityTypeStyles(item.type)}`}
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
            <div className="rounded-xl bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white">Próximas Ações</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <span className="text-sm text-white">Contactar leads quentes</span>
                  <span className="text-xs font-bold text-purple-400">5</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <span className="text-sm text-white">Follow-ups pendentes</span>
                  <span className="text-xs font-bold text-blue-400">8</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-sm text-white">Propostas para enviar</span>
                  <span className="text-xs font-bold text-green-400">3</span>
                </div>
              </div>
            </div>

            {/* Próximas reuniões */}
            <div className="rounded-xl bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white">Agendadas</h3>
              </div>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-semibold text-white">Visita - Apartamento T3</p>
                  <p className="text-xs text-slate-400 mt-1">Hoje às 14:30</p>
                </div>
                <div className="w-full h-px bg-slate-800" />
                <div className="text-sm">
                  <p className="font-semibold text-white">Reunião com proprietário</p>
                  <p className="text-xs text-slate-400 mt-1">Amanhã às 10:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Performance Trends */}
        <div className="rounded-xl bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 p-6">
          <h2 className="text-xl font-bold text-white mb-6">Performance Mensal</h2>
          
          {/* Simplified chart placeholder */}
          <div className="h-64 flex items-end justify-around gap-4 p-4 bg-slate-900/30 rounded-lg">
            {[65, 75, 70, 85, 80, 90, 95].map((height, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full bg-gradient-to-t from-purple-500 to-blue-500 rounded-t-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50" 
                     style={{ height: `${height}%` }} 
                />
                <span className="text-xs text-slate-400">
                  {String.fromCharCode(83 + idx)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
