import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { login } from "@/app/login/actions";

// The login screen (design §4 + "Visual style"): split card on a navy
// page — white form panel left, CSS wave gradient right. Behaviour is the
// original spec: one form, two fields, generic error, no other controls.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Design §4: if already signed in, go straight to your own home page.
  const session = await getSession();
  if (session) redirect(`/${session.role.toLowerCase()}`);

  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-950 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-[42%_58%]">
        {/* Left: the white form panel */}
        <div className="flex flex-col px-10 py-8">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-900 text-white">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                <path d="M5 4h6v6H5zM13 4h6v3h-6zM13 9h6v3h-6zM5 12h6v8H5zM13 14h6v6h-6z" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-navy-900">
              Budiman HRMS
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-900 text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-8 w-8"
                aria-hidden
              >
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 19c1.2-3 3.7-4.5 7-4.5s5.8 1.5 7 4.5" />
              </svg>
            </span>

            {error === "invalid" && (
              <p
                role="alert"
                className="w-full max-w-[260px] rounded-full bg-red-50 px-4 py-2 text-center text-sm text-red-700"
              >
                Invalid email or password
              </p>
            )}

            <form action={login} className="flex w-[260px] max-w-full flex-col gap-5">
              <div className="relative">
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-900"
                  aria-hidden
                >
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 19c1.2-3 3.7-4.5 7-4.5s5.8 1.5 7 4.5" />
                </svg>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="USERNAME"
                  required
                  className="h-11 w-full rounded-full border border-ink-200 pl-11 pr-4 text-sm text-navy-900 placeholder:uppercase placeholder:tracking-wider placeholder:text-ink-400 focus:border-navy-800 focus:outline-none"
                />
              </div>

              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-900"
                  aria-hidden
                >
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="PASSWORD"
                  required
                  className="h-11 w-full rounded-full border border-ink-200 pl-11 pr-4 text-sm text-navy-900 placeholder:uppercase placeholder:tracking-wider placeholder:text-ink-400 focus:border-navy-800 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="h-11 w-full rounded-full bg-navy-900 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-navy-800"
              >
                Sign in
              </button>
            </form>
          </div>

          <div className="flex justify-center gap-2 pb-1" aria-hidden>
            <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />
          </div>
        </div>

        {/* Right: the wave gradient panel (CSS stand-in for the stock art) */}
        <div
          className="relative hidden min-h-[480px] md:block"
          style={{
            backgroundImage:
              "linear-gradient(120deg, #1E2A5E 0%, #2A3A78 30%, #6C88B8 58%, #F4D9A4 92%)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 60% 55% at 72% 12%, rgba(244, 217, 164, 0.85) 0%, rgba(244, 217, 164, 0) 60%), radial-gradient(ellipse 55% 60% at 20% 85%, rgba(22, 31, 75, 0.55) 0%, rgba(22, 31, 75, 0) 65%)",
            }}
          />
          <div className="absolute bottom-10 left-10 max-w-xs">
            <h2 className="text-5xl font-extrabold text-white drop-shadow-sm">
              Welcome.
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Leave requests for Budiman Company — one system, visible from
              submission to decision.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
