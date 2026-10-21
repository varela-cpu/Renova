import type { PrismaClient } from "@/generated/prisma/client";
import type {
  Employee,
  Material,
  Product,
  Resource,
  Settings,
} from "@/lib/domain";
import { DEFAULT_SETTINGS } from "@/lib/domain";
import {
  seedEmployees,
  seedMaterials,
  seedProducts,
  seedResources,
  seedSettings,
} from "@/lib/seed-data";
import type {
  Dataset,
  EmployeeInput,
  MaterialInput,
  ProductInput,
  Repository,
  ResourceInput,
} from "./repository";

function toMaterial(row: {
  id: string;
  name: string;
  supplier: string;
  reference: string;
  unit: string;
  compositionPct: number | null;
  unitsPerProduct: number;
  unitCost: number;
  isPackaging: boolean;
  sortOrder: number;
}): Material {
  return { ...row };
}

function toEmployee(row: {
  id: string;
  position: string;
  contractType: string;
  headcount: number;
  baseSalary: number;
  benefitsPct: number;
  sortOrder: number;
}): Employee {
  return { ...row };
}

function toResource(row: {
  id: string;
  kind: string;
  concept: string;
  detail: string;
  value: number;
  recurrence: string;
  sortOrder: number;
}): Resource {
  return {
    ...row,
    kind: row.kind as Resource["kind"],
    recurrence: row.recurrence as Resource["recurrence"],
  };
}

/** Implementación sobre Postgres (Neon) mediante Prisma. */
export class PrismaRepository implements Repository {
  readonly kind = "postgres";

  constructor(private readonly prisma: PrismaClient) {}

  async listMaterials(): Promise<Material[]> {
    const rows = await this.prisma.material.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return rows.map(toMaterial);
  }

  async listEmployees(): Promise<Employee[]> {
    const rows = await this.prisma.employee.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return rows.map(toEmployee);
  }

  async listResources(): Promise<Resource[]> {
    const rows = await this.prisma.resource.findMany({
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
    });
    return rows.map(toResource);
  }

  async listProducts(): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({
      orderBy: { weightKg: "desc" },
    });
    return rows;
  }

  async getSettings(): Promise<Settings> {
    const rows = await this.prisma.setting.findMany();
    const map: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        map[row.key] = JSON.parse(row.value);
      } catch {
        map[row.key] = row.value;
      }
    }
    return { ...DEFAULT_SETTINGS, ...(map as Partial<Settings>) };
  }

  async saveMaterial(input: MaterialInput): Promise<Material> {
    const data = {
      name: input.name,
      supplier: input.supplier,
      reference: input.reference,
      unit: input.unit,
      compositionPct: input.compositionPct,
      unitsPerProduct: input.unitsPerProduct,
      unitCost: input.unitCost,
      isPackaging: input.isPackaging,
      sortOrder: input.sortOrder,
    };
    if (input.id) {
      const row = await this.prisma.material.update({
        where: { id: input.id },
        data,
      });
      return toMaterial(row);
    }
    const row = await this.prisma.material.create({ data });
    return toMaterial(row);
  }

  async deleteMaterial(id: string): Promise<void> {
    await this.prisma.material.delete({ where: { id } });
  }

  async saveEmployee(input: EmployeeInput): Promise<Employee> {
    const data = {
      position: input.position,
      contractType: input.contractType,
      headcount: input.headcount,
      baseSalary: input.baseSalary,
      benefitsPct: input.benefitsPct,
      sortOrder: input.sortOrder,
    };
    if (input.id) {
      const row = await this.prisma.employee.update({
        where: { id: input.id },
        data,
      });
      return toEmployee(row);
    }
    const row = await this.prisma.employee.create({ data });
    return toEmployee(row);
  }

  async deleteEmployee(id: string): Promise<void> {
    await this.prisma.employee.delete({ where: { id } });
  }

  async saveResource(input: ResourceInput): Promise<Resource> {
    const data = {
      kind: input.kind,
      concept: input.concept,
      detail: input.detail,
      value: input.value,
      recurrence: input.recurrence,
      sortOrder: input.sortOrder,
    };
    if (input.id) {
      const row = await this.prisma.resource.update({
        where: { id: input.id },
        data,
      });
      return toResource(row);
    }
    const row = await this.prisma.resource.create({ data });
    return toResource(row);
  }

  async deleteResource(id: string): Promise<void> {
    await this.prisma.resource.delete({ where: { id } });
  }

  async saveProduct(input: ProductInput): Promise<Product> {
    const data = {
      code: input.code,
      name: input.name,
      weightKg: input.weightKg,
      pvp: input.pvp,
    };
    if (input.id) {
      return this.prisma.product.update({ where: { id: input.id }, data });
    }
    return this.prisma.product.create({ data });
  }

  async deleteProduct(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  async saveSettings(settings: Settings): Promise<Settings> {
    const entries = Object.entries(settings);
    await this.prisma.$transaction(
      entries.map(([key, value]) =>
        this.prisma.setting.upsert({
          where: { key },
          create: { key, value: JSON.stringify(value) },
          update: { value: JSON.stringify(value) },
        }),
      ),
    );
    return settings;
  }

  async reset(): Promise<Dataset> {
    await this.prisma.$transaction([
      this.prisma.material.deleteMany(),
      this.prisma.employee.deleteMany(),
      this.prisma.resource.deleteMany(),
      this.prisma.product.deleteMany(),
      this.prisma.setting.deleteMany(),
    ]);

    await this.prisma.material.createMany({ data: seedMaterials });
    await this.prisma.employee.createMany({ data: seedEmployees });
    await this.prisma.resource.createMany({ data: seedResources });
    await this.prisma.product.createMany({ data: seedProducts });
    await this.prisma.setting.createMany({
      data: Object.entries(seedSettings).map(([key, value]) => ({
        key,
        value: JSON.stringify(value),
      })),
    });

    return {
      materials: seedMaterials,
      employees: seedEmployees,
      resources: seedResources,
      products: seedProducts,
      settings: seedSettings,
    };
  }
}
