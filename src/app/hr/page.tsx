import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { hrLists } from "@/lib/leave";
import RequestList from "@/components/RequestList";

// HR home (design §4, LR-8/LR-9): the shared queue — every PENDING_HR
// row, oldest first, visible to every officer — plus HR's own history
// (Approved / Rejected by HR, newest first). Supervisor rejections never
// reached HR and are absent by construction of the query (AC-18).
export default async function HrHome() {
  await requireRole("HR");
  const { toActOn, history } = hrLists();
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
      <h1 className="text-lg font-semibold text-gray-900">HR leave queue</h1>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
          To act on
        </h2>
        <div className="mt-3">
          <RequestList
            requests={queue}
            showEmployee
            emptyText="The queue is empty."
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
            showRemarks
            emptyText="No HR decisions yet."
          />
        </div>
      </div>
    </section>
  );
}
