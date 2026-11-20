// Loads the six demo people from the brief §7.2 (design Reference B).
// Re-running is safe: users are upserted by email, so no duplicates.
// Demo data only — made-up names and IC numbers, never real personal data.
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEMO_PASSWORD = "password123";

type DemoUser = {
  email: string;
  name: string;
  icNo: string;
  role: Role;
  division: string;
  designation: string;
};

const DEMO_USERS: DemoUser[] = [
  {
    email: "employee-1@budiman.com",
    name: "Employee 1",
    icNo: "00-148888",
    role: Role.EMPLOYEE,
    division: "Finance",
    designation: "Accounts Clerk",
  },
  {
    email: "supervisor-1@budiman.com",
    name: "Supervisor 1",
    icNo: "00-157777",
    role: Role.SUPERVISOR,
    division: "Finance",
    designation: "Finance Manager",
  },
  {
    email: "supervisor-2@budiman.com",
    name: "Supervisor 2",
    icNo: "00-166666",
    role: Role.SUPERVISOR,
    division: "Finance",
    designation: "Accountant",
  },
  {
    email: "hr-1@budiman.com",
    name: "HR 1",
    icNo: "00-175555",
    role: Role.HR,
    division: "Human Resources",
    designation: "HR Officer",
  },
  {
    email: "hr-2@budiman.com",
    name: "HR 2",
    icNo: "00-184444",
    role: Role.HR,
    division: "Human Resources",
    designation: "HR Officer",
  },
  {
    email: "admin@budiman.com",
    name: "Admin",
    icNo: "00-193333",
    role: Role.ADMIN,
    division: "Admin",
    designation: "Admin Manager",
  },
];

async function main() {
  // One hash is enough: every demo account shares the password.
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const user of DEMO_USERS) {
    await db.user.upsert({
      where: { email: user.email },
      update: { ...user, password: passwordHash },
      create: { ...user, password: passwordHash },
    });
  }
  const count = await db.user.count();
  console.log(`Seeded ${count} users (re-run safe, upsert by email).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
