"use client";

// Shared frame for the four role homes (design §4 + "Visual style" item
// 5): white card on the navy page, navy header strip with a translucent
// name·role chip and Sign-out pill. The not-authorized banner is read
// client-side because Next 16 gives layouts no searchParams.
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { logout } from "@/app/login/actions";

type User = {
  name: string;
  role: string;
};

// Design §4 (leave): the success-notice map. ?notice=... carries one
// key per action; unknown keys show nothing.
const NOTICES: Record<string, { text: string; className: string }> = {
  "not-authorized": {
    text: "You are not authorized to open that page.",
    className: "bg-yellow-50 text-yellow-800",
  },
  "request-submitted": {
    text: "Leave request submitted.",
    className: "bg-green-50 text-green-800",
  },
  "request-signed": {
    text: "Leave request signed.",
    className: "bg-green-50 text-green-800",
  },
  "request-rejected": {
    text: "Leave request rejected.",
    className: "bg-green-50 text-green-800",
  },
  "request-sent": {
    text: "Leave request sent to HR.",
    className: "bg-green-50 text-green-800",
  },
  "request-approved": {
    text: "Leave request approved.",
    className: "bg-green-50 text-green-800",
  },
};

function Notice() {
  const searchParams = useSearchParams();
  const notice = NOTICES[searchParams.get("notice") ?? ""];
  if (!notice) return null;
  return (
    <p
      role="status"
      className={`mb-6 rounded-xl px-4 py-3 text-sm ${notice.className}`}
    >
      {notice.text}
    </p>
  );
}

export default function AppShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen justify-center bg-navy-950 px-4 py-10">
      <div className="h-fit w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex h-14 items-center justify-between bg-navy-900 px-8">
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/15">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
                <path d="M5 4h6v6H5zM13 4h6v3h-6zM13 9h6v3h-6zM5 12h6v8H5zM13 14h6v6h-6z" />
              </svg>
            </span>
            Budiman HRMS
          </span>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90">
              {user.name} · {user.role}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full border border-white/40 px-4 py-1.5 text-sm text-white transition-colors hover:bg-navy-800"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>
        <main className="px-8 py-8">
          <Suspense fallback={null}>
            <Notice />
          </Suspense>
          {children}
        </main>
      </div>
    </div>
  );
}
