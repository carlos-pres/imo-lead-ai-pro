type AutomationOverviewProps = {
  totals: Array<{ label: string; value: string; detail: string }>;
};

export function AutomationOverview({ totals }: AutomationOverviewProps) {
  return (
    <div className="command-surface-grid">
      {totals.map((item) => (
        <article className="command-surface-card" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <p>{item.detail}</p>
        </article>
      ))}
    </div>
  );
}

