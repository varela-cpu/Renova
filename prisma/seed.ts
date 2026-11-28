import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_SETTINGS } from "../src/lib/domain";
import {
  seedEmployees,
  seedMaterials,
  seedProducts,
  seedResources,
  seedSettings,
} from "../src/lib/seed-data";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.setting.deleteMany();
  await prisma.product.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.material.deleteMany();

  for (const material of seedMaterials) {
    await prisma.material.create({ data: { ...material } });
  }
  for (const employee of seedEmployees) {
    await prisma.employee.create({ data: { ...employee } });
  }
  for (const resource of seedResources) {
    await prisma.resource.create({ data: { ...resource } });
  }
  for (const product of seedProducts) {
    await prisma.product.create({ data: { ...product } });
  }
  const settings = { ...DEFAULT_SETTINGS, ...seedSettings };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.create({ data: { key, value: JSON.stringify(value) } });
  }
  console.log("Semilla RENOVA cargada correctamente.");
}

main()
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
