import type { ButtonHTMLAttributes } from "react";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export function ActionButton({ loading = false, disabled, className, children, ...props }: ActionButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-[#174dbb52] bg-gradient-to-r from-[#174dbb] to-[#2e7df6] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#174dbb20] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174dbb] disabled:cursor-not-allowed disabled:border-[#13223724] disabled:text-[#f5f8ff] ${className || ""}`}
      type={props.type || "button"}
    >
      {loading ? "A processar..." : children}
    </button>
  );
}
