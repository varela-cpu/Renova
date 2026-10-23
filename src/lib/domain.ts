/**
 * Tipos de dominio de RENOVA.
 * Compartidos entre el servidor (Prisma / JSON) y el cliente (React).
 */

export type Material = {
  id: string;
  name: string;
  supplier: string;
  reference: string;
  unit: string;
  /** % en masa del producto terminado (null en empaque/etiqueta/servicios) */
  compositionPct: number | null;
  /** unidades por unidad de venta */
  unitsPerProduct: number;
  /** costo unitario COP (por kg, por unidad...) */
  unitCost: number;
  isPackaging: boolean;
  sortOrder: number;
};

export type Employee = {
  id: string;
  position: string;
  contractType: string;
  headcount: number;
  baseSalary: number;
  benefitsPct: number;
  sortOrder: number;
};

export type ResourceKind = "TANGIBLE" | "INTANGIBLE";
export type ResourceRecurrence = "UNICO" | "RECURRENTE";

export type Resource = {
  id: string;
  kind: ResourceKind;
  concept: string;
  detail: string;
  value: number;
  recurrence: ResourceRecurrence;
  sortOrder: number;
};

export type Product = {
  id: string;
  code: string;
  name: string;
  weightKg: number;
  /** precio al consumidor sin IVA, COP */
  pvp: number;
};

export type Settings = {
  currency: "COP";
  /** IVA aplicable a detergentes de uso doméstico en Colombia */
  ivaPct: number;
  /** costos indirectos como % del costo de insumos */
  indirectPct: number;
  /** meta de unidades vendidas por mes */
  targetUnits: number;
  /** presentación activa (id de Product) */
  activeProductId: string;
  /** volumen mensual simulado */
  monthlyVolume: number;
  /** margen mínimo esperado para considerar sostenible el negocio */
  minMarginPct: number;
};

/** Dataset completo que consume el dashboard y las matrices editables. */
export type Dataset = {
  materials: Material[];
  employees: Employee[];
  resources: Resource[];
  products: Product[];
  settings: Settings;
};

export type VolumePreset = 25000 | 50000 | 100000 | 184529;

export const VOLUME_PRESETS: readonly VolumePreset[] = [25000, 50000, 100000, 184529];

export const DEFAULT_SETTINGS: Settings = {
  currency: "COP",
  ivaPct: 0.19,
  indirectPct: 0.08,
  targetUnits: 49208,
  activeProductId: "prd-005",
  monthlyVolume: 49208,
  minMarginPct: 0.2,
};

export const CONTRACT_TYPES = [
  "Indefinido",
  "Temporal",
  "Prestación de servicios",
] as const;
