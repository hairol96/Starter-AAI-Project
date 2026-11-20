// The leave rules in one auditable place (design §5, LR-3/5/6/8/9).
// Pure functions only — no database, no React — so every screen and
// every action asks the same question and gets the same answer.
import type { LeaveRequestStatus, Prisma, Role } from "@prisma/client";

// Text limits (LR-5, interview L8): remarks 3–500, Other description 3–100.
export const REMARK_MIN = 3;
export const REMARK_MAX = 500;
export const OTHER_TYPE_MIN = 3;
export const OTHER_TYPE_MAX = 100;

export type LeaveAction =
  | "SIGN"
  | "REJECT_SUPERVISOR"
  | "SEND_TO_HR"
  | "APPROVE"
  | "REJECT_HR";

// LR-3 — the only legal moves; everything else is refused.
const TRANSITIONS: Record<LeaveRequestStatus, LeaveRequestStatus[]> = {
  PENDING_SUPERVISOR: ["SIGNED", "REJECTED_BY_SUPERVISOR"],
  SIGNED: ["PENDING_HR"],
  PENDING_HR: ["APPROVED", "REJECTED_BY_HR"],
  APPROVED: [],
  REJECTED_BY_SUPERVISOR: [],
  REJECTED_BY_HR: [],
};

export function canTransition(
  from: LeaveRequestStatus,
  to: LeaveRequestStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** LR-3: final statuses have no outgoing move at all. */
export function isTerminal(status: LeaveRequestStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

/** Parse a yyyy-mm-dd form value into a UTC-midnight Date; null if invalid. */
export function parseDateInput(value: FormDataEntryValue | null): Date | null {
  if (typeof value !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  // Reject calendar-impossible dates like 2026-13-40.
  if (!date.toISOString().startsWith(value)) return null;
  return date;
}

/** LR-6: end is never before start; same day allowed. null means valid. */
export function dateRangeError(start: Date, end: Date): string | null {
  if (end.getTime() < start.getTime()) {
    return "The end date cannot be before the start date.";
  }
  return null;
}

/** LR-6: inclusive calendar days (interview L2). 1–5 Dec = 5 days. */
export function daysInclusive(start: Date, end: Date): number {
  const days = Math.round(
    (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
  );
  return days + 1;
}

/** Trim a form value safely; anything non-text becomes "". */
export function cleanText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/** LR-5: a required remark. Returns the trimmed text, or null when invalid. */
export function validRemark(value: FormDataEntryValue | null): string | null {
  const text = cleanText(value);
  return text.length >= REMARK_MIN && text.length <= REMARK_MAX ? text : null;
}

/** LR-5: the "Other leave type" description. null when invalid. */
export function validOtherTypeText(
  value: FormDataEntryValue | null,
): string | null {
  const text = cleanText(value);
  return text.length >= OTHER_TYPE_MIN && text.length <= OTHER_TYPE_MAX
    ? text
    : null;
}

/** The row facts permission depends on (LR-4 — read from the row, never the form). */
export type LeaveRow = {
  employeeId: number;
  supervisorId: number;
  status: LeaveRequestStatus;
};

/** LR-3 + LR-4: what this user may do to this row, as action names. */
export function allowedActions(
  user: { id: number; role: Role },
  row: LeaveRow,
): LeaveAction[] {
  switch (user.role) {
    case "SUPERVISOR":
      if (row.supervisorId === user.id && row.status === "PENDING_SUPERVISOR") {
        return ["SIGN", "REJECT_SUPERVISOR"];
      }
      return [];
    case "EMPLOYEE":
      if (row.employeeId === user.id && row.status === "SIGNED") {
        return ["SEND_TO_HR"];
      }
      return [];
    case "HR":
      if (row.status === "PENDING_HR") {
        return ["APPROVE", "REJECT_HR"];
      }
      return [];
    case "ADMIN":
      return []; // FR-08: sees everything, changes nothing.
  }
}

/** LR-8: who may see the row at all (enforced in queries and on the detail page). */
export function canView(user: { id: number; role: Role }, row: LeaveRow): boolean {
  switch (user.role) {
    case "EMPLOYEE":
      return row.employeeId === user.id;
    case "SUPERVISOR":
      return row.supervisorId === user.id;
    case "HR":
      // The queue plus what passed through HR; supervisor rejections
      // never reached HR and stay invisible to it (interview L7).
      return ["PENDING_HR", "APPROVED", "REJECTED_BY_HR"].includes(row.status);
    case "ADMIN":
      return true;
  }
}

type ListSpec = { where: Prisma.LeaveRequestWhereInput; orderBy: Prisma.LeaveRequestOrderByWithRelationInput };

/** LR-8 + LR-9: the employee home's two lists. */
export function employeeLists(employeeId: number): { toActOn: ListSpec; history: ListSpec } {
  return {
    toActOn: { where: { employeeId, status: "SIGNED" }, orderBy: { submittedAt: "asc" } },
    history: {
      where: { employeeId, status: { not: "SIGNED" } },
      orderBy: { submittedAt: "desc" },
    },
  };
}

/** LR-8 + LR-9: the supervisor home's two lists — only rows naming them. */
export function supervisorLists(supervisorId: number): { toActOn: ListSpec; history: ListSpec } {
  return {
    toActOn: {
      where: { supervisorId, status: "PENDING_SUPERVISOR" },
      orderBy: { submittedAt: "asc" },
    },
    history: {
      where: { supervisorId, status: { not: "PENDING_SUPERVISOR" } },
      orderBy: { submittedAt: "desc" },
    },
  };
}

/** LR-8 + LR-9: the shared HR queue and HR history. */
export function hrLists(): { toActOn: ListSpec; history: ListSpec } {
  return {
    toActOn: { where: { status: "PENDING_HR" }, orderBy: { submittedAt: "asc" } },
    history: {
      where: { status: { in: ["APPROVED", "REJECTED_BY_HR"] } },
      orderBy: { submittedAt: "desc" },
    },
  };
}

/** LR-8 + LR-9: the admin's every-record list. */
export function adminList(): ListSpec {
  return { where: {}, orderBy: { submittedAt: "desc" } };
}
