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

---

# Leave Requests – Tasks

> **This file answers:** In what order do we build the leave module, and
> how do we check each step?
> **Who:** The AI drafts it. You review it.
>
> Build one task at a time, in order. When a task is done, the AI changes
> its Status to Done. At the end, you check the whole flow against the
> specs. If something is wrong, fix the spec first, then ask the AI to
> rebuild.
>
> Specs: the Leave Requests sections of `01-requirements.md` (U11–U23,
> AC-10…AC-24) and `02-design.md` (LR-* rules, §numbers).

**Priority.** FR-02 … FR-07 and FR-10 are High in the brief → the build
tasks and the two verification tasks are High. FR-08 (admin table) is the
only Medium; it is built after the High flow it reports on (nothing can
be High-checked without the flow), and the two final High tasks walk the
whole module including it.

| Status | # | Task | Priority | Checks (from requirements §4, leave section) |
|--------|---|------|----------|----------------------------------------------|
| To do | 9 | Leave request table | High | — (enables AC-10…AC-16) |
| To do | 10 | Leave rules library | High | AC-21, AC-23 (library half) |
| To do | 11 | Request form + submit action | High | AC-10, AC-11, AC-12 |
| To do | 12 | Request detail page (read-only, gated) | High | AC-21 (button hunt), AC-22 (page half) |
| To do | 13 | Employee home + Send to HR | High | AC-15, AC-19, AC-20 (first action) |
| To do | 14 | Supervisor home + Sign / Reject | High | AC-13, AC-14, AC-17 |
| To do | 15 | HR queue + Approve / Reject + officer recorded | High | AC-16, AC-18 |
| To do | 16 | Admin: every record, read-only | Medium | AC-24 |
| To do | 17 | Tampering and cross-role pass | High | AC-22, AC-23 |
| To do | 18 | Full acceptance run against the leave requirements | High | AC-10…AC-24 |

---

## Task 9 – Leave request table *(High)* — **To do**

> Database first, as with login Task 1: the wiring of the new table only,
> no screens yet.

- **Goal:** The `LeaveRequest` table from design §1 exists in the real
  SQLite file, with the two enums and the three indexes.
- **Files:** `prisma/schema.prisma` (add `LeaveType`, `LeaveRequestStatus`
  enums + `LeaveRequest` model).
- **Check:** `npx prisma validate` passes. `npx prisma db push` creates the
  table. `sqlite3 <file> ".schema LeaveRequest"` shows every column from
  design §1, FKs to `User`, and a default of `PENDING_SUPERVISOR`; a
  hand-insert with a bogus status is refused by Prisma (try via
  `npx tsx`). No app code changes; the app still runs.
- **Trace:** design §1, §5; brief §7.2 (Leave requests, Leave types,
  §5.2 statuses); requirements U11.

## Task 10 – Leave rules library *(High)* — **To do**

> One auditable place for the rules, tested before any UI can get them
> wrong (same pattern as login Task 4).

- **Goal:** `src/lib/leave.ts` holds the pure rules: `daysInclusive`,
  the text-limit validators (3–500 / 3–100, trimmed), the LR-3 transition
  table, `allowedActions(user, request)`, and the LR-8 scoped queries.
- **Files:** `src/lib/leave.ts`.
- **Check:** Throwaway `npx tsx` script (delete afterwards): 1–5 Dec → 5
  days, 4–4 Dec → 1 day, 9–5 Dec → refused; `""` remark → invalid,
  `"  ok  "` → invalid (too short), 501 chars → invalid, 500 → valid;
  `PENDING_SUPERVISOR → PENDING_HR` → refused, `SIGNED → PENDING_HR` by
  the owning employee → allowed, `SIGNED → PENDING_HR` by someone else →
  refused; terminal statuses → no actions for anyone.
- **Trace:** design LR-3, LR-5, LR-6, LR-8, LR-9, §5; requirements U13,
  U19, U21 (library side of AC-21/AC-23).

## Task 11 – Request form + submit action *(High)* — **To do**

- **Goal:** An employee fills the form (type — Other reveals the
  description box —, dates with live "N days", division supervisor
  dropdown) and submits; the server validates everything and stores a
  `PENDING_SUPERVISOR` row.
- **Files:** `src/app/employee/new/page.tsx`,
  `src/components/RequestForm.tsx`, `src/app/leave/actions.ts`
  (`submitRequest`), AppShell notice entry `request-submitted`.
- **Check:** As `employee-1@`, `/employee/new`: the supervisor dropdown
  lists exactly Supervisor 1 and Supervisor 2 (AC-10); Other with blank
  description → blocked with the value kept, "Moving house" → submits
  (AC-11); end before start → refused; 1–5 Dec shows "5 days" (AC-12).
  `sqlite3` shows the new row with the right fields and `submittedAt`.
  Pressing Submit asks "Are you sure?"; cancel → nothing stored; confirm
  → green `request-submitted` banner (first taste of AC-20). Direct URL
  to the page as another role → bounced. A forged POST (bad supervisorId,
  other role) → refused server-side.
- **Trace:** requirements U11, U12, U13, U21, AC-10/11/12; design §1,
  LR-1, LR-2, LR-5, LR-6, LR-10, §4, §5.

## Task 12 – Request detail page (read-only, gated) *(High)* — **To do**

> Shared by all four roles, and the **only** screen that will ever hold
> action buttons — so it is built and gated before any action exists.
> `DecisionButton` (confirm + POST) and the `AppShell` success-notice map
> land here; Task 13's Send to HR is their first real use.

- **Goal:** `/requests/[id]` renders one request read-only (all fields,
  both remarks, submitted/signed/decided dates) for exactly the viewers
  LR-8 allows; the action area is empty until Tasks 13–15.
- **Files:** `src/app/requests/[id]/page.tsx`,
  `src/components/DecisionButton.tsx`, `src/components/AppShell.tsx`
  (notice map).
- **Check:** Employee opens own id → full detail, remarks and all three
  dates visible; Supervisor 2 opens a row naming Supervisor 1 (hand-typed
  URL) → bounced home with the not-authorized banner, no content
  (AC-22 page half); HR opens a supervisor-rejected row → bounced
  (AC-18's rule); unknown id → "not found". A button hunt across all six
  statuses finds no Edit / Delete / Reopen — and, being not yet wired, no
  action buttons at all (AC-21).
- **Trace:** requirements U19, U20, AC-21/22; design LR-3, LR-4, LR-8,
  LR-10, §4 (rows link here; only actions live here), §5, §6 bullets 2–3.

## Task 13 – Employee home + Send to HR *(High)* — **To do**

- **Goal:** The placeholder `/employee` becomes the real page: New request
  button, *To act on* = own Signed requests (oldest first), *History* =
  the rest (newest first), rows linking to the detail page; the detail
  page's action area gains **Send to HR** for the owning employee — the
  first real `DecisionButton` and the first full proof of the LR-10
  pattern.
- **Files:** `src/app/employee/page.tsx`,
  `src/components/RequestList.tsx`, `src/components/StatusBadge.tsx`,
  `src/app/leave/actions.ts` (`sendToHr`), notice `request-sent`,
  `src/app/requests/[id]/page.tsx` (action area).
- **Check:** Submitting shows the request in History as Pending supervisor.
  AC-19: hand a row to another user —
  `UPDATE LeaveRequest SET employeeId=<another user id>` in SQLite — the
  row vanishes from `/employee`; restore it. Until Task 14 exists, flip a
  row with `sqlite3 <file> "UPDATE LeaveRequest SET status='SIGNED' WHERE id=…"`:
  it appears under To act on (oldest-first order holds); opening it shows
  Send to HR, pressing → confirm, then green banner and Pending HR, gone
  from To act on (AC-15 + AC-20's first full pass). Detail pages of every
  other status show no button; a forged send POST on an unsigned row →
  refused.
- **Trace:** requirements U15, U17, U18, AC-15/19/20; design LR-3, LR-4,
  LR-8, LR-9, LR-10, §4, §5.

## Task 14 – Supervisor home + Sign / Reject *(High)* — **To do**

- **Goal:** `/supervisor` lists the queue and history for requests naming
  the signed-in supervisor; the detail page now offers Sign and
  Reject(remark) to the named supervisor at Pending supervisor, through
  the LR-10 pattern.
- **Files:** `src/app/supervisor/page.tsx`, `src/app/requests/[id]/page.tsx`
  (action area), `src/app/leave/actions.ts` (`supervisorSign`,
  `supervisorReject`), notices `request-signed`, `request-rejected`.
- **Check:** Two requests, one naming Supervisor 1 and one Supervisor 2 →
  each queue shows exactly its own, oldest first; History newest first
  (AC-17). Sign → confirm, success banner, status Signed, `signedAt`
  set, disappears from the queue (AC-13). Reject with blank remark →
  blocked, typed remark kept; with remark → Rejected by supervisor and
  the employee's History shows the remark; nothing can undo it (AC-14).
  Supervisor 2 POSTs to the sign action on Supervisor 1's id → refused.
- **Trace:** requirements U14, U17, U18, U19, AC-13/14/17/20; design
  LR-3, LR-4, LR-5, LR-9, LR-10, §4, §5.

## Task 15 – HR queue + Approve / Reject + officer recorded *(High)* — **To do**

- **Goal:** `/hr` shows the shared queue and HR history; the detail page
  offers Approve and Reject(remark) to any HR officer at Pending HR; the
  deciding officer and time are stamped server-side.
- **Files:** `src/app/hr/page.tsx`, `src/app/requests/[id]/page.tsx`
  (action area), `src/app/leave/actions.ts` (`hrApprove`, `hrReject`),
  notice `request-approved`.
- **Check:** Both `hr-1@` and `hr-2@` see the same queue, oldest first
  (AC-18). `hr-2@` approves → Approved, "HR 2" recorded with `decidedAt`
  (AC-16); `hr-1@` rejects another with a remark — blank remark blocked,
  remark required, "HR 1" recorded (AC-16). A supervisor-rejected request
  appears nowhere in HR's pages (AC-18). Employee POSTs to `hrApprove` →
  refused.
- **Trace:** requirements U16, U17, AC-16/18; design LR-3, LR-4, LR-5,
  LR-8, LR-9, LR-10, §4, §5.

## Task 16 – Admin: every record, read-only *(Medium)* — **To do**

- **Goal:** `/admin` lists every leave record — including supervisor
  rejections HR never saw — with no way to change anything (FR-08).
- **Files:** `src/app/admin/page.tsx` (reuses `RequestList` /
  `StatusBadge`).
- **Check:** After the flow above: the admin table contains all requests
  from every employee, newest first, remarks and officer visible,
  including Rejected-by-supervisor rows (AC-24). Zero buttons; typed
  action URLs from an admin session → refused (LR-1/LR-3). Admin sees
  requests an employee or supervisor cannot see — the point of the
  module.
- **Trace:** requirements U22, AC-24; design LR-8, §4, §5; brief FR-08.

## Task 17 – Tampering and cross-role pass *(High)* — **To do**

- **Goal:** The security claims (§6 of the design, FR-10/§7.5) are proven
  by breaking attempts, not assumed.
- **Files:** none expected — fixes go to the spec first, then the code.
- **Check:** With devtools and `npx tsx` forged POSTs: employee →
  `hrApprove` / `supervisorSign` on a row not naming them → refused;
  supervisor → `submitRequest` → refused; anonymous (no cookie) → refused
  (AC-22). Forge field abuse: end < start, blank required remark,
  501-char remark, `OTHER` without description, bogus status value →
  all refused (AC-23). Remark
  `<script>alert(1)</script>` stored via a legal rejection → renders as
  literal text (AC-23). `npm run lint` and `npm run build` pass.
- **Trace:** requirements U20, U21, AC-22/23; design LR-1…LR-6, §6;
  brief §7.5 / OWASP A01, A03, A05.

## Task 18 – Full acceptance run against the leave requirements *(High)* — **To do**

- **Goal:** The module is verified as a whole, in the order the brief's
  flow happens, and left clean.
- **Files:** none expected — fixes go to the spec first, then the code.
- **Check:** Walk AC-10 … AC-24 of the requirements' leave §4 by hand:
  the happy path (Employee 1 → Supervisor 1 signs → Send → `hr-2`
  approves, officer recorded) and both rejection paths (supervisor
  rejects with remark; HR rejects with remark), confirmations and
  success banners on all six action buttons (AC-20), all six statuses
  button-hunted for edit/undo paths (AC-21), then `npm run lint` +
  `npm run build` clean. Tick the Status column of every check.
- **Trace:** requirements §4 (all leave ACs); design §2–§6; brief §5.1
  workflow and §7.5.

---

**After each task:** same rule as login — the AI reports what passed,
waits for your OK, then commits (`feat: …`), one commit per finished
task, only when you say go.
