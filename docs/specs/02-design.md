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
