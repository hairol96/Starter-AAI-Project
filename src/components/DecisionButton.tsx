"use client";

// LR-10 / FR-07: the decision buttons for the detail page. The confirm
// dialog is politeness only — cancelling just stops the form from
// submitting; the action itself re-checks everything server-side.
import { useActionState } from "react";

type DecisionButtonProps = {
  action: (formData: FormData) => Promise<void>;
  requestId: number;
  confirmText: string;
  label: string;
  variant?: "primary" | "danger";
};

const VARIANTS = {
  primary: "bg-navy-900 hover:bg-navy-800",
  danger: "bg-red-600 hover:bg-red-700",
} as const;

export default function DecisionButton({
  action,
  requestId,
  confirmText,
  label,
  variant = "primary",
}: DecisionButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmText)) {
          event.preventDefault(); // cancel = nothing happens (FR-07)
        }
      }}
      className="inline-block"
    >
      <input type="hidden" name="requestId" value={String(requestId)} />
      <button
        type="submit"
        className={`h-11 rounded-full px-6 text-sm font-semibold uppercase tracking-widest text-white transition-colors ${VARIANTS[variant]}`}
      >
        {label}
      </button>
    </form>
  );
}

// The reject button carries the mandatory remark (LR-5): a blank one is
// refused by the action and the typed text comes back kept (LR-5, U14).
export type RemarkState = {
  error?: string;
  values?: { remark: string };
};

export function RemarkDecisionButton({
  action,
  requestId,
  confirmText,
  label,
}: {
  action: (prev: RemarkState | null, formData: FormData) => Promise<RemarkState>;
  requestId: number;
  confirmText: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState<RemarkState | null, FormData>(
    action,
    null,
  );
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(confirmText)) {
          event.preventDefault();
        }
      }}
      className="flex flex-col items-end gap-2"
    >
      <input type="hidden" name="requestId" value={String(requestId)} />
      <label htmlFor="remark" className="text-xs font-medium uppercase tracking-wide text-ink-500">
        Reason (required)
      </label>
      {state?.error && (
        <p role="alert" className="w-full max-w-sm rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <textarea
        id="remark"
        name="remark"
        rows={3}
        defaultValue={state?.values?.remark ?? ""}
        placeholder="Why is this rejected? 3–500 characters."
        className="w-full max-w-sm rounded-2xl border border-ink-200 px-4 py-2 text-sm text-navy-900 placeholder:text-ink-400 focus:border-navy-800 focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className={`h-11 rounded-full px-6 text-sm font-semibold uppercase tracking-widest text-white transition-colors ${VARIANTS.danger} disabled:opacity-60`}
      >
        {label}
      </button>
    </form>
  );
}
