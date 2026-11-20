# Login – Design

> **This file answers:** How is the app put together? (data, rules, screens,
> where the code lives)
> **Who:** The AI drafts it. You review all of it.
>
> If this file and the requirements disagree, fix the requirements first,
> then this file.
>
> Companion to `01-requirements.md` (login module, FR-01 + FR-10). Story and
> check IDs (U*, AC-*) point back to that file. The leave request tables and
> screens come in a later design.

## 1. Tables

### `User` – one row per person who can log in

Matches brief §7.2. Prisma model `User` in SQLite.

| Field | Type | Required? | What it holds |
|-------|------|-----------|---------------|
| `id` | number | auto | Unique number for the row |
| `name` | text | yes | Full name, e.g. `Employee 1` |
| `icNo` | text | yes | Identity card number, format `xx-xxxxxx` (two digits, hyphen, six digits). Unique |
| `email` | text | yes | Work email, always ends `@budiman.com`. **Stored lowercase**, unique. Used to log in |
| `password` | text | yes | bcrypt hash (starts `$2b$`), never plain text. Column is never sent to the browser |
| `role` | enum | yes | One of `EMPLOYEE`, `SUPERVISOR`, `HR`, `ADMIN`. Exactly one per user |
| `division` | text | yes | The user's division (Reference A). Used later to pick a supervisor |
| `designation` | text | yes | Job title (Reference A) |
| `createdAt` | date | auto | Set automatically when the account is created |

No session table: the session lives inside the signed cookie itself
(stateless — see rule 6), so there is nothing else to store.

## 2. Business rules

1. **Email is the only login identifier.** Trimmed, lowercased, then matched
   against the lowercased stored email (U8). IC number never logs anyone in (U1).
2. **One generic failure message.** Any bad credential — wrong password,
   unknown email, malformed input — returns the same `Invalid email or
   password`. The response never reveals which field failed, and there is no
   lockout (U3, AC-03).
3. **Passwords are bcrypt hashes.** Hashed with `bcryptjs` at seed time; the
   plain password exists only inside the login request (U10, AC-07).
4. **Nobody is shown any page without a valid session.** Every non-login
   route is checked on the server before it renders and redirects to `/login`
   otherwise (U5, AC-04).
5. **Role decides the pages.** Each role route checks the session's role on
   the server; a wrong-but-logged-in user is redirected to their own home
   page with a `?notice=not-authorized` banner parameter (U4, AC-05). The
   check runs again inside every server action (Section 6).
6. **The session is a signed cookie.** `hrms_session` cookie holds a payload
   `{userId, role, exp}` encoded as base64url plus an HMAC-SHA256 signature
   (Node's built-in `crypto`, key = `SESSION_SECRET` from `.env`). Tampering
   with any byte fails verification and counts as logged out.
7. **Sessions last 12 hours, then re-login.** The cookie's `maxAge` and the
   payload's `exp` are both 12 hours from login; the server re-checks `exp`
   so an edited cookie still fails (U9, AC-09).
8. **The session is trusted, the user is re-read.** After the signature
   verifies, the server reloads the user from the database by `userId`; if
   the row is gone or the role changed, the session is treated as logged out.
9. **Cookie flags block casual theft.** `httpOnly` (no JavaScript can read
   it), `sameSite: "lax"`, `path: /`, `secure` whenever the app runs on HTTPS.
10. **Logout clears the session.** The Sign-out server action deletes the
    cookie and redirects to `/login` (U6, AC-06).
11. **Accounts exist only via the seed.** No sign-up, no password reset
    anywhere in the app; the only accounts are the six from Reference B,
    created by the seed command (U7, AC-07).
12. **No proxy.ts on purpose.** Next 16 deprecates `middleware.ts` (now
    `proxy.ts`) and its docs say to use it only as a last resort. Every gate
    in this module is a plain server-side function (`requireUser` /
    `requireRole`) called from role layouts and actions — one place to
    audit, and nothing bypassed by a direct action POST.

## 3. Technology

| Part | Choice | In plain words |
|------|--------|----------------|
| Web framework | Next.js 16 (App Router) + TypeScript | Screens and server logic in one project |
| Database | SQLite through Prisma | One file, no server to install |
| Styling | Tailwind CSS | Login form and notices styled inline in the components |
| Password hashing | `bcryptjs` | Turns passwords into `$2b$…` hashes; plain text never stored |
| Session | Signed cookie (HMAC-SHA256, Node `crypto`) | The browser carries the session; the server only trusts the signature. No new npm packages |
| Forms | Server actions (`"use server"`) | Login and sign-out post to server functions — no separate API |

Versions stay exactly as pinned in `package.json`; nothing new is added.

## 4. Screens (routes)

| Route | Who | What it shows | Status |
|-------|-----|---------------|--------|
| `/` | anyone | Redirects: to your home page when logged in, to `/login` when not | To do |
| `/login` | logged-out visitors | Email + password form, Sign in button, error notice area. If already signed in, redirects to own home page | To do |
| `/employee` | `EMPLOYEE` only | Placeholder employee home (role name, signed-in email, Sign out button). Real content comes with the leave spec | To do |
| `/supervisor` | `SUPERVISOR` only | Placeholder supervisor home, same layout | To do |
| `/hr` | `HR` only | Placeholder HR home, same layout | To do |
| `/admin` | `ADMIN` only | Placeholder admin home, same layout | To do |

Shared behaviour for the four home pages: one `AppShell` layout shows the
app name, the signed-in user's name and role, a **Sign out** button, and a
banner when the URL carries `?notice=not-authorized`.

Server actions (no new routes): `login` — verifies credentials, sets the
cookie, redirects to the role's home; `logout` — clears the cookie,
redirects to `/login`.

### Visual style (all screens)

Agreed 20/11/26 from the mock-up in `images/login.webp` (visual reference
only — see the exclusions at the end). Behaviour is unchanged; this is how
the screens look.

**Palette** (custom Tailwind theme tokens in `src/app/globals.css`):

| Token | Value | Used for |
|-------|-------|----------|
| `navy-950` | `#161F4B` | Page background behind the card |
| `navy-900` | `#1E2A5E` | Primary: LOGIN/Sign-out buttons, home header strip, avatar circle, wordmark |
| `navy-800` | `#2A3A78` | Button and chip hover |
| `steel-400` | `#6C88B8` | Mid-tone of the wave gradient |
| `cream-300` | `#F4D9A4` | Warm accent of the wave gradient |
| white | `#FFFFFF` | Card surface, button text, right-panel heading |
| `gray-200` | `#E4E7EC` | Input borders, hairlines |
| `gray-400` | `#98A2B3` | Placeholders, decorative dots |
| `gray-500` | `#667085` | Body text on white |
| yellow / red tints | existing Tailwind | Not-authorized banner / login error (unchanged) |

**Layout.**

1. **Page**: `navy-950` fills the viewport; every screen is one large
   white card centred on it, `rounded-3xl` (24 px), with a deep soft
   shadow.
2. **Login card**: `max-w-5xl`, split panel — left ≈ 42 % white, right
   ≈ 58 % wave gradient (`navy-900 → steel-400 → cream-300`, diagonal
   CSS gradient standing in for the stock wave art, which stays out for
   licensing). The gradient panel hides below `md`.
3. **Login left panel** (padding 32–40 px, stack gap 24 px, column
   ≈ 260 px wide, centred): wordmark top-left (navy rounded-square mark +
   "Budiman HRMS", 600 weight); avatar circle (navy, white person icon,
   64 px); two pill inputs (`rounded-full`, 44 px tall, `gray-200` border,
   person/lock icon inset left, uppercase `gray-400` placeholder, labels
   kept screen-reader-only); one full-width navy pill button, white
   uppercase `LOGIN` label with letter-spacing; three `gray-400` dots at
   the bottom, centred.
4. **Login right panel**: the "Welcome." heading (white, bold, ≈ text-5xl)
   near the bottom left, one grey-white caption line under it. No nav
   links.
5. **Home screens**: same navy page and white card; the card's top is a
   `navy-900` header strip (≈ 56 px, white text) — wordmark left, on the
   right a translucent name·role chip and a translucent pill **Sign out**
   button (white border/text, `navy-800` hover). Below the strip, the page
   content sits in the white area with 32 px padding.
6. **Rhythm**: 24 px gaps between stacked controls; 32 px card padding on
   the home card; inputs and buttons are always pill-shaped.

**Excluded from the mock on purpose** (approved 20/11/26): the "Remember
me" checkbox and "Forgot your password?" link (requirements §5; interview
A2/A3), the mock's placeholder nav links, the "Template Design" wordmark
(replaced by "Budiman HRMS"), and the stock wave image itself (recreated
in CSS — the JPEG is licensed stock art, not ours to ship).

## 5. Where the code lives

| Folder / file | What's in it |
|---------------|--------------|
| `prisma/schema.prisma` | SQLite datasource + `User` model with the `Role` enum |
| `prisma/seed.ts` | The six demo users from Reference B; hashes `password123` with bcryptjs; safe to re-run (upserts by email) |
| `src/lib/db.ts` | The single shared Prisma client |
| `src/lib/session.ts` | Create / verify / clear the signed `hrms_session` cookie; reads `SESSION_SECRET` and `DATABASE_URL` from `.env`; exports the 12-hour lifetime as one constant |
| `src/lib/auth.ts` | `requireUser()` and `requireRole(role)` — the only doors a page may use; both redirect as rules 4–5 say |
| `src/app/page.tsx` | The root redirect |
| `src/app/login/page.tsx` | The login form (client-light: a plain form posting to the action) |
| `src/app/login/actions.ts` | `login` and `logout` server actions |
| `src/app/employee/layout.tsx` … `/admin/layout.tsx` | Each role segment's layout: calls `requireRole(…)` **before** rendering, wraps children in `AppShell` |
| `src/app/employee/page.tsx` … `/admin/page.tsx` | The placeholder home content |
| `src/components/AppShell.tsx` | Header, user info, Sign out button, notice banner |
| `.env` (never committed) | `DATABASE_URL`, `SESSION_SECRET` |

`src/app/layout.tsx` keeps the global HTML shell; `src/app/globals.css` keeps
Tailwind. Nothing else in `src/` changes.

## 6. Security (in plain words)

Follows brief §7.5 / OWASP Top 10 2025.

- **Every page checks the session and the role on the server** before
  rendering — the menu hiding links is decoration, `requireRole` is the gate
  (A01 Broken Access Control).
- **Every action checks again.** `login` re-validates its inputs; the role
  home pages have no other actions yet, and any action added later must call
  `requireUser`/`requireRole` itself — a forged POST to a server action gets
  the same check as a page visit (A01).
- **Passwords:** bcrypt hashes only; the `password` column is selected only
  inside the login check and never rendered or logged (A02 Cryptographic
  Failures).
- **Login failures:** one generic message, no enumeration, no lockout per
  the requirements (A07 Authentication Failures).
- **Session cookie:** signed with HMAC-SHA256 using `SESSION_SECRET` from
  `.env` (kept out of git; a wrong secret fails every verification),
  `httpOnly`, `sameSite: lax`, 12-hour expiry, and the server re-checks both
  signature and `exp` on every request.
- **SQL injection:** all database access goes through Prisma's parameterised
  queries — no hand-written SQL with user input (A03 Injection).
- **No secrets in the browser:** `SESSION_SECRET` and the password column
  never reach any client component.
- **Demo data only:** made-up names and IC numbers; no real personal data
  (brief §7.2).

## 7. Commands

| Command | What it does |
|---------|--------------|
| `npm install` | Install the pinned dependencies |
| `npx prisma db push` | Create the SQLite file and the `User` table from the schema |
| `npm run db:seed` | Load the six demo users (runs `prisma db seed` → `prisma/seed.ts`) |
| `npm run dev` | Start the app at http://localhost:3000 |
| `npm run lint` | Check the code style |
| `npm run build` | Production build check |

First-time setup: `npx prisma init --datasource-provider sqlite`, write
`DATABASE_URL` and `SESSION_SECRET` into `.env`, then the commands above in
order. One addition to `package.json`: a `db:seed` script and the `prisma
{ "seed": … }` entry pointing at `prisma/seed.ts` (a chore, not a feature).

---

# Reference

## Reference A. Fixed choices

- **Roles:** `EMPLOYEE`, `SUPERVISOR`, `HR`, `ADMIN` — one per user
- **Email domain:** always `@budiman.com`, stored lowercase, unique
- **IC number format:** `xx-xxxxxx` (two digits, hyphen, six digits)
- **Divisions → designations** (brief §7.2; validation list for later specs):
  - **Finance:** Finance Manager, Accountant, Accounts Clerk
  - **Human Resources:** HR Manager, HR Officer, HR Assistant
  - **Information Technology:** IT Manager, Software Developer, IT Support Officer
  - **Operations:** Operations Manager, Operations Supervisor, Operations Executive
  - **Marketing:** Marketing Manager, Marketing Executive, Marketing Assistant
  - **Admin:** Admin Manager
- **Session lifetime:** 12 hours, one constant in `src/lib/session.ts`
- **Generic login error:** `Invalid email or password` — exact wording, one place

## Reference B. Demo data (seeded, all with password `password123`)

| Email | Name | IC No. | Role | Division | Designation |
|-------|------|--------|------|----------|-------------|
| `employee-1@budiman.com` | Employee 1 | 00-148888 | EMPLOYEE | Finance | Accounts Clerk |
| `supervisor-1@budiman.com` | Supervisor 1 | 00-157777 | SUPERVISOR | Finance | Finance Manager |
| `supervisor-2@budiman.com` | Supervisor 2 | 00-166666 | SUPERVISOR | Finance | Accountant |
| `hr-1@budiman.com` | HR 1 | 00-175555 | HR | Human Resources | HR Officer |
| `hr-2@budiman.com` | HR 2 | 00-184444 | HR | Human Resources | HR Officer |
| `admin@budiman.com` | Admin | 00-193333 | ADMIN | Admin | Admin Manager |

Made-up names and IC numbers — demo data only. Employee 1 and both
supervisors share the Finance division, which is what lets the leave spec
offer a same-division supervisor choice later.

---

# Leave Requests – Design

> **This file answers:** How is the leave request module built? (data,
> rules, screens, who can do what)
> **Who:** The AI drafts it. You review all of it.
>
> If this file and the requirements disagree, fix the requirements first,
> then this file.
>
> Companion to the Leave Requests section of `01-requirements.md` (FR-02 …
> FR-09). Stories U11–U23 and checks AC-10…AC-24 point to that section;
> interview answers L1–L8 to the interview of 20/11/26. Rules are numbered
> **LR-*** so they never collide with the login rules 1–12 above. The login
> stack (§3 above) is unchanged and is assumed here.

## 1. Tables

Two fixed lists become Prisma enums, and one new table stores requests
(brief §7.2 "Leave requests"). SQLite has no enum type — Prisma stores
these as TEXT and enforces the allowed values in the application layer;
the lists never change at runtime (no admin CRUD for them).

### `LeaveType` enum — the choices on the form (brief §7.2)

| Value | Meaning |
|-------|---------|
| `ANNUAL` | Annual leave — yearly paid leave |
| `MATERNITY` | Maternity leave |
| `UNPAID` | Unpaid leave |
| `COMPASSIONATE` | Compassionate leave |
| `OTHER` | Other — needs `otherTypeText` |

### `LeaveRequestStatus` enum — exactly the six of §5.2

| Value | Meaning |
|-------|---------|
| `PENDING_SUPERVISOR` | Submitted. Waiting for the supervisor |
| `SIGNED` | The supervisor signed; the employee can send it to HR |
| `PENDING_HR` | Sent to HR. Waiting for a decision |
| `APPROVED` | HR approved. Final |
| `REJECTED_BY_SUPERVISOR` | Supervisor rejected, with remark. Final |
| `REJECTED_BY_HR` | HR rejected, with remark. Final |

No seventh status exists (U19) — nothing withdrawn, edited or reopened.

### `LeaveRequest` — one row per request

| Field | Type | Required? | What it holds | Links to |
|-------|------|-----------|---------------|----------|
| `id` | number | auto | Unique number for the row | — |
| `employeeId` | number | yes | Who asked for leave | `User` |
| `supervisorId` | number | yes | Who must sign — a SUPERVISOR of the employee's division | `User` |
| `leaveType` | enum `LeaveType` | yes | One of the five types | — |
| `otherTypeText` | text | only when `OTHER` | What the leave is for; 3–100 chars trimmed (LR-5) | — |
| `startDate` | date | yes | First leave day | — |
| `endDate` | date | yes | Last leave day; ≥ `startDate`; same day allowed (L2) | — |
| `status` | enum `LeaveRequestStatus` | yes, default `PENDING_SUPERVISOR` | Where the request is now | — |
| `supervisorRemark` | text | only when `REJECTED_BY_SUPERVISOR` | Supervisor's reason, 3–500 trimmed (LR-5) | — |
| `hrOfficerId` | number | set by the server at the HR decision | The HR user who approved/rejected (FR-05) | `User` |
| `hrRemark` | text | only when `REJECTED_BY_HR` | HR's reason, 3–500 trimmed (LR-5) | — |
| `submittedAt` | date | auto | Set at submit | — |
| `signedAt` | date | set by the server when signed | When the supervisor signed | — |
| `decidedAt` | date | set by the server at the HR decision | When HR approved/rejected | — |

"Days" is **not** a column — it is derived at render as inclusive
calendar days between `startDate` and `endDate` (LR-6, L2). Indexes:
`(supervisorId, status)`, `(employeeId, submittedAt)`, `(status)` — the
three list queries of LR-8 use them. All three user columns are foreign
keys to `User`; the six demo users are never deleted, so no cascade
behaviour is needed (delete = restrict).

## 2. Business rules

**LR-1 — Only employees submit.** The submit action calls
`requireRole(EMPLOYEE)` first; no other role ever sees or can reach the
form (U11, L1).

**LR-2 — The supervisor comes from the division.** The form's dropdown is
built by the server: `role = SUPERVISOR AND division = <employee's
division>` (Reference A divisions). The submitted `supervisorId` is
re-checked against that same query — never trusted from the form (U11).

**LR-3 — Closed status machine.** These are the only legal moves; every
other transition, edit, cancel, undo and reopen is refused by the server,
wherever it comes from (U19, L4, L5):

| From | To | Who may do it |
|------|----|----------------|
| `PENDING_SUPERVISOR` | `SIGNED` (sets `signedAt`) | the **named** supervisor |
| `PENDING_SUPERVISOR` | `REJECTED_BY_SUPERVISOR` (sets `supervisorRemark`) | the **named** supervisor |
| `SIGNED` | `PENDING_HR` | the **owning employee** |
| `PENDING_HR` | `APPROVED` (sets `hrOfficerId`, `decidedAt`) | any HR user |
| `PENDING_HR` | `REJECTED_BY_HR` (sets `hrOfficerId`, `hrRemark`, `decidedAt`) | any HR user |

`APPROVED`, `REJECTED_BY_SUPERVISOR`, `REJECTED_BY_HR` are terminal.

**LR-4 — Who may act is read from the row, never the form.** The action
re-reads the request and checks: signer → `supervisorId` = me; sender →
`employeeId` = me; approver → my role is HR (shared queue, §5.3 rule 5).
`hrOfficerId` / `decidedAt` / `signedAt` are stamped by the server from
the session and the clock — form fields claiming them are ignored (U16,
U21).

**LR-5 — Required text, checked twice.** `supervisorRemark` required and
3–500 chars after trimming exactly when the decision is a supervisor
rejection; same rule for `hrRemark` at an HR rejection; `otherTypeText`
required and 3–100 exactly when `OTHER`. Client-side hints are
convenience; the server re-checks, and a failed check re-renders the form
with the typed values kept and a plain message (L8, U12, U14, U16, U21).

**LR-6 — Dates.** Both required, both valid dates, `endDate ≥ startDate`;
same day allowed; past dates allowed; no holiday or weekend calendar.
Days = `endDate − startDate + 1` in calendar days, computed wherever a
day count is shown — one helper in `src/lib/leave.ts` so every screen
agrees (L2, U13).

**LR-7 — Overlaps are nobody's business.** Submitting never looks at the
employee's other requests — no duplicate or overlap check (L6, U19
context). Approvers see them side by side and reject with a remark.

**LR-8 — Who sees which rows (enforced in the query, not the menu):**

| Viewer | Sees |
|--------|------|
| Employee | own rows only (`employeeId` = me) |
| Supervisor | rows naming them only (`supervisorId` = me) |
| HR | queue: `status = PENDING_HR` (shared by all officers); history: `APPROVED` or `REJECTED_BY_HR` — what ever reached HR; supervisor rejections stay invisible to HR |
| Admin | every row, read-only (U22) |

A detail page opened outside these rules redirects to the viewer's home
with `?notice=not-authorized` — the same bounce as login AC-05 (U20).

**LR-9 — Order.** "To act on" sections sort `submittedAt` **ascending**
(longest wait on top); History and the admin table sort `submittedAt`
**descending**. No pagination at demo size (L7, U17).

**LR-10 — Every action is one server action, same five steps:**
`requireRole` → re-read the row and apply LR-4 ownership → check the
current status makes the move legal (LR-3) → validate the fields (LR-5,
LR-6) → write and redirect to the actor's home with a `?notice=` success
key. Confirmations (FR-07, U18) are client-side "Are you sure?" dialogs —
polite, never load-bearing: the server never learns or cares whether the
dialog was answered.

**LR-11 — Free text stays plain.** Remarks and descriptions are stored as
typed (after trimming) and rendered through React's normal escaping —
`dangerouslySetInnerHTML` is banned in this module (U21, A03/A05).

**LR-12 — No new packages.** The stack stays exactly as the login §3
table; all database access is Prisma parameterised queries (A03).

**LR-13 — Same doors as login.** Every leave page calls
`requireUser`/`requireRole` before rendering and every action calls them
again first — the gates from `src/lib/auth.ts`, no parallel system
(login §2 rule 12).

## 3. Technology

Everything from the login §3 table, unchanged. This module adds no npm
packages, no external services, no API routes — pages and server actions
only.

## 4. Screens (routes)

| Route | Who | What it shows | Status |
|-------|-----|---------------|--------|
| `/employee` | `EMPLOYEE` | Placeholder replaced: **New request** button + *To act on* (own `SIGNED`, oldest first) + *History* (the rest, newest first) | To do |
| `/employee/new` | `EMPLOYEE` | The form: type select (Other reveals a description box), start/end dates with a live "N days", supervisor dropdown (LR-2), Submit | To do |
| `/supervisor` | `SUPERVISOR` | *To act on* = rows naming me, `PENDING_SUPERVISOR`, oldest first; *History* = the rest of mine, newest first | To do |
| `/hr` | `HR` | *To act on* = the shared queue (`PENDING_HR`, oldest first); *History* = Approved / Rejected by HR, newest first | To do |
| `/admin` | `ADMIN` | Every record, newest first: employee, supervisor, type, dates, days, status, remarks, officer — no buttons anywhere (FR-08) | To do |
| `/requests/[id]` | per LR-8 | One request, read-only fields plus both remarks and the submitted/signed/decided dates; an action area that renders **only** what LR-3 + LR-4 allow this viewer: Sign / Reject(remark) for the named supervisor at `PENDING_SUPERVISOR`, Send to HR for the owning employee at `SIGNED`, Approve / Reject(remark) for HR at `PENDING_HR` | To do |

Rules for the detail page: unknown id → "not found"; row exists but
outside LR-8 → bounce to home with `?notice=not-authorized`. Every list
row links to `/requests/[id]` — the detail page is the **only** place an
action button appears; the list pages themselves hold no actions.

Server actions (no new routes), all in `src/app/leave/actions.ts`, all
following LR-10: `submitRequest`, `sendToHr`, `supervisorSign`,
`supervisorReject`, `hrApprove`, `hrReject`.

Notices: `AppShell` grows from the single `not-authorized` banner to a
small map of success notices — `request-submitted`, `request-signed`,
`request-rejected`, `request-sent`, `request-approved` — each a plain
green banner, plus the existing yellow one (U18).

Visual style: the login visual language (§4 *Visual style* above) —
navy page, white rounded card, pill buttons, same palette. Status shown
as a coloured pill: pending = yellow, `SIGNED` = blue, `APPROVED` =
green, rejections = red.

### Who can do what (matrix)

| Action | Employee | Supervisor | HR | Admin |
|--------|----------|------------|----|-------|
| Open `/employee/new`, submit | ✅ own | ❌ | ❌ | ❌ |
| Sign / Reject | ❌ | ✅ row names me **and** `PENDING_SUPERVISOR` | ❌ | ❌ |
| Send to HR | ✅ my row **and** `SIGNED` | ❌ | ❌ | ❌ |
| Approve / Reject | ❌ | ❌ | ✅ any officer, at `PENDING_HR` | ❌ |
| Read a request detail | ✅ own | ✅ named rows | ✅ rows that reached HR | ✅ everything |
| Change a stored field | ❌ | only their decision (LR-3) | only their decision (LR-3) | ❌ |

## 5. Where the code lives

*(Login §5's "Nothing else in `src/` changes" was scoped to the login
build; this table is the leave module's addition on top of it.)*

| Folder / file | What's in it |
|---------------|--------------|
| `prisma/schema.prisma` | Add `LeaveType`, `LeaveRequestStatus` enums + `LeaveRequest` model (§1) with the three indexes |
| `src/lib/leave.ts` | Pure helpers, unit-testable without a browser: `daysInclusive`, text-limit validators (LR-5), the LR-3 transition table, `allowedActions(user, request)`, and the LR-8 scoped list queries |
| `src/app/leave/actions.ts` | The six server actions |
| `src/app/employee/page.tsx` | Real employee home (button + two lists) |
| `src/app/employee/new/page.tsx` | The request form |
| `src/app/supervisor/page.tsx` | Real supervisor home |
| `src/app/hr/page.tsx` | Real HR home |
| `src/app/admin/page.tsx` | Real admin table |
| `src/app/requests/[id]/page.tsx` | Shared detail page + action area |
| `src/components/RequestForm.tsx` | Form with client hints, posting to `submitRequest` |
| `src/components/RequestList.tsx` | One list section (To act on / History), reused four times |
| `src/components/StatusBadge.tsx` | The coloured status pill |
| `src/components/DecisionButton.tsx` | Confirm-dialog button posting an action (LR-10) |
| `src/components/AppShell.tsx` | Grows the success-notice map (§4 above) |
| `prisma/seed.ts` | **Unchanged** — the six users only; leave rows come from the UI so they follow the real rules |

## 6. Security (in plain words)

Follows brief §7.5 / OWASP Top 10 2025, on top of the login §6 claims.

- **Role checks on every page and again inside every action**
  (`requireRole` first in all six actions) — hiding buttons is decoration,
  the check is the gate (A01).
- **Per-row permission checks** (LR-4): an attacker cannot act on a
  request that does not name them, whichever id they guess.
- **The LR-3 table is server-side**: forged ids, statuses or timestamps
  in a POST are re-derived from the session and the database, never from
  the form (A01).
- **Field rules re-run on the server** (LR-5/6); client hints are UX only
  (A05).
- **Remarks render as plain text** through React escaping, never HTML
  (A03/A05); all data access via Prisma (A03).
- **Read scope is the query** (LR-8): a page that must not see a row does
  not even fetch it.
- **Demo data only**; no real personal data anywhere.

## 7. Commands

The login §7 table still applies. Setting up this module adds two steps:
`npx prisma db push` (creates the two enums' backing columns and the
`LeaveRequest` table) and seeding demo requests **through the UI**, not
the seed script.
