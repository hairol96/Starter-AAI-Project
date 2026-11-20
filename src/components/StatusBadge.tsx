import type { LeaveRequestStatus } from "@prisma/client";

// Status pill (design §4 "Visual style"): pending = yellow, SIGNED =
// blue, APPROVED = green, rejections = red. Also the one source of the
// human status labels, shared with the detail page.
export const STATUS_LABELS: Record<LeaveRequestStatus, string> = {
  PENDING_SUPERVISOR: "Pending supervisor",
  SIGNED: "Signed",
  PENDING_HR: "Pending HR",
  APPROVED: "Approved",
  REJECTED_BY_SUPERVISOR: "Rejected by supervisor",
  REJECTED_BY_HR: "Rejected by HR",
};

const PILL_CLASSES: Record<LeaveRequestStatus, string> = {
  PENDING_SUPERVISOR: "bg-yellow-100 text-yellow-800",
  SIGNED: "bg-blue-100 text-blue-800",
  PENDING_HR: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED_BY_SUPERVISOR: "bg-red-100 text-red-800",
  REJECTED_BY_HR: "bg-red-100 text-red-800",
};

export default function StatusBadge({ status }: { status: LeaveRequestStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${PILL_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
