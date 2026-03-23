import path from "path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const connectionString = `file:${dbPath}`;
  
  // W Prisma 7 adapter przyjmuje obiekt konfiguracyjny z kluczem 'url'.
  // Dodanie prefiksu 'file:' może być kluczowe dla poprawnego parsowania.
  const adapter = new PrismaBetterSqlite3({
    url: connectionString,
  });

  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
