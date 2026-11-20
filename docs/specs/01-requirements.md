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

---

# Leave Requests – Requirements

> **This file answers:** What should the leave request module do, and how do
> I check it?
> **Who:** The AI drafted it from the brief and the interview answers
> **L1–L8** (20/11/26). You review it.
>
> When the app's behaviour needs to change, update this file **first**.
>
> Scope of this section: **the leave request flow** (brief §5, FR-02 … FR-09).
> Login and access control stay as agreed in the section above — untouched.
> IDs continue from there: stories **U11+**, checks **AC-10+**. Where the
> brief left something open (§7.2 "the exact fields are decided in the
> specifications"), the interview answers settle it, quoted as L1–L8:
> L1 employees only submit · L2 calendar-date rules · L3 no balances ·
> L4 write-once requests · L5 rejections final · L6 overlaps allowed ·
> L7 role lists and sorting · L8 text rules.

## 1. The problem

Budiman Company's leave process is paper: fill a form, hand it to the
supervisor, HR retypes it into a spreadsheet. Forms get lost, employees
cannot see where their request is, and HR has no single waiting list
(brief §2). This section turns that paper flow into records:

1. The employee's paper form becomes one screen — the request is in the
   system from the moment it is submitted (goal 1).
2. Each role gets exactly the list they must act on, nothing else (goal 2).
3. Every step — submit, sign, send, decide — is stored with who and when,
   so nothing gets lost (goal 3).

## 2. Who uses it (roles)

| Role | What they do with requests |
|------|----------------------------|
| **Employee** | The only role that submits a request (L1, brief §5.3 rule 2). Submits, tracks its status, sends a signed request to HR |
| **Supervisor** | Signs or rejects requests where they are the named supervisor; a rejection needs a remark. Never submits |
| **HR** | Approves or rejects the requests in the shared queue; a rejection needs a remark; the officer who decides is recorded. Never submits |
| **Admin** | Sees every record, changes nothing (FR-08) |

## 3. User stories

- **U11. Submit a request** *(High)*. As an employee, I fill in one form — leave type, start and end date, and a supervisor **chosen from my own division** — and submit, so my paper form becomes a record that exists from that moment. The supervisor dropdown lists only SUPERVISOR users of my division (server re-checks it too). (FR-02, L1)
  *Try by hand:* sign in as `employee-1@budiman.com`, open **New request** — the supervisor picker shows only Supervisor 1 and Supervisor 2 (Finance). Submit Annual leave, 1 Dec–5 Dec.
- **U12. "Other" must explain itself** *(High)*. As an employee, when I pick leave type **Other** I must describe it (3–100 characters); the description box appears only for Other. (§7.2, L8)
  *Try by hand:* pick Other, submit with a blank description → blocked, my values are kept; type "Moving house" → submits.
- **U13. Dates behave** *(High)*. As an employee, the end date cannot be before the start date, one-day leave (start = end) is fine, past dates are allowed, and the form shows the number of leave days automatically — calendar days, counted inclusively, no weekend or holiday calendar. (L2)
  *Try by hand:* enter start 9 Dec, end 5 Dec → blocked with a plain message; 1 Dec–5 Dec → the form says **5 days**; 4 Dec–4 Dec → **1 day**.
- **U14. The supervisor decides** *(High)*. As a supervisor, I sign a request sent to me or reject it **with a remark** (3–500 characters, required — no way to reject without a reason). The employee sees my remark. (FR-03)
  *Try by hand:* as `supervisor-1@budiman.com`, open a Pending supervisor request, Reject with a blank remark → blocked; reject with "Team busy that week" → the employee now sees Rejected by supervisor and that exact remark.
- **U15. The employee sends it on** *(High)*. As an employee, once my request is **Signed** I send it to the shared HR queue. The **Send to HR** button appears only on my Signed requests — on the request's detail page; action buttons live only there. (FR-04)
  *Try by hand:* have the supervisor sign one request; it appears under "To act on" on `/employee`; open it → **Send to HR**; press it → Pending HR and it has left "To act on".
- **U16. HR decides and is on record** *(High)*. As an HR officer, I approve or reject any request in the queue — either officer can act — and a rejection needs a remark (3–500). The system records **which officer decided** and when. (FR-05, §5.3 rule 5)
  *Try by hand:* sign in as `hr-2@budiman.com` (not the officer who handled the last one), approve a queued request; open the request and it shows **Approved — HR 2** with the date.
- **U17. Everyone sees the right list** *(High)*. Each role's home page shows **To act on** and **History**, with status and remarks: employee → own requests; supervisor → only requests naming them; HR → the shared queue plus what passed through HR; queues are **oldest submitted first**, history **newest first**; no pagination at demo size. (FR-06, L7)
  *Try by hand:* with one request sitting Pending supervisor for Supervisor 1, `/supervisor` for Supervisor 2 shows an empty queue; both HR accounts see the same queue once it is sent.
- **U18. Confirm, then celebrate** *(High)*. Every action — submit, sign, supervisor reject, send to HR, HR approve, HR reject — asks **Are you sure?** first and shows a **success message** afterwards. (FR-07)
  *Try by hand:* click Reject, cancel the confirmation → the request is untouched and shows no success message; confirm → banner "Request rejected" and the new status.
- **U19. Requests are write-once** *(High)*. Nobody edits or cancels a submitted request, nobody undoes a decision, and a rejection is final — trying again means a brand-new request. There is no Edit, Delete, Reopen or Undo button anywhere in the module, in any status. (L4, L5)
  *Try by hand:* open a request in each of the six statuses and hunt for an Edit/Delete/Reopen control — there is none; re-approve an Approved request's URL → the server refuses.
- **U20. My lane, enforced twice** *(High)*. The menu is decoration; the server is the gate: a supervisor cannot open or act on another supervisor's request, an employee cannot touch someone else's request, and non-employees cannot submit — even by typing URLs or forging action calls. (§5.3, §7.5)
  *Try by hand:* signed in as Supervisor 2, type the URL of Supervisor 1's request detail → bounced to `/supervisor` with the not-authorized banner, no content shown.
- **U21. The server checks everything** *(High)*. Every field rule (required text, lengths, dates, status transitions) is enforced again on the server, never trusted from the browser; remarks and descriptions are stored and displayed as plain text. (FR-10, L8, §7.5)
  *Try by hand:* with devtools, submit a forged request with end before start, or a rejection with a blank remark, or `<script>alert(1)</script>` as a remark → the first two are refused; the third shows as literal text, never runs.
- **U22. The admin sees it all** *(Medium)*. As the admin, I see **every** leave record — including requests a supervisor rejected that HR never saw — with status, remarks and dates, and **no buttons at all**. (FR-08)
  *Try by hand:* sign in as `admin@budiman.com` after a supervisor rejection; the record is in the table, the page has zero action controls.
- **U23. Nice ideas queue up** *(Low)*. As the team, any idea not in this spec (balances, email notifications, export, paging…) is written into a spec **before** it is built — nothing is built on a whim. (FR-09)
  *Try by hand:* process rule, nothing to click.

## 4. Acceptance checklist

| Status | ID | Check | How to test |
|--------|----|-------|-------------|
| Done | AC-10 | An employee submits; the supervisor picker offers only SUPERVISOR users of their own division (U11) | • As `employee-1@` (Finance) open New request<br>• Dropdown lists exactly Supervisor 1 and Supervisor 2<br>• Submit Annual leave 1 Dec–5 Dec → appears on `/employee` as Pending supervisor |
| Done | AC-11 | Other requires a 3–100 char description; the field only shows for Other (U12) | • Choose Other, blank description → blocked, value kept<br>• "Moving house" → submits<br>• Switch back to Annual leave → description box hidden and not required |
| Done | AC-12 | End ≥ start, same day = 1 day, day count shown inclusive of calendar days (U13) | • Start 9 Dec / end 5 Dec → refused with a message<br>• 1–5 Dec → "5 days" shown live<br>• 4–4 Dec → "1 day" |
| Done | AC-13 | Sign sets status Signed with a success message and a signed date (U14, U18) | • As Supervisor 1, Sign a queued request → banner + status Signed, signed date visible |
| Done | AC-14 | Supervisor rejection requires a 3–500 char remark; the employee sees it; the status is final (U14, U19) | • Reject with blank → blocked<br>• "Team busy" → Rejected by supervisor; employee's History shows that remark<br>• No path to reverse it |
| Done | AC-15 | Send to HR only from Signed, by the owning employee; lands in the HR queue (U15) | • Open a Signed request from "To act on" → **Send to HR** on its detail page; press → Pending HR<br>• Open requests in every other status (Pending supervisor, Approved…) → no button |
| Done | AC-16 | HR approves or rejects; rejection needs a remark; the deciding officer is recorded; either officer can act (U16) | • `hr-1@` rejects blank → blocked; rejects with remark → Rejected by HR, "HR 1" recorded<br>• `hr-2@` approves another → Approved, "HR 2" recorded |
| Done | AC-17 | Supervisor queue = only requests naming them, oldest first; history newest first (U17) | • Two requests, one for each supervisor → each queue shows exactly its own, oldest at top<br>• Supervisor 2's list stays empty while Supervisor 1 works |
| Done | AC-18 | HR queue shared by both officers, oldest first; HR history = Approved / Rejected by HR only; supervisor rejections hidden from HR (U16, U17) | • Both HR accounts see the same queue<br>• After decisions, history lists them newest first<br>• A supervisor-rejected request is nowhere in HR's pages |
| Done | AC-19 | Employee sees only their own requests; To act on = their Signed ones only (U17) | • Hand a request to another user by hand: `UPDATE LeaveRequest SET employeeId=<another user id>` in SQLite → the row vanishes from `/employee` (role scoping means it appears in no one's list but the admin's)<br>• Restore the old value → the row is back<br>• "To act on" lists exactly the Signed requests awaiting send |
| Done | AC-20 | Every action confirms first, succeeds with a message; cancelling the confirm changes nothing (U18) | • For each of the six action buttons (submit, sign, supervisor reject, send to HR, HR approve, HR reject): open it, cancel the confirm → status unchanged, no success banner<br>• Repeat, confirm → success banner shown |
| Done | AC-21 | No edit / cancel / undo / reopen in any status; decisions and rejections are final (U19) | • Walk all six statuses — no such button anywhere<br>• Re-send an Approved request's action URL → refused |
| Done | AC-22 | Cross-role access and forged action calls are refused server-side (U20) | • Supervisor 2 opens Supervisor 1's request URL → bounced, not-authorized banner<br>• Employee posts a forged HR approve → refused<br>• Supervisor posts to the submit action → refused |
| Done | AC-23 | Server-side field rules hold; remarks render as plain text (U21) | • Forge a POST with end < start / blank remark → refused<br>• Remark `<script>alert(1)</script>` renders as literal text |
| Done | AC-24 | Admin table lists every record, including supervisor rejections, read-only (U22) | • After a supervisor rejection, `admin@` sees that row<br>• Zero action buttons; typed action URLs refuse |

## 5. Not included (for now)

- Leave balances and entitlements — approvers are the human control; the
  stored data allows adding balance reports later without migration (L3)
- Weekend / public-holiday calendars — days are plain inclusive calendar
  days (L2)
- Editing, cancelling, undoing, reopening — excluded by design (L4, L5, U19)
- Overlap or duplicate blocking — approvers spot duplicates and reject
  with a remark (L6)
- Supervisors and HR submitting their own leave — employees only (L1)
- Anything not in this section (notifications, attachments, export,
  pagination, filters) — FR-09 / U23: spec first, then build
