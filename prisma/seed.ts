import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_SETTINGS } from "../src/lib/domain";
import {
  seedEmployees,
  seedMaterials,
  seedProducts,
  seedResources,
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
    await prisma.material.create({
      data: {
        id: material.id,
        name: material.name,
        supplier: material.supplier,
        reference: material.reference,
        unit: material.unit,
        compositionPct: material.compositionPct,
        unitsPerProduct: material.unitsPerProduct,
        unitCost: material.unitCost,
        isPackaging: material.isPackaging,
        sortOrder: material.sortOrder,
      },
    });
  }

  for (const employee of seedEmployees) {
    await prisma.employee.create({
      data: {
        id: employee.id,
        position: employee.position,
        contractType: employee.contractType,
        headcount: employee.headcount,
        baseSalary: employee.baseSalary,
        benefitsPct: employee.benefitsPct,
        sortOrder: employee.sortOrder,
      },
    });
  }

  for (const resource of seedResources) {
    await prisma.resource.create({
      data: {
        id: resource.id,
        kind: resource.kind,
        concept: resource.concept,
        detail: resource.detail,
        value: resource.value,
        recurrence: resource.recurrence,
        sortOrder: resource.sortOrder,
      },
    });
  }

  for (const product of seedProducts) {
    await prisma.product.create({
      data: {
        id: product.id,
        code: product.code,
        name: product.name,
        weightKg: product.weightKg,
        pvp: product.pvp,
      },
    });
  }

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.create({
      data: { key, value: JSON.stringify(value) },
    });
  }

  console.log("Semilla RENOVA cargada correctamente.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
