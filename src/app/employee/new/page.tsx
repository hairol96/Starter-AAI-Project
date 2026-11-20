import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import RequestForm from "@/components/RequestForm";

// /employee/new (design §4): only employees reach it — the employee
// layout gates with requireRole, and the submit action checks again.
// LR-2: the supervisor dropdown is built server-side from the
// employee's own division.
export default async function NewRequestPage() {
  const user = await requireRole("EMPLOYEE");
  const supervisors = await db.user.findMany({
    where: { role: "SUPERVISOR", division: user.division },
    orderBy: { name: "asc" },
    select: { id: true, name: true, designation: true },
  });

  return <RequestForm supervisors={supervisors} />;
}
