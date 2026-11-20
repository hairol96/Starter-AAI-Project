import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { supervisorLists } from "@/lib/leave";
import RequestList from "@/components/RequestList";

// Supervisor home (design §4, LR-8/LR-9): rows naming the signed-in
// supervisor only; queue = PENDING_SUPERVISOR oldest first, History =
// the rest newest first. Lists hold no actions (AC-21).
export default async function SupervisorHome() {
  const user = await requireRole("SUPERVISOR");
  const { toActOn, history } = supervisorLists(user.id);
  const include = {
    employee: { select: { name: true } },
    supervisor: { select: { name: true } },
  } as const;
  const [queue, rest] = await Promise.all([
    db.leaveRequest.findMany({ ...toActOn, include }),
    db.leaveRequest.findMany({ ...history, include }),
  ]);

  return (
    <section>
      <h1 className="text-lg font-semibold text-gray-900">
        Requests to sign
      </h1>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
          To act on
        </h2>
        <div className="mt-3">
          <RequestList
            requests={queue}
            showEmployee
            emptyText="Nothing is waiting for your signature."
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
            showEmployee
            emptyText="No decisions yet."
          />
        </div>
      </div>
    </section>
  );
}
