import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { adminList } from "@/lib/leave";
import RequestList from "@/components/RequestList";

// Admin table (design §4, FR-08, LR-8): every record, newest first, with
// remarks and the HR officer — including rows rejected by supervisors
// that HR never saw (AC-24). Read-only: the table holds no buttons and
// allowedActions() returns nothing for ADMIN, so no action is offered
// even where a row would otherwise be actionable.
export default async function AdminHome() {
  await requireRole("ADMIN");
  const requests = await db.leaveRequest.findMany({
    ...adminList(),
    include: {
      employee: { select: { name: true } },
      supervisor: { select: { name: true } },
      hrOfficer: { select: { name: true } },
    },
  });

  return (
    <section>
      <h1 className="text-lg font-semibold text-gray-900">
        All leave requests
      </h1>
      <div className="mt-8">
        <RequestList
          requests={requests}
          showEmployee
          showRemarks
          showOfficer
          emptyText="No leave requests yet."
        />
      </div>
    </section>
  );
}
