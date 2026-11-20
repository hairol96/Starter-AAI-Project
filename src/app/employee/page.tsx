import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { employeeLists } from "@/lib/leave";
import RequestList from "@/components/RequestList";

// Employee home (design §4, LR-8/LR-9): own rows only; To act on = own
// SIGNED oldest first, History = the rest newest first. The list rows
// link to the detail page and hold no actions (AC-21).
export default async function EmployeeHome() {
  const user = await requireRole("EMPLOYEE"); // layout gates too; LR-13
  const { toActOn, history } = employeeLists(user.id);
  const include = { supervisor: { select: { name: true } } } as const;
  const [signed, rest] = await Promise.all([
    db.leaveRequest.findMany({ ...toActOn, include }),
    // History carries the remarks so the employee sees why (AC-14).
    db.leaveRequest.findMany({
      ...history,
      select: {
        id: true,
        leaveType: true,
        otherTypeText: true,
        startDate: true,
        endDate: true,
        status: true,
        supervisorRemark: true,
        hrRemark: true,
        supervisor: { select: { name: true } },
      },
    }),
  ]);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">My leave requests</h1>
        <Link
          href="/employee/new"
          className="inline-flex h-11 items-center rounded-full bg-navy-900 px-6 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-navy-800"
        >
          New request
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
          To act on
        </h2>
        <div className="mt-3">
          <RequestList
            requests={signed}
            emptyText="Nothing is waiting on you."
          />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
          History
        </h2>
        <div className="mt-3">
          <RequestList
            requests={rest}
            showRemarks
            emptyText="No requests yet."
          />
        </div>
      </div>
    </section>
  );
}
