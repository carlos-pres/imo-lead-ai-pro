import { useMemo } from "react";
import { ActionButton } from "./ActionButton";

type OnboardingPanelProps = {
  totalLeads: number;
  priorityLeadName?: string;
  hasFollowUp: boolean;
  hasAutomation: boolean;
  onImportCsv?: (file: File) => void | Promise<void>;
  onSyncApi?: () => void | Promise<void>;
  onOpenPipeline?: () => void;
  onOpenAutomation?: () => void;
  onScheduleFollowUp?: () => void;
};

export function OnboardingPanel({
  totalLeads,
  priorityLeadName,
  hasFollowUp,
  hasAutomation,
  onImportCsv,
  onSyncApi,
  onOpenPipeline,
  onOpenAutomation,
  onScheduleFollowUp,
}: OnboardingPanelProps) {
  const steps = useMemo(
    () => [
      { label: "Importar leads", done: totalLeads > 0, detail: `${totalLeads} leads disponíveis` },
      { label: "Definir lead prioritário", done: Boolean(priorityLeadName), detail: priorityLeadName || "Sem lead prioritário" },
      { label: "Agendar primeiro seguimento", done: hasFollowUp, detail: hasFollowUp ? "Seguimento ativo" : "Sem seguimento" },
      { label: "Ativar primeira automação", done: hasAutomation, detail: hasAutomation ? "Automação ativa" : "Sem automação ativa" },
    ],
    [hasAutomation, hasFollowUp, priorityLeadName, totalLeads]
  );

  const completed = steps.filter((step) => step.done).length;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Onboarding de 5 minutos</p>
          <h3 className="text-xl font-semibold text-white">Configuração guiada para começar a vender</h3>
          <p className="text-sm text-slate-200">{completed}/4 passos concluídos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={onSyncApi}>Sincronizar API</ActionButton>
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:border-cyan-400/70 hover:bg-slate-800">
            Importar CSV
            <input
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file && onImportCsv) {
                  void onImportCsv(file);
                }
                event.currentTarget.value = "";
              }}
              type="file"
            />
          </label>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {steps.map((step) => (
          <article className="rounded-2xl border border-slate-700 bg-slate-950 p-4" key={step.label}>
            <p className="text-sm font-semibold text-white">{step.label}</p>
            <p className="mt-1 text-sm text-slate-200">{step.detail}</p>
            <p className={`mt-2 text-xs font-semibold ${step.done ? "text-emerald-300" : "text-amber-300"}`}>
              {step.done ? "Concluído" : "Pendente"}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton onClick={onOpenPipeline}>Ver pipeline</ActionButton>
        <ActionButton onClick={onScheduleFollowUp}>Agendar seguimento</ActionButton>
        <ActionButton onClick={onOpenAutomation}>Abrir automações</ActionButton>
      </div>
    </section>
  );
}

