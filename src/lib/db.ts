import { PrismaClient } from "@prisma/client";

// One Prisma client for the whole server; the global stash keeps
// `next dev` hot-reloads from opening a new connection each rebuild.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
