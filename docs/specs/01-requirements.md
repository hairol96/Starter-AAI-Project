# Login – Requirements

> **This file answers:** What should the app do, and why?
> **Who:** The AI drafts it from your interview. You review it.
>
> When the app's behaviour needs to change, update this file **first**.
>
> Scope of this file: **login and access control only** (FR-01, FR-10 of the
> brief). The leave request flow gets its own spec later.

## 1. The problem

Budiman Company's leave process is on paper, and the replacement app must
know exactly who is looking at it: an employee, a supervisor, an HR officer,
or the admin. If anyone could open any page, the supervisor's signature and
the HR decision would be worthless. This module is the gate: nobody uses the
system until the system knows who they are and what role they hold.

This module provides:

1. A login page where a user signs in with their work email and password
2. Four role-specific home pages that only that role can open
3. A signed session cookie that remembers who is logged in for 12 hours
4. A role check on every page, enforced on the server, not just in the menu
5. A logout action that ends the session
6. Six demo accounts loaded by a seed script, passwords stored hashed

## 2. Who uses it (roles)

| Role | Home page | What they do |
|------|-----------|--------------|
| **Employee** | `/employee` | Signs in, sees the employee home page; cannot open any other role's pages |
| **Supervisor** | `/supervisor` | Signs in, sees the supervisor home page; cannot open any other role's pages |
| **HR** | `/hr` | Signs in, sees the HR home page; cannot open any other role's pages |
| **Admin** | `/admin` | Signs in, sees the admin home page; cannot open any other role's pages |
| **Logged-out visitor** | `/login` | Sees only the login page; every other page redirects here |

Every account has exactly one role (brief §7.2). Demo accounts and the
shared password `password123` are the ones in brief §7.2:
`employee-1@`, `supervisor-1@`, `supervisor-2@`, `hr-1@`, `hr-2@`,
`admin@budiman.com`.

## 3. User stories

- **U1. Sign in** *(High)*. As any user, I can log in with my `@budiman.com` email and my password so that I can use the system. (FR-01)
- **U2. Land on my own home page** *(High)*. As any user, I am taken straight to my role's home page after login so that I start on the page meant for me, without typing a URL.
- **U3. Clear failure, no leaks** *(High)*. As any user, I get one generic "Invalid email or password" message when a login fails — the app never says whether the email exists or which field was wrong — so that nobody can probe the system for registered accounts.
- **U4. Stay in my lane** *(High)*. As a logged-in user, I am bounced to my own home page with a "not authorized" notice if I try to open another role's page, so that each person only ever sees what they are allowed to act on. (FR-01, §7.5)
- **U5. No entry without a session** *(High)*. As a logged-out visitor, any URL I open is redirected to `/login`, so that no data is ever shown without a valid session.
- **U6. End my session** *(High)*. As any user, I can log out so that the next person at my computer is not left signed in as me.
- **U7. Seed the demo people** *(High)*. As a developer or tester, I can run one seed command so that the six demo accounts from §7.2 exist with hashed passwords and everyone tests with the same logins.
- **U8. Forgiving email field** *(Medium)*. As any user, my email is trimmed and matched case-insensitively, so that ` Employee-1@Budiman.com ` still logs me in.
- **U9. Sessions expire** *(Medium)*. As the company, a session lasts at most 12 hours, so that an unattended laptop cannot stay signed in indefinitely.
- **U10. Passwords are never plain text** *(High)*. As the company, passwords are stored only as bcrypt hashes, so that a stolen database file does not expose anyone's password. (FR-10, §7.5)

## 4. Acceptance checklist

| Status | ID | Check | How to test |
|--------|----|-------|-------------|
| Done | AC-01 | Correct email + password logs in and opens that role's home page (U1, U2) | • Go to `/login`<br>• Sign in as `employee-1@budiman.com` / `password123`<br>• You should land on `/employee` |
| Done | AC-02 | Every role lands on its own home page (U2) | • Sign in as each of the six demo accounts in turn<br>• `supervisor-1@` and `supervisor-2@` → `/supervisor`<br>• `hr-1@` and `hr-2@` → `/hr`<br>• `admin@` → `/admin`<br>• Each should see its own home page, no errors |
| Done | AC-03 | Wrong credentials give one identical generic message; no lockout (U3) | • Try `employee-1@budiman.com` / `wrongpass` → "Invalid email or password"<br>• Try `nosuch@budiman.com` / `password123` → the exact same message<br>• Repeat 5 times → still allowed to try; no lockout message |
| Done | AC-04 | Logged-out visitors can reach no page but `/login` (U5) | • With no session (private window), open `/employee`, `/supervisor`, `/hr`, `/admin`<br>• Each should redirect to `/login` with no data shown |
| Done | AC-05 | A role cannot open another role's pages — even by typing the URL (U4) | • Sign in as `employee-1@budiman.com`<br>• Type `/admin` in the address bar<br>• You should land back on `/employee` with a "not authorized" notice, and never see admin content |
| Done | AC-06 | Logout ends the session (U6) | • Sign in as `hr-1@budiman.com`<br>• Click **Sign out** → you should be at `/login`<br>• Press the browser Back button or reload `/hr` → you should be redirected to `/login` |
| Done | AC-07 | The six demo accounts exist after seeding, with hashed passwords (U7, U10) | • Run the seed command<br>• Open the SQLite file (e.g. `sqlite3` → `SELECT email, password FROM User;`)<br>• You should see the six §7.2 emails, and each password value starts with `$2b$` (a bcrypt hash), never `password123` |
| Done | AC-08 | Email is trimmed and case-insensitive (U8) | • Sign in as ` Employee-1@Budiman.com ` (extra spaces and capitals)<br>• You should land on `/employee` |
| Done | AC-09 | Sessions expire after 12 hours (U9) | • Sign in, then move the system clock forward ~13 hours (or set the cookie's expiry in devtools to the past)<br>• Reload `/employee` → you should be redirected to `/login` |

## 5. Not included (for now)

- Sign-up page — accounts exist only through the seed script (interview A8)
- Password reset or "forgot password" — out of scope; demo password is fixed
- "Remember me" — sessions are always 12 hours (interview A3)
- Account lockout after failed attempts — generic error only (interview A2)
- Login by IC number — email only (interview A1)
- Return-to-original-page after login — always land on the role's home page (interview A5)
- The leave request screens themselves — separate spec
