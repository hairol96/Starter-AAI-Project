"use server";

// The leave server actions (design §4, all following LR-10):
// requireRole → re-read the row → check the transition → validate →
// write → redirect with a ?notice= success key. Confirmations are
// client-side politeness; the server never relies on them.
import { redirect } from "next/navigation";
import type { LeaveType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import {
  allowedActions,
  cleanText,
  dateRangeError,
  parseDateInput,
  validOtherTypeText,
  validRemark,
} from "@/lib/leave";
import type { RemarkState } from "@/components/DecisionButton";

const LEAVE_TYPES = ["ANNUAL", "MATERNITY", "UNPAID", "COMPASSIONATE", "OTHER"] as const;

export type LeaveFormState = {
  error?: string;
  values?: {
    leaveType: string;
    otherTypeText: string;
    startDate: string;
    endDate: string;
    supervisorId: string;
  };
};

// LR-1 + LR-2 + LR-5 + LR-6: every rule re-checked server-side, never
// trusted from the form (A05). On failure the form re-renders with the
// typed values kept and one plain message.
export async function submitRequest(
  prevState: LeaveFormState | null,
  formData: FormData,
): Promise<LeaveFormState> {
  const user = await requireRole("EMPLOYEE");

  const leaveType = cleanText(formData.get("leaveType"));
  const otherTypeTextRaw = cleanText(formData.get("otherTypeText"));
  const startDateRaw = formData.get("startDate");
  const endDateRaw = formData.get("endDate");
  const supervisorRaw = cleanText(formData.get("supervisorId"));

  const values = {
    leaveType,
    otherTypeText: otherTypeTextRaw,
    startDate: typeof startDateRaw === "string" ? startDateRaw : "",
    endDate: typeof endDateRaw === "string" ? endDateRaw : "",
    supervisorId: supervisorRaw,
  };
  const fail = (error: string): LeaveFormState => ({ error, values });

  if (!(LEAVE_TYPES as readonly string[]).includes(leaveType)) {
    return fail("Please choose a leave type.");
  }

  const startDate = parseDateInput(startDateRaw);
  const endDate = parseDateInput(endDateRaw);
  if (!startDate || !endDate) {
    return fail("Please choose a valid start and end date (yyyy-mm-dd).");
  }
  const rangeError = dateRangeError(startDate, endDate);
  if (rangeError) return fail(rangeError);

  const supervisorId = Number(supervisorRaw);
  if (!Number.isInteger(supervisorId) || supervisorId <= 0) {
    return fail("Please choose a supervisor.");
  }
  // LR-2: the picked supervisor is re-checked against the database,
  // never trusted from the form.
  const supervisor = await db.user.findUnique({ where: { id: supervisorId } });
  if (
    !supervisor ||
    supervisor.role !== "SUPERVISOR" ||
    supervisor.division !== user.division
  ) {
    return fail("The supervisor must be from your own division.");
  }

  let otherTypeText: string | null = null;
  if (leaveType === "OTHER") {
    otherTypeText = validOtherTypeText(formData.get("otherTypeText"));
    if (!otherTypeText) {
      return fail("Please describe what the leave is for (3–100 characters).");
    }
  }

  await db.leaveRequest.create({
    data: {
      employeeId: user.id,
      supervisorId,
      leaveType: leaveType as LeaveType,
      otherTypeText,
      startDate,
      endDate,
    },
  });

  redirect("/employee?notice=request-submitted");
}

/** Read the hidden requestId; a bogus value reads as "no such row". */
function parseRowId(formData: FormData): number | null {
  const requestId = Number(formData.get("requestId"));
  return Number.isInteger(requestId) && requestId > 0 ? requestId : null;
}

// LR-10 pattern: requireRole → re-read row → LR-4/LR-3 via allowedActions
// → write → redirect with the success key. Forged or out-of-turn calls are
// refused server-side; the client confirm dialog is never load-bearing.
export async function sendToHr(formData: FormData): Promise<void> {
  const user = await requireRole("EMPLOYEE");
  const requestId = parseRowId(formData);

  const row = requestId
    ? await db.leaveRequest.findUnique({ where: { id: requestId } })
    : null;
  if (!requestId || !row || !allowedActions(user, row).includes("SEND_TO_HR")) {
    redirect("/employee?notice=not-authorized");
  }

  await db.leaveRequest.update({
    where: { id: requestId },
    data: { status: "PENDING_HR" },
  });

  redirect("/employee?notice=request-sent");
}

export async function supervisorSign(formData: FormData): Promise<void> {
  const user = await requireRole("SUPERVISOR");
  const requestId = parseRowId(formData);

  const row = requestId
    ? await db.leaveRequest.findUnique({ where: { id: requestId } })
    : null;
  // LR-4 (row must name me) + LR-3 (only from PENDING_SUPERVISOR),
  // both answered by allowedActions.
  if (!requestId || !row || !allowedActions(user, row).includes("SIGN")) {
    redirect("/supervisor?notice=not-authorized");
  }

  await db.leaveRequest.update({
    where: { id: requestId },
    data: { status: "SIGNED", signedAt: new Date() },
  });

  redirect("/supervisor?notice=request-signed");
}

export async function supervisorReject(
  prevState: RemarkState | null,
  formData: FormData,
): Promise<RemarkState> {
  const user = await requireRole("SUPERVISOR");
  const requestId = parseRowId(formData);

  const row = requestId
    ? await db.leaveRequest.findUnique({ where: { id: requestId } })
    : null;
  if (
    !requestId ||
    !row ||
    !allowedActions(user, row).includes("REJECT_SUPERVISOR")
  ) {
    redirect("/supervisor?notice=not-authorized");
  }

  // LR-5: rejection needs a reason; blank keeps what was typed (U14).
  const remark = validRemark(formData.get("remark"));
  if (!remark) {
    return {
      error: "Please give a reason for the rejection (3–500 characters).",
      values: { remark: cleanText(formData.get("remark")) },
    };
  }

  await db.leaveRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED_BY_SUPERVISOR",
      supervisorRemark: remark,
      decidedAt: new Date(),
    },
  });

  redirect("/supervisor?notice=request-rejected");
}

export async function hrApprove(formData: FormData): Promise<void> {
  const user = await requireRole("HR");
  const requestId = parseRowId(formData);

  const row = requestId
    ? await db.leaveRequest.findUnique({ where: { id: requestId } })
    : null;
  if (!requestId || !row || !allowedActions(user, row).includes("APPROVE")) {
    redirect("/hr?notice=not-authorized");
  }

  // AC-16: the deciding officer and time are stamped server-side,
  // never taken from the form.
  await db.leaveRequest.update({
    where: { id: requestId },
    data: {
      status: "APPROVED",
      hrOfficerId: user.id,
      decidedAt: new Date(),
    },
  });

  redirect("/hr?notice=request-approved");
}

export async function hrReject(
  prevState: RemarkState | null,
  formData: FormData,
): Promise<RemarkState> {
  const user = await requireRole("HR");
  const requestId = parseRowId(formData);

  const row = requestId
    ? await db.leaveRequest.findUnique({ where: { id: requestId } })
    : null;
  if (!requestId || !row || !allowedActions(user, row).includes("REJECT_HR")) {
    redirect("/hr?notice=not-authorized");
  }

  const remark = validRemark(formData.get("remark"));
  if (!remark) {
    return {
      error: "Please give a reason for the rejection (3–500 characters).",
      values: { remark: cleanText(formData.get("remark")) },
    };
  }

  await db.leaveRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED_BY_HR",
      hrOfficerId: user.id,
      hrRemark: remark,
      decidedAt: new Date(),
    },
  });

  redirect("/hr?notice=request-rejected");
}
