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
      { label: "Importar leads", done: totalLeads > 0, detail: `${totalLeads} leads disponÃ­veis` },
      { label: "Definir lead prioritÃ¡rio", done: Boolean(priorityLeadName), detail: priorityLeadName || "Sem lead prioritÃ¡rio" },
      { label: "Agendar primeiro seguimento", done: hasFollowUp, detail: hasFollowUp ? "Seguimento ativo" : "Sem seguimento" },
      { label: "Ativar primeira automaÃ§Ã£o", done: hasAutomation, detail: hasAutomation ? "AutomaÃ§Ã£o ativa" : "Sem automaÃ§Ã£o ativa" },
    ],
    [hasAutomation, hasFollowUp, priorityLeadName, totalLeads]
  );

  const completed = steps.filter((step) => step.done).length;

  return (
    <section className="rounded-3xl border border-[#1322371a] bg-white/90 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#174dbb]">Onboarding de 5 minutos</p>
          <h3 className="text-xl font-semibold text-[#132237]">ConfiguraÃ§Ã£o guiada para comeÃ§ar a vender</h3>
          <p className="text-sm text-[#415066]">{completed}/4 passos concluÃ­dos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={onSyncApi}>Sincronizar API</ActionButton>
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-[#13223734] bg-white/90 px-4 py-2.5 text-sm font-semibold text-[#132237] hover:border-[#174dbb75] hover:bg-[#f7faff]">
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
          <article className="rounded-2xl border border-[#13223724] bg-[#fffaf4] p-4" key={step.label}>
            <p className="text-sm font-semibold text-[#132237]">{step.label}</p>
            <p className="mt-1 text-sm text-[#415066]">{step.detail}</p>
            <p className={`mt-2 text-xs font-semibold ${step.done ? "text-emerald-700" : "text-amber-700"}`}>
              {step.done ? "ConcluÃ­do" : "Pendente"}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton onClick={onOpenPipeline}>Ver pipeline</ActionButton>
        <ActionButton onClick={onScheduleFollowUp}>Agendar seguimento</ActionButton>
        <ActionButton onClick={onOpenAutomation}>Abrir automaÃ§Ãµes</ActionButton>
      </div>
    </section>
  );
}
