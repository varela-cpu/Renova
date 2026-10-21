import { getPrisma, hasDatabaseUrl } from "./db";
import { JsonRepository } from "./json-repository";
import { PrismaRepository } from "./prisma-repository";
import type { Repository } from "./repository";

let repository: Repository | null = null;

/**
 * Devuelve el repositorio activo.
 * - Con DATABASE_URL -> Postgres (Neon) vía Prisma.
 * - Sin DATABASE_URL -> datasource local en data/renova.json.
 */
export function getRepository(): Repository {
  if (repository) return repository;
  const prisma = getPrisma();
  repository = prisma
    ? new PrismaRepository(prisma)
    : new JsonRepository();
  return repository;
}

export function repositoryKind(): "postgres" | "local" {
  return hasDatabaseUrl() ? "postgres" : "local";
}

export * from "./repository";
