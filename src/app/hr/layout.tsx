import { requireRole } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export default async function HrLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("HR");
  return <AppShell user={user}>{children}</AppShell>;
}
