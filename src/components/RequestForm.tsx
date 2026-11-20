"use client";

// The request form (design §4 /employee/new). Client-side only for
// hints: the live day count and showing the Other-description box.
// The server re-checks everything (LR-5/6) — on failure the typed
// values are kept and one plain message is shown.
import { useActionState, useMemo, useState } from "react";
import { submitRequest } from "@/app/leave/actions";

const LEAVE_TYPE_OPTIONS = [
  { value: "ANNUAL", label: "Annual leave" },
  { value: "MATERNITY", label: "Maternity leave" },
  { value: "UNPAID", label: "Unpaid leave" },
  { value: "COMPASSIONATE", label: "Compassionate leave" },
  { value: "OTHER", label: "Other" },
];

type Supervisor = { id: number; name: string; designation: string };

export default function RequestForm({ supervisors }: { supervisors: Supervisor[] }) {
  const [state, formAction, pending] = useActionState(submitRequest, null);
  // Every field is controlled from the returned values so a failed
  // submit keeps exactly what was typed (LR-5).
  const [leaveType, setLeaveType] = useState(state?.values?.leaveType ?? "ANNUAL");
  const [otherTypeText, setOtherTypeText] = useState(state?.values?.otherTypeText ?? "");
  const [startDate, setStartDate] = useState(state?.values?.startDate ?? "");
  const [endDate, setEndDate] = useState(state?.values?.endDate ?? "");
  const [supervisorId, setSupervisorId] = useState(state?.values?.supervisorId ?? "");

  // LR-6 on the client, as a hint only: inclusive calendar days.
  const dayCount = useMemo(() => {
    if (!startDate || !endDate) return null;
    const start = Date.parse(`${startDate}T00:00:00Z`);
    const end = Date.parse(`${endDate}T00:00:00Z`);
    if (Number.isNaN(start) || Number.isNaN(end)) return null;
    return Math.round((end - start) / 86_400_000) + 1;
  }, [startDate, endDate]);

  return (
    <section>
      <h1 className="text-lg font-semibold text-gray-900">New leave request</h1>
      <p className="mt-1 text-sm text-ink-500">
        Choose a supervisor from your own division. Days are counted
        inclusive of the start and end dates.
      </p>

      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm("Submit this leave request?")) {
            event.preventDefault(); // FR-07: confirm first; cancel = nothing happens.
          }
        }}
        className="mt-6 flex max-w-md flex-col gap-6"
      >
        {state?.error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {state.error}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="leaveType" className="text-sm font-medium text-gray-700">
            Leave type
          </label>
          <select
            id="leaveType"
            name="leaveType"
            value={leaveType}
            onChange={(event) => setLeaveType(event.target.value)}
            className="h-11 rounded-full border border-ink-200 bg-white px-4 text-sm text-navy-900 focus:border-navy-800 focus:outline-none"
          >
            {LEAVE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {leaveType === "OTHER" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="otherTypeText" className="text-sm font-medium text-gray-700">
              What is the leave for?
            </label>
            <input
              id="otherTypeText"
              name="otherTypeText"
              type="text"
              value={otherTypeText}
              onChange={(event) => setOtherTypeText(event.target.value)}
              placeholder="e.g. Moving house"
              className="h-11 rounded-full border border-ink-200 px-4 text-sm text-navy-900 placeholder:text-ink-400 focus:border-navy-800 focus:outline-none"
            />
            <p className="text-xs text-ink-500">3–100 characters.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="startDate" className="text-sm font-medium text-gray-700">
              Start date
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-11 rounded-full border border-ink-200 bg-white px-4 text-sm text-navy-900 focus:border-navy-800 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="endDate" className="text-sm font-medium text-gray-700">
              End date
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-11 rounded-full border border-ink-200 bg-white px-4 text-sm text-navy-900 focus:border-navy-800 focus:outline-none"
            />
          </div>
        </div>

        <p className="text-sm text-ink-500" aria-live="polite">
          {dayCount !== null && dayCount >= 1
            ? `${dayCount} day${dayCount === 1 ? "" : "s"}`
            : "Pick both dates to see the number of days."}
        </p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="supervisorId" className="text-sm font-medium text-gray-700">
            Supervisor
          </label>
          <select
            id="supervisorId"
            name="supervisorId"
            value={supervisorId}
            onChange={(event) => setSupervisorId(event.target.value)}
            className="h-11 rounded-full border border-ink-200 bg-white px-4 text-sm text-navy-900 focus:border-navy-800 focus:outline-none"
          >
            <option value="">Choose a supervisor…</option>
            {supervisors.map((supervisor) => (
              <option key={supervisor.id} value={supervisor.id}>
                {supervisor.name} — {supervisor.designation}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-full bg-navy-900 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
        >
          Submit request
        </button>
      </form>
    </section>
  );
}
