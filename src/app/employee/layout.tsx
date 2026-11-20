import { requireRole } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("EMPLOYEE");
  return <AppShell user={user}>{children}</AppShell>;
}
