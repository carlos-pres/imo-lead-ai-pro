import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Euro,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { AgentPanel } from './AgentPanel';
import type { Lead, LeadStats } from '../services/api';

type KpiTone = 'up' | 'down' | 'neutral';

interface DashboardProps {
  stats: LeadStats;
  topHotLeads: Lead[];
  followUpQueue: Lead[];
}

interface CommercialKpi {
  label: string;
  value: string;
  delta: string;
  tone: KpiTone;
  icon: React.ReactNode;
}

interface PriorityLead {
  id: string;
  name: string;
  location: string;
  stage: string;
  score: number;
  value: string;
  nextStep: string;
}

interface ExecutionItem {
  id: string;
  owner: string;
  action: string;
  window: string;
  status: 'imediato' | 'hoje' | '48h';
}

interface ProofItem {
  id: string;
  title: string;
  result: string;
  detail: string;
}

interface MessageCard {
  id: string;
  channel: 'Email' | 'WhatsApp';
  title: string;
  preview: string;
  cta: string;
}

function formatEuro(value: number) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPipelineStage(stage: Lead['pipelineStage']) {
  if (stage === 'qualificacao') return 'Qualificacao';
  if (stage === 'contactado') return 'Contactado';
  if (stage === 'visita') return 'Visita';
  if (stage === 'proposta') return 'Proposta';
  if (stage === 'nurture') return 'Nurture';
  return 'Novo';
}

function getKpiToneClasses(tone: KpiTone) {
  if (tone === 'up') return 'text-emerald-300';
  if (tone === 'down') return 'text-amber-300';
  return 'text-slate-300';
}

function getExecutionStatusClasses(status: ExecutionItem['status']) {
  if (status === 'imediato') return 'bg-rose-500/15 border-rose-400/40 text-rose-200';
  if (status === 'hoje') return 'bg-indigo-500/15 border-indigo-400/40 text-indigo-200';
  return 'bg-slate-800/80 border-slate-600/60 text-slate-200';
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, topHotLeads, followUpQueue }) => {
  const responseRate = stats.total > 0 ? Math.round((stats.contacted_today / stats.total) * 100) : 0;
  const opportunityValue = topHotLeads.slice(0, 6).reduce((total, lead) => total + lead.price, 0);
  const queuedFollowUps = followUpQueue.length;

  const commercialKpis: CommercialKpi[] = [
    {
      label: 'Receita em negociacao',
      value: formatEuro(opportunityValue || 0),
      delta: `${topHotLeads.length} leads de alta prioridade`,
      tone: 'up',
      icon: <Euro className="h-5 w-5" />,
    },
    {
      label: 'Leads prioritarias hoje',
      value: `${topHotLeads.length}`,
      delta: `${stats.flagship_queue} na desk flagship`,
      tone: 'neutral',
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: 'Taxa de resposta',
      value: `${responseRate}%`,
      delta: `${stats.contacted_today} contactos hoje`,
      tone: 'up',
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      label: 'Follow-ups vencidos',
      value: `${stats.overdue_followups}`,
      delta: `${queuedFollowUps} follow-ups na fila ativa`,
      tone: stats.overdue_followups > 0 ? 'down' : 'neutral',
      icon: <TrendingDown className="h-5 w-5" />,
    },
  ];

  const priorityLeads: PriorityLead[] = topHotLeads.slice(0, 4).map((lead) => ({
    id: lead.id,
    name: lead.name,
    location: lead.location,
    stage: formatPipelineStage(lead.pipelineStage),
    score: lead.aiScore,
    value: formatEuro(lead.price),
    nextStep: lead.nextStep || lead.recommendedAction || 'Executar contacto inicial com contexto comercial.',
  }));

  const topLead = priorityLeads[0] || {
    id: 'empty',
    name: 'Sem lead prioritario',
    location: 'Aguarda novas entradas',
    stage: 'Novo',
    score: stats.average_ai_score || 0,
    value: formatEuro(0),
    nextStep: 'A equipa pode abrir o pipeline e preparar a proxima vaga de contactos.',
  };

  const executionPlan: ExecutionItem[] = [
    {
      id: 'plan-1',
      owner: 'Desk Flagship',
      action: `Executar ${Math.min(3, Math.max(1, topHotLeads.length))} contactos de score alto`,
      window: 'Proximas 2h',
      status: 'imediato',
    },
    {
      id: 'plan-2',
      owner: 'Inside Sales',
      action: `Limpar ${stats.overdue_followups} follow-ups fora de prazo`,
      window: 'Hoje ate 18:00',
      status: 'hoje',
    },
    {
      id: 'plan-3',
      owner: 'Gestao Comercial',
      action: `Ajustar distribuicao de ${stats.total} leads por desk`,
      window: 'Em 48h',
      status: '48h',
    },
  ];

  const proofItems: ProofItem[] = [
    {
      id: 'proof-1',
      title: 'Leads contactadas hoje',
      result: `${stats.contacted_today}`,
      detail: 'Velocidade de resposta comercial no dia em curso.',
    },
    {
      id: 'proof-2',
      title: 'Heat do pipeline',
      result: `${stats.total > 0 ? Math.round((stats.quente / stats.total) * 100) : 0}%`,
      detail: 'Percentagem de leads quentes no total ativo.',
    },
    {
      id: 'proof-3',
      title: 'Mercados ativos',
      result: `${stats.european_markets}`,
      detail: 'Cobertura comercial ja ativa no workspace.',
    },
  ];

  const firstLead = topHotLeads[0];
  const secondLead = topHotLeads[1];

  const messageCards: MessageCard[] = [
    {
      id: 'msg-1',
      channel: 'Email',
      title: firstLead ? `Proposta pronta para ${firstLead.name}` : 'Proposta premium pronta',
      preview: firstLead
        ? `${firstLead.location}: ${firstLead.recommendedAction}`
        : 'Mensagem de proposta com comparavel de mercado e proximo passo claro.',
      cta: 'Abrir email',
    },
    {
      id: 'msg-2',
      channel: 'WhatsApp',
      title: secondLead ? `Follow-up para ${secondLead.name}` : 'Follow-up com urgencia',
      preview: secondLead
        ? `${secondLead.location}: ${secondLead.recommendedAction}`
        : 'Mensagem curta para reativar interesse e bloquear agenda.',
      cta: 'Abrir WhatsApp',
    },
  ];

  const riskList = [
    `${stats.overdue_followups} follow-ups fora de prazo podem cair para churn comercial.`,
    `${stats.nurture_queue} leads em nurture pedem sequencia de reativacao.`,
    `${stats.flagship_queue} leads no flagship exigem prioridade da equipa senior.`,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 pb-16 pt-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-indigo-400/25 bg-slate-900/70 p-6 shadow-2xl shadow-indigo-950/30 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
                Cockpit comercial de decisao
              </p>
              <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Um dashboard que mostra valor em 10 segundos e diz a equipa o que fazer agora.
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                A vista combina prioridade comercial, prova de desempenho e proxima acao operacional.
                Sem ruido, sem adivinhacao, com CTA direto para fechar pipeline.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:brightness-110"
                  href="/app/pipeline"
                >
                  Abrir pipeline de fecho
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900/70 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-indigo-400/60"
                  href="/app/automation"
                >
                  Executar automacoes
                </a>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Semana de entrega ativa
                </span>
              </div>
            </div>

            <article className="rounded-2xl border border-slate-700/80 bg-slate-950/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-200">
                Prioridade comercial agora
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{topLead.name}</h2>
              <p className="mt-1 text-sm text-slate-300">
                {topLead.location} · {topLead.stage} · Score IA {topLead.score}
              </p>
              <p className="mt-4 rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-200">
                {topLead.nextStep}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-400">Ticket</p>
                  <strong className="text-base text-white">{topLead.value}</strong>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-400">Janela</p>
                  <strong className="text-base text-white">2 horas</strong>
                </div>
              </div>

              <a
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-400/60 bg-indigo-500/15 px-4 py-2.5 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/25"
                href="/app/automation"
              >
                Abrir plano de acao
                <Target className="h-4 w-4" />
              </a>
            </article>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {commercialKpis.map((kpi) => (
            <article
              className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-5 transition hover:border-indigo-400/45"
              key={kpi.label}
            >
              <div className="mb-4 inline-flex rounded-lg bg-indigo-500/15 p-2 text-indigo-200">
                {kpi.icon}
              </div>
              <p className="text-sm text-slate-300">{kpi.label}</p>
              <strong className="mt-2 block text-3xl font-semibold text-white">{kpi.value}</strong>
              <p className={`mt-2 text-xs font-semibold ${getKpiToneClasses(kpi.tone)}`}>{kpi.delta}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <article className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-200">
                    Pipeline de alto impacto
                  </p>
                  <h2 className="text-xl font-semibold text-white">Leads prontas para fechar esta semana</h2>
                </div>
                <a
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-indigo-400/60"
                  href="/app/pipeline"
                >
                  Ver pipeline
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="space-y-3">
                {priorityLeads.length === 0 ? (
                  <article className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                    <strong className="text-base text-white">Sem leads quentes neste momento</strong>
                    <p className="mt-2 text-sm text-slate-300">
                      Abre o pipeline para validar novas entradas e definir prioridade.
                    </p>
                  </article>
                ) : (
                  priorityLeads.map((lead) => (
                    <article
                      className="rounded-xl border border-slate-700 bg-slate-950/50 p-4 transition hover:border-indigo-400/45"
                      key={lead.id}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <strong className="text-base text-white">{lead.name}</strong>
                          <p className="text-sm text-slate-300">
                            {lead.location} · {lead.stage} · {lead.value}
                          </p>
                        </div>
                        <span className="rounded-full border border-indigo-400/35 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-200">
                          Score IA {lead.score}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-200">{lead.nextStep}</p>
                    </article>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6">
              <div className="mb-5 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <h2 className="text-xl font-semibold text-white">Prova de resultado desta semana</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {proofItems.map((item) => (
                  <article className="rounded-xl border border-slate-700 bg-slate-950/50 p-4" key={item.id}>
                    <p className="text-xs uppercase tracking-wider text-slate-400">{item.title}</p>
                    <strong className="mt-2 block text-2xl text-emerald-300">{item.result}</strong>
                    <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
                  </article>
                ))}
              </div>
            </article>

            <article
              className="rounded-2xl border border-indigo-400/25 bg-slate-900/75 p-6 shadow-lg shadow-indigo-950/30"
              id="agent-panel"
            >
              <div className="mb-5 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-200" />
                <h2 className="text-xl font-semibold text-white">Copiloto comercial</h2>
              </div>
              <AgentPanel />
            </article>
          </div>

          <div className="space-y-6">
            <article className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6">
              <div className="mb-5 flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-indigo-200" />
                <h2 className="text-lg font-semibold text-white">Plano de execucao 48h</h2>
              </div>
              <div className="space-y-3">
                {executionPlan.map((item) => (
                  <article
                    className={`rounded-xl border p-4 ${getExecutionStatusClasses(item.status)}`}
                    key={item.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm">{item.owner}</strong>
                      <span className="text-xs font-semibold uppercase tracking-wider">{item.status}</span>
                    </div>
                    <p className="mt-2 text-sm">{item.action}</p>
                    <p className="mt-2 text-xs text-slate-300">{item.window}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6">
              <div className="mb-5 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-white">Comunicacao pronta</h2>
                <a
                  className="text-sm font-semibold text-indigo-200 transition hover:text-indigo-100"
                  href="/app/automation"
                >
                  Abrir centro
                </a>
              </div>
              <div className="space-y-3">
                {messageCards.map((card) => (
                  <article className="rounded-xl border border-slate-700 bg-slate-950/50 p-4" key={card.id}>
                    <p className="text-xs uppercase tracking-wider text-slate-400">{card.channel}</p>
                    <strong className="mt-1 block text-sm text-white">{card.title}</strong>
                    <p className="mt-2 text-sm text-slate-300">{card.preview}</p>
                    <a
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-200 transition hover:text-indigo-100"
                      href="/app/automation"
                    >
                      {card.cta}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </article>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-amber-400/30 bg-amber-500/5 p-6">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-300" />
                <h2 className="text-lg font-semibold text-white">Risco comercial hoje</h2>
              </div>
              <ul className="space-y-2 text-sm text-amber-100">
                {riskList.map((risk) => (
                  <li className="rounded-lg border border-amber-400/20 bg-slate-950/40 p-3" key={risk}>
                    {risk}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
};
