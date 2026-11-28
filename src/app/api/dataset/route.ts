import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { DEFAULT_SETTINGS } from "@/lib/domain";
import { PAYROLL_SEED, liquidatePayrollEmployee } from "@/lib/payroll";

function computeBenefitsPct(baseSalary: number): number {
  const seed = PAYROLL_SEED.find((s) => s.baseSalary === baseSalary);
  if (seed) return liquidatePayrollEmployee(seed).benefitsPct;
  // fallback: liquidate as generic single person
  return liquidatePayrollEmployee({
    id: "tmp", position: "", contractType: "Indefinido", headcount: 1, baseSalary, area: "Producción", sortOrder: 0,
  }).benefitsPct;
}

export async function GET() {
  const repo = getRepository();
  const [materials, employees, resources, products, settings] = await Promise.all([
    repo.listMaterials(),
    repo.listEmployees(),
    repo.listResources(),
    repo.listProducts(),
    repo.getSettings(),
  ]);

  // Ensure benefitsPct reflects detailed liquidation (single source of truth)
  const normalizedEmployees = employees.map((e) => ({
    ...e,
    benefitsPct: computeBenefitsPct(e.baseSalary),
  }));

  return NextResponse.json({
    materials,
    employees: normalizedEmployees,
    resources,
    products,
    settings: { ...DEFAULT_SETTINGS, ...settings },
    source: repo.kind,
  });
}
