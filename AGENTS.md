# Budiman HRMS – Leave Request module

Project rules. Read these before writing any code.

## What this is
A web app that replaces Budiman Company's paper leave forms. Employees
submit leave requests, their supervisor signs or rejects them, then HR
approves or rejects them. An admin views every record, read-only. Statuses:
Pending supervisor → Signed → Pending HR → Approved, or Rejected by
supervisor/HR (a reason is always required). The full brief is
`docs/Agentic AI - HRMS Doc.pdf`.

## Built with
Next.js 16 (App Router) with TypeScript, Tailwind CSS, SQLite through
Prisma, server actions for forms, signed session cookies, passwords hashed
with bcryptjs. Nothing is wired up yet: the app is a blank page and Prisma
has no schema.

## Run it
- `npm install` then `npm run dev` — opens at http://localhost:3000
- Needs Node 20.9+

## Where things live
- `docs/Agentic AI - HRMS Doc.pdf` — the brief: roles, rules, data tables (§7.2)
- `docs/templates/` — blank spec files to copy
- `docs/specs/` — the filled-in specs (empty until written)
- `src/app/` — all screens and server actions

## How to work
- Spec-driven: write and approve `01-requirements.md`, then `02-design.md`,
  then `03-tasks.md` in `docs/specs/`, and build only from the specs. If
  something is wrong, fix the spec first, then the code.
- Build one task at a time, in order, High priority first. Login comes first.
- Follow the security rules in §7.5 of the brief (OWASP Top 10): check the
  role on every page and again on the server; never store plain passwords.
- Demo accounts are in §7.2 of the brief, password `password123`. Made-up
  names only; never add real personal data.
- Every commit message uses Conventional Commits: `type: short description`,
  for example `feat: add login page`. Common types: feat, fix, docs,
  refactor, test, chore.
- Ask before committing. Commit small, once per finished task.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
