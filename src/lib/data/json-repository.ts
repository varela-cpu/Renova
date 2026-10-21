import fs from "node:fs";
import path from "node:path";
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

const DATA_DIR = process.env.RENOVA_DATA_DIR ?? "data";
const DATA_FILE = `${DATA_DIR}/renova.json`;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function seedDataset(): Dataset {
  return {
    materials: clone(seedMaterials),
    employees: clone(seedEmployees),
    resources: clone(seedResources),
    products: clone(seedProducts),
    settings: clone(seedSettings),
  };
}

/**
 * Datasource local en archivo JSON.
 * Permite desarrollar y demostrar la app sin tener Postgres configurado.
 * En Vercel (sin DATABASE_URL) las escrituras no persisten.
 */
export class JsonRepository implements Repository {
  readonly kind = "local";

  private cache: Dataset | null = null;

  private filePath(): string {
    return path.join(process.cwd(), DATA_FILE);
  }

  private load(): Dataset {
    if (this.cache) return this.cache;
    try {
      if (fs.existsSync(this.filePath())) {
        const raw = fs.readFileSync(this.filePath(), "utf8");
        const parsed = JSON.parse(raw) as Partial<Dataset>;
        this.cache = {
          materials: parsed.materials ?? clone(seedMaterials),
          employees: parsed.employees ?? clone(seedEmployees),
          resources: parsed.resources ?? clone(seedResources),
          products: parsed.products ?? clone(seedProducts),
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
        };
        return this.cache;
      }
    } catch {
      // si el archivo esta corrupto se regenera desde la semilla
    }
    this.cache = seedDataset();
    this.persist();
    return this.cache;
  }

  private persist(): void {
    if (!this.cache) return;
    try {
      fs.mkdirSync(path.dirname(this.filePath()), { recursive: true });
      fs.writeFileSync(
        this.filePath(),
        JSON.stringify(this.cache, null, 2),
        "utf8",
      );
    } catch (error) {
      console.warn(
        "[renova] no se pudo guardar el datasource local (sistema de archivos de solo lectura):",
        error instanceof Error ? error.message : error,
      );
    }
  }

  async listMaterials(): Promise<Material[]> {
    return clone(this.load().materials);
  }

  async listEmployees(): Promise<Employee[]> {
    return clone(this.load().employees);
  }

  async listResources(): Promise<Resource[]> {
    return clone(this.load().resources);
  }

  async listProducts(): Promise<Product[]> {
    return clone(this.load().products);
  }

  async getSettings(): Promise<Settings> {
    return clone(this.load().settings);
  }

  async saveMaterial(input: MaterialInput): Promise<Material> {
    const data = this.load();
    const id = input.id ?? `mat-${Date.now().toString(36)}`;
    const record: Material = { ...input, id };
    const index = data.materials.findIndex((m) => m.id === id);
    if (index >= 0) data.materials[index] = record;
    else data.materials.push(record);
    this.persist();
    return clone(record);
  }

  async deleteMaterial(id: string): Promise<void> {
    const data = this.load();
    data.materials = data.materials.filter((m) => m.id !== id);
    this.persist();
  }

  async saveEmployee(input: EmployeeInput): Promise<Employee> {
    const data = this.load();
    const id = input.id ?? `emp-${Date.now().toString(36)}`;
    const record: Employee = { ...input, id };
    const index = data.employees.findIndex((e) => e.id === id);
    if (index >= 0) data.employees[index] = record;
    else data.employees.push(record);
    this.persist();
    return clone(record);
  }

  async deleteEmployee(id: string): Promise<void> {
    const data = this.load();
    data.employees = data.employees.filter((e) => e.id !== id);
    this.persist();
  }

  async saveResource(input: ResourceInput): Promise<Resource> {
    const data = this.load();
    const id = input.id ?? `res-${Date.now().toString(36)}`;
    const record: Resource = { ...input, id };
    const index = data.resources.findIndex((r) => r.id === id);
    if (index >= 0) data.resources[index] = record;
    else data.resources.push(record);
    this.persist();
    return clone(record);
  }

  async deleteResource(id: string): Promise<void> {
    const data = this.load();
    data.resources = data.resources.filter((r) => r.id !== id);
    this.persist();
  }

  async saveProduct(input: ProductInput): Promise<Product> {
    const data = this.load();
    const id = input.id ?? `prd-${Date.now().toString(36)}`;
    const record: Product = { ...input, id };
    const index = data.products.findIndex((p) => p.id === id);
    if (index >= 0) data.products[index] = record;
    else data.products.push(record);
    this.persist();
    return clone(record);
  }

  async deleteProduct(id: string): Promise<void> {
    const data = this.load();
    data.products = data.products.filter((p) => p.id !== id);
    this.persist();
  }

  async saveSettings(settings: Settings): Promise<Settings> {
    const data = this.load();
    data.settings = { ...settings };
    this.persist();
    return clone(data.settings);
  }

  async reset(): Promise<Dataset> {
    this.cache = seedDataset();
    this.persist();
    return clone(this.cache);
  }
}
