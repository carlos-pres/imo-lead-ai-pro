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
    timeframe: 'PrÃ³ximas 2h',
  },
  {
    id: '2',
    title: 'ImÃ³vel com preÃ§o 12% abaixo do mercado',
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
    description: 'Sofia Nunes sem resposta hÃ¡ 5 dias. Recomendado contacto por WhatsApp.',
    icon: 'alert',
    priority: 'medium',
    action: 'Reativar conversa',
    timeframe: 'Hoje',
  },
  {
    id: '4',
    title: 'Fecho confirmado em desk flagship',
    description: 'Pedro Oliveira avanÃ§ou para assinatura apÃ³s proposta simplificada.',
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

  return 'border-[#13223734]/60 bg-[#f7faff] text-[#415066]';
}

function getPriorityLabel(priority: AgentRecommendation['priority']) {
  if (priority === 'high') {
    return 'Prioridade alta';
  }

  if (priority === 'medium') {
    return 'Prioridade mÃ©dia';
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
          <div className="h-24 animate-pulse rounded-xl bg-[#f7faff]" key={item} />
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
            Motor de recomendaÃ§Ã£o
          </p>
          <h3 className="text-lg font-semibold text-[#132237]">Onde a equipa deve agir primeiro</h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/35 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-100">
          <Zap className="h-3.5 w-3.5" />
          {urgentCount} urgentes agora
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {recommendations.map((rec) => (
          <article className="rounded-xl border border-[#13223724] bg-white/88 p-4" key={rec.id}>
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityStyles(rec.priority)}`}>
                {getPriorityLabel(rec.priority)}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[#7a8698]">
                {iconMap[rec.icon]}
                {rec.score ? `Score ${rec.score}%` : 'Sem score'}
              </span>
            </div>

            <strong className="text-sm text-[#132237]">{rec.title}</strong>
            <p className="mt-2 text-sm leading-relaxed text-[#7a8698]">{rec.description}</p>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              {rec.action ? (
                <button
                  className="rounded-lg border border-indigo-400/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-100 transition hover:bg-indigo-500/20"
                  type="button"
                >
                  {rec.action}
                </button>
              ) : (
                <span className="text-xs text-[#8ea0b5]">Sem aÃ§Ã£o manual</span>
              )}

              {rec.timeframe ? (
                <span className="inline-flex items-center gap-1 text-xs text-[#7a8698]">
                  <Clock3 className="h-3.5 w-3.5" />
                  {rec.timeframe}
                </span>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-xl border border-[#13223724] bg-white/85 p-3">
        <div className="text-center">
          <strong className="block text-lg text-[#132237]">{urgentCount}</strong>
          <span className="text-xs text-[#8ea0b5]">Urgentes</span>
        </div>
        <div className="text-center">
          <strong className="block text-lg text-[#132237]">{recommendations.length}</strong>
          <span className="text-xs text-[#8ea0b5]">RecomendaÃ§Ãµes</span>
        </div>
        <div className="text-center">
          <strong className="block text-lg text-[#132237]">{averageScore}%</strong>
          <span className="text-xs text-[#8ea0b5]">Score mÃ©dio</span>
        </div>
      </div>
    </div>
  );
};
