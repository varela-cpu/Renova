/**
 * Contrato de acceso a datos de RENOVA.
 *
 * Dos implementaciones:
 *  - PrismaRepository  -> Postgres (Neon)
 *  - JsonRepository    -> archivo local data/renova.json (desarrollo sin DB)
 */

import type {
  Dataset,
  Employee,
  Material,
  Product,
  Resource,
  Settings,
} from "@/lib/domain";

export type { Dataset };

export type MaterialInput = Omit<Material, "id"> & { id?: string };
export type EmployeeInput = Omit<Employee, "id"> & { id?: string };
export type ResourceInput = Omit<Resource, "id"> & { id?: string };
export type ProductInput = Omit<Product, "id"> & { id?: string };

export interface Repository {
  /** "postgres" | "local" */
  readonly kind: string;
  listMaterials(): Promise<Material[]>;
  listEmployees(): Promise<Employee[]>;
  listResources(): Promise<Resource[]>;
  listProducts(): Promise<Product[]>;
  getSettings(): Promise<Settings>;
  saveMaterial(input: MaterialInput): Promise<Material>;
  deleteMaterial(id: string): Promise<void>;
  saveEmployee(input: EmployeeInput): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
  saveResource(input: ResourceInput): Promise<Resource>;
  deleteResource(id: string): Promise<void>;
  saveProduct(input: ProductInput): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  saveSettings(settings: Settings): Promise<Settings>;
  /** Restablece el dataset completo a los valores semilla. */
  reset(): Promise<Dataset>;
}
