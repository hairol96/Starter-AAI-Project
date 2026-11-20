import Link from "next/link";
import type { LeaveRequestStatus, LeaveType } from "@prisma/client";
import { daysInclusive } from "@/lib/leave";
import StatusBadge from "./StatusBadge";

// Shared list of request rows (design §4): every row links to
// /requests/[id] — the detail page is the only place an action appears,
// so these lists hold no buttons and no forms (AC-21).
export type ListRow = {
  id: number;
  leaveType: LeaveType;
  otherTypeText: string | null;
  startDate: Date;
  endDate: Date;
  status: LeaveRequestStatus;
  supervisor: { name: string };
  employee?: { name: string };
  hrOfficer?: { name: string } | null;
  supervisorRemark?: string | null;
  hrRemark?: string | null;
};

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: "Annual leave",
  MATERNITY: "Maternity leave",
  UNPAID: "Unpaid leave",
  COMPASSIONATE: "Compassionate leave",
  OTHER: "Other",
};

function typeText(row: ListRow): string {
  return row.leaveType === "OTHER"
    ? `Other — ${row.otherTypeText ?? ""}`
    : LEAVE_TYPE_LABELS[row.leaveType];
}

function dateText(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function remarkText(row: ListRow): string {
  const text = row.supervisorRemark ?? row.hrRemark ?? "";
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

export default function RequestList({
  requests,
  emptyText,
  showEmployee = false,
  showRemarks = false,
  showOfficer = false,
}: {
  requests: ListRow[];
  emptyText: string;
  showEmployee?: boolean;
  showRemarks?: boolean;
  showOfficer?: boolean;
}) {
  if (requests.length === 0) {
    return <p className="text-sm text-ink-500">{emptyText}</p>;
  }
  const link = "block text-sm text-navy-900 hover:underline";
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-ink-200 text-xs font-medium uppercase tracking-wide text-ink-500">
          {showEmployee && <th className="py-2 pr-4">Employee</th>}
          <th className="py-2 pr-4">Supervisor</th>
          <th className="py-2 pr-4">Leave type</th>
          <th className="py-2 pr-4">Dates</th>
          <th className="py-2 pr-4">Days</th>
          {showRemarks && <th className="py-2 pr-4">Remark</th>}
          {showOfficer && <th className="py-2 pr-4">HR officer</th>}
          <th className="py-2">Status</th>
        </tr>
      </thead>
      <tbody>
        {requests.map((row) => (
          <tr key={row.id} className="border-b border-ink-200 last:border-0">
            {showEmployee && (
              <td className="py-3 pr-4">
                <Link href={`/requests/${row.id}`} className={link}>
                  {row.employee?.name ?? "—"}
                </Link>
              </td>
            )}
            <td className="py-3 pr-4">
              <Link href={`/requests/${row.id}`} className={link}>
                {row.supervisor.name}
              </Link>
            </td>
            <td className="py-3 pr-4">
              <Link href={`/requests/${row.id}`} className={link}>
                {typeText(row)}
              </Link>
            </td>
            <td className="py-3 pr-4">
              <Link href={`/requests/${row.id}`} className={link}>
                {dateText(row.startDate)} – {dateText(row.endDate)}
              </Link>
            </td>
            <td className="py-3 pr-4">
              <Link href={`/requests/${row.id}`} className={link}>
                {daysInclusive(row.startDate, row.endDate)}
              </Link>
            </td>
            {showRemarks && (
              <td className="py-3 pr-4">
                <Link href={`/requests/${row.id}`} className={link}>
                  {remarkText(row) || "—"}
                </Link>
              </td>
            )}
            {showOfficer && (
              <td className="py-3 pr-4">
                <Link href={`/requests/${row.id}`} className={link}>
                  {row.hrOfficer?.name ?? "—"}
                </Link>
              </td>
            )}
            <td className="py-3">
              <Link href={`/requests/${row.id}`} className="inline-block">
                <StatusBadge status={row.status} />
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
