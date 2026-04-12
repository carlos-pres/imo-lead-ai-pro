import { ActionButton } from "./ActionButton";
import { StatusBadge } from "./StatusBadge";

type AutomationCardProps = {
  name: string;
  objective: string;
  status: "ativa" | "pausada" | "rascunho";
  trigger: string;
  lastRun: string;
  nextStep: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  primaryLabel: string;
  secondaryLabel: string;
};

export function AutomationCard({
  name,
  objective,
  status,
  trigger,
  lastRun,
  nextStep,
  onPrimaryAction,
  onSecondaryAction,
  primaryLabel,
  secondaryLabel,
}: AutomationCardProps) {
  return (
    <article className="automation-card">
      <div className="automation-card-head">
        <div>
          <strong>{name}</strong>
          <p>{objective}</p>
        </div>
        <div className="automation-meta">
          <StatusBadge status={status} />
          <span>{trigger}</span>
        </div>
      </div>
      <div className="automation-pill-row">
        <span>Última execução {lastRun}</span>
        <span>Próximo passo {nextStep}</span>
      </div>
      <div className="automation-action-row">
        <ActionButton className="primary-button" onClick={onPrimaryAction}>
          {primaryLabel}
        </ActionButton>
        <ActionButton className="ghost-button" onClick={onSecondaryAction}>
          {secondaryLabel}
        </ActionButton>
      </div>
    </article>
  );
}

