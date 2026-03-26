import React, { useState } from 'react';
import { Sparkles, TrendingUp, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface AgentRecommendation {
  id: string;
  title: string;
  description: string;
  score?: number;
  action?: string;
  timeframe?: string;
  icon: 'sparkles' | 'trending' | 'alert' | 'check';
  priority: 'high' | 'medium' | 'low';
}

interface AgentPanelProps {
  recommendations?: AgentRecommendation[];
  isLoading?: boolean;
}

const mockRecommendations: AgentRecommendation[] = [
  {
    id: '1',
    title: 'Lead com 87% de probabilidade de conversão',
    description: 'João Silva - Apartamento T3 em Lisboa. Visitou a propriedade 3 vezes.',
    icon: 'sparkles',
    priority: 'high',
    score: 87,
    action: 'Contactar agora',
    timeframe: 'Próximas 2 horas',
  },
  {
    id: '2',
    title: 'Imóvel abaixo do mercado em 12%',
    description: 'Moradia em Cascais com preço 15% abaixo da avaliação de mercado',
    icon: 'trending',
    priority: 'high',
    score: 92,
    action: 'Aproveitar oportunidade',
  },
  {
    id: '3',
    title: 'Follow-up urgente',
    description: 'Maria Santos - Última comunicação há 7 dias. Proposta de visto golden.',
    icon: 'alert',
    priority: 'high',
    timeframe: 'Hoje',
  },
  {
    id: '4',
    title: 'Fechado com sucesso',
    description: 'Pedro Oliveira - Contrato assinado para venda de propriedade',
    icon: 'check',
    priority: 'medium',
  },
];

const IconComponent: React.FC<{ icon: string }> = ({ icon }) => {
  switch (icon) {
    case 'sparkles':
      return <Sparkles className="w-5 h-5" />;
    case 'trending':
      return <TrendingUp className="w-5 h-5" />;
    case 'alert':
      return <AlertCircle className="w-5 h-5" />;
    case 'check':
      return <CheckCircle2 className="w-5 h-5" />;
    default:
      return <Sparkles className="w-5 h-5" />;
  }
};

const getPriorityStyles = (priority: string) => {
  const styles = {
    high: 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 hover:border-red-500/60',
    medium: 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 hover:border-yellow-500/60',
    low: 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 hover:border-blue-500/60',
  };
  return styles[priority as keyof typeof styles];
};

const getPriorityBadgeColor = (priority: string) => {
  const colors = {
    high: 'bg-red-500/80 text-white',
    medium: 'bg-yellow-500/80 text-white',
    low: 'bg-blue-500/80 text-white',
  };
  return colors[priority as keyof typeof colors];
};

export const AgentPanel: React.FC<AgentPanelProps> = ({ 
  recommendations = mockRecommendations,
  isLoading = false,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="w-full bg-slate-950 rounded-2xl border border-purple-500/20 p-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-900/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gradient-agent">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Agente de IA</h2>
          <p className="text-sm text-slate-400">Recomendações e insights automáticos</p>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
            className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-300 cursor-pointer transform hover:scale-105 ${getPriorityStyles(rec.priority)}`}
          >
            {/* Background gradient effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-purple-500/20 to-blue-500/20 transition-opacity duration-300" />

            <div className="relative z-10">
              {/* Top row: Icon + Priority + Score */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${
                    rec.priority === 'high' 
                      ? 'bg-red-500/20 text-red-400' 
                      : rec.priority === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    <IconComponent icon={rec.icon} />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${getPriorityBadgeColor(rec.priority)} px-2.5 py-1 rounded-full`}>
                      {rec.priority === 'high' ? 'Urgente' : rec.priority === 'medium' ? 'Normal' : 'Baixa'}
                    </p>
                  </div>
                </div>
                {rec.score && (
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                      {rec.score}%
                    </div>
                    <span className="text-xs text-slate-400">Score IA</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h3 className="font-semibold text-white mb-2 leading-snug line-clamp-2">
                {rec.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                {rec.description}
              </p>

              {/* Footer: Action + Timeframe */}
              <div className="flex items-center justify-between gap-2">
                {rec.action && (
                  <button className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20">
                    {rec.action}
                  </button>
                )}
                {rec.timeframe && (
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {rec.timeframe}
                  </div>
                )}
              </div>

              {/* Expanded content */}
              {expandedId === rec.id && (
                <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">
                      <strong className="text-slate-300">Análise completa:</strong> Esta recomendação foi gerada através de análise em tempo real dos dados de mercado, histórico de interações e padrões de conversão do seu portfólio.
                    </p>
                    <button className="w-full mt-3 px-4 py-2 bg-gradient-agent rounded-lg text-white font-semibold text-sm hover:shadow-lg transition-all hover:scale-105">
                      Executar ação
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-800">
        <div className="text-center">
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
            {recommendations.filter(r => r.priority === 'high').length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Urgentes</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            {recommendations.length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Recomendações</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
            {Math.round((recommendations.reduce((acc, r) => acc + (r.score || 0), 0) / (recommendations.filter(r => r.score).length || 1)))}%
          </div>
          <p className="text-xs text-slate-400 mt-1">Score médio</p>
        </div>
      </div>
    </div>
  );
};
