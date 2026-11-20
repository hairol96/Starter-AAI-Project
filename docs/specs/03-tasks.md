# Login – Tasks

> **This file answers:** In what order do we build it, and how do we check each step?
> **Who:** The AI drafts it. You review it.
>
> Build one task at a time, in order. When a task is done, the AI changes its
> Status to Done. At the end, you check the whole app against the specs.
> If something is wrong, fix the spec first, then ask the AI to rebuild.
>
> Specs: `01-requirements.md` (U*, AC*) and `02-design.md` (§numbers).

**Priority.** Every task is **High**, **Medium** or **Low**. Do High first.
Do Low only if time is left, and only if you ask.

The whole login module is FR-01 and FR-10 — both High in the brief — so
every task below is High; one of them (the session library) also carries the
Medium story U9.

| Status | # | Task | Priority | Checks (from requirements §4) |
|--------|---|------|----------|-------------------------------|
| Done | 1 | Project setup for Prisma and the seed | High | — (enables AC-07) |
| Done | 2 | Users table | High | AC-07 (schema half) |
| Done | 3 | Seed the six demo users | High | AC-07 |
| Done | 4 | Session cookie library | High | AC-09 (library half) |
| Done | 5 | Login page | High | — (part of AC-01) |
| Done | 6 | Role home pages, gates and sign-out | High | AC-04, AC-05, AC-06 |
| Done | 7 | Login action: real sign-in | High | AC-01, AC-02, AC-03, AC-08 |
| Done | 8 | Full acceptance run against the requirements | High | AC-01…AC-09 |

---

## Task 1 – Project setup for Prisma and the seed *(High)* — **Done**

> Database first, as agreed: this task creates the wiring, not the table.

- **Goal:** Prisma is initialised against SQLite, `.env` holds the two
  secrets, and the seed command is wired up — everything is ready for the
  table and the data.
- **Files:** `prisma/schema.prisma` (datasource + generator only), `.env`
  (`DATABASE_URL`, `SESSION_SECRET`), `package.json` (`db:seed` script +
  `prisma.seed` entry), `.gitignore` (add `.env` and the SQLite file if
  missing).
- **Check:** Run `npx prisma validate` — it accepts the schema. `cat .env`
  shows both variables set (the secret is random, ≥ 32 chars). `git status`
  does **not** list `.env`. No app code yet; `npm run dev` still shows the
  blank starter page.
- **Trace:** design §3 (fixed stack), §5 (file list), §7 (commands);
  interview A3 (12-hour session ⇒ `SESSION_SECRET`).

## Task 2 – Users table *(High)* — **Done**

- **Goal:** The `User` table from design §1 exists in a real SQLite file.
- **Files:** `prisma/schema.prisma` (add `Role` enum + `User` model),
  `src/lib/db.ts` (shared Prisma client, not yet used by pages).
- **Check:** Run `npx prisma db push`; the SQLite file appears at the path in
  `DATABASE_URL`. Run `sqlite3 <file> ".schema User"` — it shows all nine
  fields from design §1, with `email` and `icNo` marked UNIQUE and `role`
  restricted to the four values.
- **Trace:** design §1 (`User`), §5; requirements U1, U10; brief §7.2.

## Task 3 – Seed the six demo users *(High)* — **Done**

- **Goal:** One command loads the six people from brief §7.2 with hashed
  passwords; re-running it never duplicates anyone.
- **Files:** `prisma/seed.ts`.
- **Check:** Run `npm run db:seed` twice. Then run
  `sqlite3 <file> "SELECT email, role, substr(password,1,4) FROM User;"` —
  exactly six rows, the emails from Reference B, each password starting
  `$2b$` and nowhere `password123`. (This is AC-07 in full.)
- **Trace:** requirements U7, U10, AC-07; design §2 rule 11, Reference B;
  brief §7.2.

## Task 4 – Session cookie library *(High)* — **Done**

- **Goal:** A tested library can create, verify and clear the signed
  `hrms_session` cookie — signature, `exp`, 12-hour lifetime — with no UI
  involved yet.
- **Files:** `src/lib/session.ts`.
- **Check:** With a throwaway script run by `npx tsx`:
  • create a session for userId 1 / `EMPLOYEE`, then verify it → returns the
  payload; • change one character of the signed string → verify rejects it;
  • create with a past `exp` (test hook or hand-built) → verify rejects it;
  • lifetime constant equals 12 hours. Delete the throwaway script
  afterwards.
- **Trace:** requirements U9, AC-09 (library side); design §2 rules 6–9,
  §5 (`session.ts`); interview A3.

## Task 5 – Login page *(High)* — **Done**

- **Goal:** `/login` shows the email + password form with the app name, the
  error notice area, and nothing else — no sign-up, no reset links.
- **Files:** `src/app/login/page.tsx` (form markup only, posts to the action
  added in Task 7).
- **Check:** Open http://localhost:3000/login — form renders in Tailwind
  style, both fields and the Sign in button are present, and the page source
  contains no other links. Submitting does nothing useful yet (that's Task 7);
  it must not crash.
- **Trace:** requirements U1 (screen), U3 (notice area); design §4
  (`/login`), §5; interview A1.

## Task 6 – Role home pages, gates and sign-out *(High)* — **Done**

- **Goal:** The four role homes, the `AppShell`, the server-side gates
  (`requireUser` / `requireRole`), the root redirect and the logout action
  all work — tested with a hand-made cookie, before real login exists.
- **Files:** `src/lib/auth.ts`, `src/components/AppShell.tsx`,
  `src/app/page.tsx`, `src/app/employee|supervisor|hr|admin/layout.tsx`,
  `src/app/employee|supervisor|hr|admin/page.tsx`,
  `src/app/login/actions.ts` (`logout` only).
- **Check:** First make a valid cookie: run `npx tsx` to sign a session for
  the seeded employee and paste it into devtools as `hrms_session`. Then:
  • logged out, open `/employee` → redirected to `/login` (AC-04);
  • with the employee cookie, `/employee` renders with name, role and Sign
  out; typing `/admin` → bounced to `/employee` with the not-authorized
  banner, no admin content (AC-05); • Sign out → cookie gone, back at
  `/login`, and Back/reload of `/employee` redirects again (AC-06).
- **Trace:** requirements U4, U5, U6, AC-04/05/06; design §2 rules 4–5, 10,
  12, §4, §5, §6 first bullet; interview A4–A6.

## Task 7 – Login action: real sign-in *(High)* — **Done**

- **Goal:** Signing in with a demo account works end to end: credentials are
  checked against the database, the signed cookie is set, and each role lands
  on its own home page. One generic message for every failure.
- **Files:** `src/app/login/actions.ts` (add `login`), wire the Task 5 form
  to the action.
- **Check:** • `employee-1@budiman.com` / `password123` lands on `/employee`
  (AC-01); • all six accounts land on the right home (AC-02); • wrong
  password and unknown email give the identical `Invalid email or password`,
  five retries still allowed (AC-03); • ` Employee-1@Budiman.com ` (spaces +
  capitals) also logs in (AC-08); • the cookie in devtools is the signed
  value from Task 4, `HttpOnly`, ~12 h expiry.
- **Trace:** requirements U1, U2, U3, U8, AC-01/02/03/08; design §2 rules
  1–3, §5 (`login/actions.ts`); interview A1–A2, A7.

## Task 8 – Full acceptance run against the requirements *(High)* — **Done**

- **Goal:** The module is verified as a whole and left clean.
- **Files:** none expected — fixes go to the spec first, then the code.
- **Check:** Walk AC-01 … AC-09 of `01-requirements.md` §4 by hand with the
  demo accounts (AC-09: move the system clock forward ~13 h and reload
  `/employee` → redirected to `/login`). Then `npm run lint` and
  `npm run build` pass with no errors. Tick the Status column of every check
  in requirements §4.
- **Trace:** requirements §4 (all ACs), U9/AC-09 completion; design §6
  (security claims must hold); brief §7.5 / OWASP.

---

**After each task:** the AI reports what passed, waits for your OK, then
commits with a Conventional Commit message (`feat: …`) — one commit per
finished task, only when you say go.
