import { redirect } from "next/navigation";
import { getSignedInUser } from "@/lib/auth";

// The root redirect (design §4): your home when signed in, /login when not.
export default async function RootPage() {
  const user = await getSignedInUser();
  redirect(user ? `/${user.role.toLowerCase()}` : "/login");
}
