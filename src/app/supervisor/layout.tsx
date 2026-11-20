import { requireRole } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("SUPERVISOR");
  return <AppShell user={user}>{children}</AppShell>;
}
