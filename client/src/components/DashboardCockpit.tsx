import { ArrowRight, ChevronRight, RefreshCcw, Sparkles, Target, Waves, WifiOff } from "lucide-react";

type KpiItem = {
  label: string;
  value: string;
  detail: string;
};

export function AICopilotHero({
  greeting,
  summary,
  bestOpportunityTitle,
  bestOpportunity,
  recommendation,
  justification,
  primaryCta,
  secondaryCta,
  tertiaryCta,
}: {
  greeting: string;
  summary: string;
  bestOpportunityTitle: string;
  bestOpportunity: string;
  recommendation: string;
  justification: string;
  primaryCta: string;
  secondaryCta: string;
  tertiaryCta: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-indigo-400/20 bg-slate-900/75 p-6 shadow-2xl shadow-indigo-950/25 sm:p-8 lg:p-10">
      <div className="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-100">
            <Sparkles className="h-3.5 w-3.5" />
            Agente IA ativo
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
              Mesa de decisão comercial
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              {greeting} {summary}
            </h1>
          </div>
          <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">{bestOpportunity}</p>
          <div className="grid gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/45 p-4">
            <p className="text-sm font-semibold text-indigo-100">{recommendation}</p>
            <p className="text-sm leading-relaxed text-slate-300">{justification}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/25 transition hover:brightness-110">
              {primaryCta}
              <Target className="h-4 w-4" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-950/60 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-indigo-400/50">
              {secondaryCta}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-950/60 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/50">
              {tertiaryCta}
              <Waves className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-700/80 bg-slate-950/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Melhor oportunidade
          </p>
          <div className="mt-3 space-y-3">
            <div>
              <h2 className="text-2xl font-semibold text-white">{bestOpportunityTitle}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-3">
                <span className="text-xs uppercase tracking-wider text-slate-400">Estado</span>
                <strong className="mt-1 block text-lg text-white">Prioridade máxima</strong>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-3">
                <span className="text-xs uppercase tracking-wider text-slate-400">Janela</span>
                <strong className="mt-1 block text-lg text-white">Ainda hoje</strong>
              </div>
            </div>
            <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-4">
              <p className="text-sm font-semibold text-indigo-100">Próxima ação recomendada</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-200">{recommendation}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PriorityActionCard() {
  return (
    <section className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">
            Ação prioritária
          </p>
          <h2 className="text-xl font-semibold text-white">Executar agora para não perder tração</h2>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/35 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-100">
          Ver plano de ação
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">1. Contacto</p>
          <strong className="mt-1 block text-white">Enviar no WhatsApp</strong>
          <p className="mt-2 text-sm text-slate-300">Abrir conversa com contexto comercial pronto a usar.</p>
        </article>
        <article className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">2. Valor</p>
          <strong className="mt-1 block text-white">Ver proposta</strong>
          <p className="mt-2 text-sm text-slate-300">Mostrar comparável e argumento de mercado imediatamente.</p>
        </article>
        <article className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">3. Seguimento</p>
          <strong className="mt-1 block text-white">Agendar seguimento</strong>
          <p className="mt-2 text-sm text-slate-300">Bloquear a próxima janela útil sem perda de ritmo.</p>
        </article>
      </div>
    </section>
  );
}

export function PriorityLeadCard({
  name,
  location,
  property,
  score,
  value,
  nextStep,
  channel,
  reasoning,
}: {
  name: string;
  location: string;
  property: string;
  score: number;
  value: string;
  nextStep: string;
  channel: string;
  reasoning: string;
}) {
  return (
    <section className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">
            Lead prioritário
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">{name}</h2>
          <p className="mt-1 text-sm text-slate-300">
            {location} · {property}
          </p>
        </div>
        <div className="rounded-2xl border border-indigo-400/25 bg-indigo-500/10 px-4 py-3 text-right">
          <span className="text-xs uppercase tracking-wider text-indigo-100">Score IA</span>
          <strong className="block text-2xl text-white">{score}</strong>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
          <span className="text-xs uppercase tracking-wider text-slate-400">Valor</span>
          <strong className="mt-1 block text-lg text-white">{value}</strong>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
          <span className="text-xs uppercase tracking-wider text-slate-400">Canal recomendado</span>
          <strong className="mt-1 block text-lg text-white">{channel}</strong>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
          <span className="text-xs uppercase tracking-wider text-slate-400">Próxima ação</span>
          <strong className="mt-1 block text-lg text-white">{nextStep}</strong>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Justificação</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">{reasoning}</p>
      </div>
    </section>
  );
}

export function KPIOverviewRow({ kpis }: { kpis: KpiItem[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {kpis.map((kpi) => (
        <article className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-5" key={kpi.label}>
          <p className="text-sm text-slate-300">{kpi.label}</p>
          <strong className="mt-2 block text-3xl font-semibold text-white">{kpi.value}</strong>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-200">
            {kpi.detail}
          </p>
        </article>
      ))}
    </section>
  );
}

export function QuickActionsBar() {
  const actions = [
    "Contactar agora",
    "Abrir pipeline",
    "Ver automações",
    "Enviar no WhatsApp",
    "Ver proposta",
    "Agendar seguimento",
  ];

  return (
    <section className="rounded-3xl border border-slate-700/70 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        {actions.map((action) => (
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-indigo-400/45 hover:bg-slate-900"
            key={action}
          >
            {action}
            <ChevronRight className="h-4 w-4" />
          </button>
        ))}
      </div>
    </section>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 pb-16 pt-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <div className="h-72 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
        <div className="h-36 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
        <div className="h-40 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-32 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
          <div className="h-32 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
          <div className="h-32 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
        </div>
        <div className="h-24 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
      </div>
    </div>
  );
}

export function DashboardErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 pb-16 pt-6 text-slate-100">
      <div className="mx-auto flex max-w-4xl items-start px-4 sm:px-6 lg:px-8">
        <div className="w-full rounded-3xl border border-rose-400/20 bg-slate-900/80 p-6 shadow-2xl shadow-rose-950/20">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-rose-200">
              <WifiOff className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-200">Erro de ligação</p>
              <h1 className="text-2xl font-semibold text-white">Não foi possível carregar os dados do cockpit.</h1>
              <p className="text-sm text-slate-300">Verifique a ligação ou tente novamente.</p>
              <p className="text-sm text-slate-400">{message}</p>
            </div>
          </div>
          <button
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white"
            onClick={onRetry}
            type="button"
          >
            Tentar novamente
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
