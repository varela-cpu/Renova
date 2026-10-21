import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Cliente Prisma con driver adapter de Neon (HTTP, ideal para Vercel serverless).
 * Si no hay DATABASE_URL se devuelve null y la app usa el datasource local en JSON.
 */
let client: PrismaClient | null = null;
let attempted = false;

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrisma(): PrismaClient | null {
  if (!hasDatabaseUrl()) return null;
  if (!client && !attempted) {
    attempted = true;
    const adapter = new PrismaNeon({
      connectionString: process.env.DATABASE_URL as string,
    });
    client = new PrismaClient({ adapter });
  }
  return client;
}
