// prisma — singleton Prisma client shared across all API route handlers.
// A single instance is created and reused rather than opening a new database
// connection on every request. In development, the instance is attached to
// the global object to survive Next.js hot reloads — without this, each
// file change would leak a new connection and eventually exhaust the pool.
// In production, module-level caching handles this naturally so the global
// is not needed. Requires DATABASE_URL to be set in .env.local.
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
