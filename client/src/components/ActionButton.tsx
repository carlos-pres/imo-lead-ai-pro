import type { ButtonHTMLAttributes } from "react";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export function ActionButton({ loading = false, disabled, className, children, ...props }: ActionButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-cyan-400/70 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-300 ${className || ""}`}
      type={props.type || "button"}
    >
      {loading ? "A processar..." : children}
    </button>
  );
}

