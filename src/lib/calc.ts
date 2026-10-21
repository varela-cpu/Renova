/**
 * Motor financiero de RENOVA.
 *
 * Funciones puras: reciben el modelo de datos y el volumen mensual simulado,
 * y devuelven la calculadora, el análisis de margen y la sostenibilidad.
 * No dependen de la base de datos ni de React.
 */

import type {
  Employee,
  Material,
  Product,
  Resource,
  Settings,
} from "./domain";

export type MaterialRow = Material & {
  /** cantidad por unidad de venta (kg / und) */
  qtyPerUnit: number;
  /** cantidad total consumida en el mes */
  qtyTotalMonth: number;
  /** costo por unidad de venta */
  costPerUnit: number;
  /** costo total del mes */
  costTotalMonth: number;
};

export type MaterialSummary = {
  rows: MaterialRow[];
  totalQtyMonth: number;
  totalCostMonth: number;
  /** costo de insumos por unidad de venta */
  costPerUnit: number;
};

export type PayrollRow = Employee & {
  /** costo por persona (salario base + prestaciones) */
  costPerPerson: number;
  /** costo total del mes para el cargo */
  costTotalMonth: number;
};

export type PayrollSummary = {
  rows: PayrollRow[];
  totalMonth: number;
  totalPeople: number;
  costPerUnit: number;
};

export type ResourceSummary = {
  rows: Resource[];
  tangibleUnique: number;
  tangibleRecurring: number;
  intangibleUnique: number;
  intangibleRecurring: number;
  /** inversión inicial (recursos únicos) */
  investment: number;
  /** costos fijos mensuales (recursos recurrentes) */
  fixedMonthly: number;
  total: number;
};

export type Simulation = {
  volume: number;
  product: Product;
  materials: MaterialSummary;
  payroll: PayrollSummary;
  resources: ResourceSummary;
  /** costo de insumos por unidad */
  costMaterialPerUnit: number;
  /** nómina del mes */
  payrollMonth: number;
  /** costos fijos mensuales */
  fixedMonthly: number;
  /** inversión inicial en recursos únicos */
  investment: number;
  /** costos indirectos por unidad */
  indirectPerUnit: number;
  /** costo total por unidad */
  totalCostPerUnit: number;
  /** precio al consumidor sin IVA */
  pvp: number;
  /** IVA por unidad */
  ivaPerUnit: number;
  /** precio al consumidor con IVA */
  priceToConsumer: number;
  /** ingreso neto por unidad (precio sin IVA - costo total) */
  netIncomePerUnit: number;
  /** margen sobre el precio sin IVA */
  marginPct: number;
  /** margen de contribución unitario (precio - costos variables) */
  contributionPerUnit: number;
  /** margen de contribución porcentual */
  contributionPct: number;
  /** punto de equilibrio mensual en unidades */
  breakEvenUnits: number;
  /** ingreso total del mes a precio de venta */
  revenueMonth: number;
  /** ingreso neto del mes */
  netIncomeMonth: number;
  /** margen total del mes */
  marginMonth: number;
  /** total de costos del mes */
  totalCostMonth: number;
  /** meta de unidades configurada */
  targetUnits: number;
  /** unidades faltantes o sobrantes frente a la meta */
  targetGap: number;
  /** ingreso neto requerido por la meta */
  targetNetIncome: number;
  /** cumplimiento de la meta en porcentaje */
  targetCompliancePct: number;
  /** veredicto de sostenibilidad */
  sustainability: Sustainability;
};

export type Sustainability = {
  level: "SOSTENIBLE" | "EN_RIESGO" | "NO_SOSTENIBLE";
  score: number;
  checks: { label: string; ok: boolean; detail: string }[];
};

/** Cantidad por unidad de venta a partir de la composición o del empaque. */
export function qtyPerUnitFor(material: Material, product: Product): number {
  if (material.compositionPct != null) {
    return (material.compositionPct / 100) * product.weightKg;
  }
  return material.unitsPerProduct;
}

export function computeMaterials(
  materials: Material[],
  product: Product,
  volume: number,
): MaterialSummary {
  const rows: MaterialRow[] = [...materials]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((material) => {
      const qtyPerUnit = qtyPerUnitFor(material, product);
      const qtyTotalMonth = qtyPerUnit * volume;
      const costPerUnit = qtyPerUnit * material.unitCost;
      const costTotalMonth = costPerUnit * volume;
      return { ...material, qtyPerUnit, qtyTotalMonth, costPerUnit, costTotalMonth };
    });

  const totalCostMonth = rows.reduce((acc, r) => acc + r.costTotalMonth, 0);
  return {
    rows,
    totalQtyMonth: rows.reduce((acc, r) => acc + r.qtyTotalMonth, 0),
    totalCostMonth,
    costPerUnit: volume > 0 ? totalCostMonth / volume : 0,
  };
}

export function computePayroll(
  employees: Employee[],
  volume: number,
): PayrollSummary {
  const rows: PayrollRow[] = [...employees]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((employee) => {
      const costPerPerson = employee.baseSalary * (1 + employee.benefitsPct);
      return {
        ...employee,
        costPerPerson,
        costTotalMonth: costPerPerson * employee.headcount,
      };
    });

  const totalMonth = rows.reduce((acc, r) => acc + r.costTotalMonth, 0);
  return {
    rows,
    totalMonth,
    totalPeople: rows.reduce((acc, r) => acc + r.headcount, 0),
    costPerUnit: volume > 0 ? totalMonth / volume : 0,
  };
}

export function computeResources(resources: Resource[]): ResourceSummary {
  const sum = (kind: Resource["kind"], recurrence: Resource["recurrence"]) =>
    resources
      .filter((r) => r.kind === kind && r.recurrence === recurrence)
      .reduce((acc, r) => acc + r.value, 0);

  const tangibleUnique = sum("TANGIBLE", "UNICO");
  const tangibleRecurring = sum("TANGIBLE", "RECURRENTE");
  const intangibleUnique = sum("INTANGIBLE", "UNICO");
  const intangibleRecurring = sum("INTANGIBLE", "RECURRENTE");

  return {
    rows: [...resources].sort(
      (a, b) => a.kind.localeCompare(b.kind) || a.sortOrder - b.sortOrder,
    ),
    tangibleUnique,
    tangibleRecurring,
    intangibleUnique,
    intangibleRecurring,
    investment: tangibleUnique + intangibleUnique,
    fixedMonthly: tangibleRecurring + intangibleRecurring,
    total:
      tangibleUnique +
      tangibleRecurring +
      intangibleUnique +
      intangibleRecurring,
  };
}

export function computeSimulation(input: {
  volume: number;
  product: Product;
  materials: Material[];
  employees: Employee[];
  resources: Resource[];
  settings: Settings;
}): Simulation {
  const { volume, product, materials, employees, resources, settings } = input;
  const safeVolume = Math.max(0, volume);

  const matSummary = computeMaterials(materials, product, safeVolume);
  const payrollSummary = computePayroll(employees, safeVolume);
  const resourceSummary = computeResources(resources);

  const costMaterialPerUnit = matSummary.costPerUnit;
  const indirectPerUnit = costMaterialPerUnit * settings.indirectPct;
  const fixedPerUnit = safeVolume > 0 ? resourceSummary.fixedMonthly / safeVolume : 0;

  const totalCostPerUnit =
    costMaterialPerUnit + payrollSummary.costPerUnit + fixedPerUnit + indirectPerUnit;

  const pvp = product.pvp;
  const ivaPerUnit = pvp * settings.ivaPct;
  const priceToConsumer = pvp + ivaPerUnit;

  const netIncomePerUnit = pvp - totalCostPerUnit;
  const marginPct = pvp > 0 ? netIncomePerUnit / pvp : 0;

  const contributionPerUnit = pvp - costMaterialPerUnit - indirectPerUnit;
  const contributionPct = pvp > 0 ? contributionPerUnit / pvp : 0;

  const breakEvenUnits =
    contributionPerUnit > 0 ? resourceSummary.fixedMonthly / contributionPerUnit : Infinity;

  const revenueMonth = safeVolume * pvp;
  const totalCostMonth =
    matSummary.totalCostMonth +
    payrollSummary.totalMonth +
    resourceSummary.fixedMonthly +
    costMaterialPerUnit * settings.indirectPct * safeVolume;
  const netIncomeMonth = revenueMonth - totalCostMonth;
  const marginMonth = netIncomeMonth;

  const targetUnits = settings.targetUnits;
  const targetGap = safeVolume - targetUnits;
  const targetNetIncome = targetUnits * netIncomePerUnit;
  const targetCompliancePct =
    targetUnits > 0 ? (safeVolume / targetUnits) * 100 : 0;

  const sustainability = evaluateSustainability({
    volume: safeVolume,
    breakEvenUnits,
    contributionPerUnit,
    netIncomePerUnit,
    marginPct,
    minMarginPct: settings.minMarginPct,
    targetUnits,
    investment: resourceSummary.investment,
  });

  return {
    volume: safeVolume,
    product,
    materials: matSummary,
    payroll: payrollSummary,
    resources: resourceSummary,
    costMaterialPerUnit,
    payrollMonth: payrollSummary.totalMonth,
    fixedMonthly: resourceSummary.fixedMonthly,
    investment: resourceSummary.investment,
    indirectPerUnit,
    totalCostPerUnit,
    pvp,
    ivaPerUnit,
    priceToConsumer,
    netIncomePerUnit,
    marginPct,
    contributionPerUnit,
    contributionPct,
    breakEvenUnits,
    revenueMonth,
    netIncomeMonth,
    marginMonth,
    totalCostMonth,
    targetUnits,
    targetGap,
    targetNetIncome,
    targetCompliancePct,
    sustainability,
  };
}

function evaluateSustainability(input: {
  volume: number;
  breakEvenUnits: number;
  contributionPerUnit: number;
  netIncomePerUnit: number;
  marginPct: number;
  minMarginPct: number;
  targetUnits: number;
  investment: number;
}): Sustainability {
  const checks: Sustainability["checks"] = [];

  checks.push({
    label: "Margen de contribución positivo",
    ok: input.contributionPerUnit > 0,
    detail:
      input.contributionPerUnit > 0
        ? `Cada unidad deja ${formatCop(input.contributionPerUnit)} para cubrir costos fijos.`
        : "El precio no cubre el costo de insumos ni los indirectos.",
  });

  checks.push({
    label: "Margen neto sobre el mínimo esperado",
    ok: input.marginPct >= input.minMarginPct,
    detail: `Margen neto ${(input.marginPct * 100).toFixed(1)}% (mínimo ${(
      input.minMarginPct * 100
    ).toFixed(0)}%).`,
  });

  const coversBreakEven = input.breakEvenUnits !== Infinity && input.volume >= input.breakEvenUnits;
  checks.push({
    label: "Volumen por encima del punto de equilibrio",
    ok: coversBreakEven,
    detail:
      input.breakEvenUnits === Infinity
        ? "No hay punto de equilibrio con el precio actual."
        : `${input.volume.toLocaleString("es-CO")} de ${Math.ceil(
            input.breakEvenUnits,
          ).toLocaleString("es-CO")} unidades necesarias.`,
  });

  checks.push({
    label: "Meta mensual alcanzada",
    ok: input.volume >= input.targetUnits,
    detail: `Meta de ${input.targetUnits.toLocaleString("es-CO")} unidades/mes.`,
  });

  const passed = checks.filter((c) => c.ok).length;
  const score = passed / checks.length;
  const level =
    score === 1
      ? "SOSTENIBLE"
      : score >= 0.5
        ? "EN_RIESGO"
        : "NO_SOSTENIBLE";

  return { level, score, checks };
}

function formatCop(value: number): string {
  return `$${Math.round(value).toLocaleString("es-CO")}`;
}
