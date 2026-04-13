import React from 'react';
import { AlertCircle, CheckCircle2, Clock3, Sparkles, TrendingUp, Zap } from 'lucide-react';

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
    title: 'Lead com 87% de probabilidade de fecho',
    description: 'Marta Costa, T3 em Cascais. Existe janela de contacto curta e alto interesse.',
    icon: 'sparkles',
    priority: 'high',
    score: 87,
    action: 'Contactar agora',
    timeframe: 'Próximas 2h',
  },
  {
    id: '2',
    title: 'Imóvel com preço 12% abaixo do mercado',
    description: 'Moradia em Cascais com margem para proposta competitiva imediata.',
    icon: 'trending',
    priority: 'high',
    score: 92,
    action: 'Abrir proposta',
    timeframe: 'Hoje',
  },
  {
    id: '3',
    title: 'Follow-up com risco de perda',
    description: 'Sofia Nunes sem resposta há 5 dias. Recomendado contacto por WhatsApp.',
    icon: 'alert',
    priority: 'medium',
    action: 'Reativar conversa',
    timeframe: 'Hoje',
  },
  {
    id: '4',
    title: 'Fecho confirmado em desk flagship',
    description: 'Pedro Oliveira avançou para assinatura após proposta simplificada.',
    icon: 'check',
    priority: 'low',
  },
];

const iconMap: Record<AgentRecommendation['icon'], React.ReactNode> = {
  sparkles: <Sparkles className="h-4 w-4" />,
  trending: <TrendingUp className="h-4 w-4" />,
  alert: <AlertCircle className="h-4 w-4" />,
  check: <CheckCircle2 className="h-4 w-4" />,
};

function getPriorityStyles(priority: AgentRecommendation['priority']) {
  if (priority === 'high') {
    return 'border-indigo-400/40 bg-indigo-500/10 text-indigo-100';
  }

  if (priority === 'medium') {
    return 'border-sky-400/35 bg-sky-500/10 text-sky-100';
  }

  return 'border-slate-600/60 bg-slate-800/70 text-slate-200';
}

function getPriorityLabel(priority: AgentRecommendation['priority']) {
  if (priority === 'high') {
    return 'Prioridade alta';
  }

  if (priority === 'medium') {
    return 'Prioridade média';
  }

  return 'Prioridade baixa';
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
  recommendations = mockRecommendations,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div className="h-24 animate-pulse rounded-xl bg-slate-800/70" key={item} />
        ))}
      </div>
    );
  }

  const urgentCount = recommendations.filter((item) => item.priority === 'high').length;
  const averageScore = Math.round(
    recommendations.reduce((acc, item) => acc + (item.score || 0), 0) /
      Math.max(
        1,
        recommendations.reduce((acc, item) => (item.score ? acc + 1 : acc), 0)
      )
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-200">
            Motor de recomendação
          </p>
          <h3 className="text-lg font-semibold text-white">Onde a equipa deve agir primeiro</h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/35 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-100">
          <Zap className="h-3.5 w-3.5" />
          {urgentCount} urgentes agora
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {recommendations.map((rec) => (
          <article className="rounded-xl border border-slate-700 bg-slate-950/60 p-4" key={rec.id}>
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityStyles(rec.priority)}`}>
                {getPriorityLabel(rec.priority)}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                {iconMap[rec.icon]}
                {rec.score ? `Score ${rec.score}%` : 'Sem score'}
              </span>
            </div>

            <strong className="text-sm text-white">{rec.title}</strong>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{rec.description}</p>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              {rec.action ? (
                <button
                  className="rounded-lg border border-indigo-400/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-100 transition hover:bg-indigo-500/20"
                  type="button"
                >
                  {rec.action}
                </button>
              ) : (
                <span className="text-xs text-slate-400">Sem ação manual</span>
              )}

              {rec.timeframe ? (
                <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                  <Clock3 className="h-3.5 w-3.5" />
                  {rec.timeframe}
                </span>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
        <div className="text-center">
          <strong className="block text-lg text-white">{urgentCount}</strong>
          <span className="text-xs text-slate-400">Urgentes</span>
        </div>
        <div className="text-center">
          <strong className="block text-lg text-white">{recommendations.length}</strong>
          <span className="text-xs text-slate-400">Recomendações</span>
        </div>
        <div className="text-center">
          <strong className="block text-lg text-white">{averageScore}%</strong>
          <span className="text-xs text-slate-400">Score médio</span>
        </div>
      </div>
    </div>
  );
};
