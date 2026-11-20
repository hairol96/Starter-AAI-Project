import { redirect } from "next/navigation";
import type { LeaveType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { allowedActions, canView, daysInclusive } from "@/lib/leave";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import DecisionButton, {
  RemarkDecisionButton,
} from "@/components/DecisionButton";
import {
  sendToHr,
  supervisorSign,
  supervisorReject,
  hrApprove,
  hrReject,
} from "@/app/leave/actions";

// Shared detail page (design §4, LR-8): one request read-only for exactly
// the viewers LR-8 allows. The ONLY screen that will ever hold action
// buttons (Tasks 13–15 add them); the list pages never will.
const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: "Annual leave",
  MATERNITY: "Maternity leave",
  UNPAID: "Unpaid leave",
  COMPASSIONATE: "Compassionate leave",
  OTHER: "Other",
};

function formatDate(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : "—";
}

function formatDateTime(value: Date | null): string {
  return value ? `${value.toISOString().slice(0, 16).replace("T", " ")} UTC` : "—";
}

function NotFound() {
  return (
    <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
      Request not found.
    </p>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(); // any signed-in role; LR-8 gates per row
  const { id } = await params;
  const requestId = Number(id);

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return (
      <AppShell user={user}>
        <NotFound />
      </AppShell>
    );
  }

  const request = await db.leaveRequest.findUnique({
    where: { id: requestId },
    include: {
      employee: { select: { name: true } },
      supervisor: { select: { name: true } },
      hrOfficer: { select: { name: true } },
    },
  });

  if (!request) {
    return (
      <AppShell user={user}>
        <NotFound />
      </AppShell>
    );
  }

  // LR-8 outside the lane → bounce home with the same banner as AC-05.
  if (!canView(user, request)) {
    redirect(`/${user.role.toLowerCase()}?notice=not-authorized`);
  }

  return (
    <AppShell user={user}>
      <div className="flex items-start justify-between">
        <h1 className="text-lg font-semibold text-gray-900">
          Leave request #{request.id}
        </h1>
        <StatusBadge status={request.status} />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
        <Field label="Employee" value={request.employee.name} />
        <Field label="Supervisor" value={request.supervisor.name} />
        <Field
          label="Leave type"
          value={
            request.leaveType === "OTHER"
              ? `Other — ${request.otherTypeText ?? "—"}`
              : LEAVE_TYPE_LABELS[request.leaveType]
          }
        />
        <Field label="Start date" value={formatDate(request.startDate)} />
        <Field label="End date" value={formatDate(request.endDate)} />
        <Field
          label="Days"
          value={String(daysInclusive(request.startDate, request.endDate))}
        />
        <Field label="Submitted" value={formatDateTime(request.submittedAt)} />
        <Field label="Signed" value={formatDateTime(request.signedAt)} />
        <Field label="Decided" value={formatDateTime(request.decidedAt)} />
        <Field
          label="HR officer"
          value={request.hrOfficer?.name ?? "—"}
        />
      </dl>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-wide text-ink-500">
            Supervisor remark
          </h2>
          <p className="mt-1 whitespace-pre-wrap rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900">
            {request.supervisorRemark ?? "—"}
          </p>
        </div>
        <div>
          <h2 className="text-xs font-medium uppercase tracking-wide text-ink-500">
            HR remark
          </h2>
          <p className="mt-1 whitespace-pre-wrap rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900">
            {request.hrRemark ?? "—"}
          </p>
        </div>
      </div>

      {/* Action area — renders only what LR-3 + LR-4 allow this viewer. */}
      {(() => {
        const actions = allowedActions(user, request);
        if (actions.length === 0) return null;
        return (
          <div className="mt-8 flex flex-wrap items-end justify-end gap-4 border-t border-ink-200 pt-6">
            {actions.includes("SEND_TO_HR") && (
              <DecisionButton
                action={sendToHr}
                requestId={request.id}
                confirmText="Send this request to HR?"
                label="Send to HR"
              />
            )}
            {actions.includes("SIGN") && (
              <DecisionButton
                action={supervisorSign}
                requestId={request.id}
                confirmText="Sign this request?"
                label="Sign"
              />
            )}
            {actions.includes("REJECT_SUPERVISOR") && (
              <RemarkDecisionButton
                action={supervisorReject}
                requestId={request.id}
                confirmText="Reject this request?"
                label="Reject"
              />
            )}
            {actions.includes("APPROVE") && (
              <DecisionButton
                action={hrApprove}
                requestId={request.id}
                confirmText="Approve this request?"
                label="Approve"
              />
            )}
            {actions.includes("REJECT_HR") && (
              <RemarkDecisionButton
                action={hrReject}
                requestId={request.id}
                confirmText="Reject this request?"
                label="Reject"
              />
            )}
          </div>
        );
      })()}
    </AppShell>
  );
}
