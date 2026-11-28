/**
 * Nómina RENOVA S.A.S. - fuente única de verdad.
 * Liquidación detallada según normativa laboral colombiana (2026).
 */

export const SMMLV_2026 = 1_750_905;
export const AUXILIO_TRANSPORTE_2026 = 249_095;
export const AUXILIO_TRANSPORTE_TOPE_SMMLV = 2;

export const TASAS_CARGA = {
  prestaciones: {
    cesantias: 0.0833,
    prima: 0.0833,
    interesesCesantias: 0.01,
    vacaciones: 0.0417,
  },
  aportes: {
    pension: 0.12,
    arl: 0.02436,
    caja: 0.04,
  },
  exonerados: {
    salud: 0,
    icbf: 0,
    sena: 0,
  },
} as const;

export const TASAS_DEDUCCION = {
  salud: 0.04,
  pension: 0.04,
} as const;

export type PayrollArea = "Producción" | "Calidad externa";

export type PayrollEmployeeSeed = {
  id: string;
  position: string;
  contractType: string;
  headcount: number;
  baseSalary: number;
  area: PayrollArea;
  sortOrder: number;
};

export type PayrollBreakdown = {
  auxilioTransporte: number;
  basePrestaciones: number;
  cesantias: number;
  prima: number;
  interesesCesantias: number;
  vacaciones: number;
  pensionEmpleador: number;
  arl: number;
  caja: number;
  saludEmpleador: number;
  icbf: number;
  sena: number;
  totalApropiaciones: number;
  deduccionSalud: number;
  deduccionPension: number;
  totalDeducciones: number;
  devengado: number;
  netoPagado: number;
  costoEmpresa: number;
  factorCosto: number;
};

export type PayrollEmployee = PayrollEmployeeSeed & PayrollBreakdown & {
  benefitsPct: number;
};

export const PAYROLL_SEED: PayrollEmployeeSeed[] = [
  { id: "emp-coord", position: "Coordinador de producción", contractType: "Indefinido", headcount: 1, baseSalary: 3_500_000, area: "Producción", sortOrder: 1 },
  { id: "emp-pesaje", position: "Operario de pesaje y preparación", contractType: "Indefinido", headcount: 1, baseSalary: 2_300_000, area: "Producción", sortOrder: 2 },
  { id: "emp-mezclado", position: "Operario de mezclado y tamizado", contractType: "Indefinido", headcount: 1, baseSalary: 2_100_000, area: "Producción", sortOrder: 3 },
  { id: "emp-empaque-1", position: "Operario de empaque y despacho 1", contractType: "Indefinido", headcount: 1, baseSalary: 2_000_000, area: "Producción", sortOrder: 4 },
  { id: "emp-empaque-2", position: "Operario de empaque y despacho 2", contractType: "Indefinido", headcount: 1, baseSalary: 2_000_000, area: "Producción", sortOrder: 5 },
];

export const EXTERNAL_QUALITY_MONTHLY = 1_500_000;

const money = (value: number) => Math.round(value);

export function auxilioTransporteForSalary(baseSalary: number): number {
  return baseSalary <= SMMLV_2026 * AUXILIO_TRANSPORTE_TOPE_SMMLV ? AUXILIO_TRANSPORTE_2026 : 0;
}

export function liquidatePayrollEmployee(seed: PayrollEmployeeSeed): PayrollEmployee {
  const { baseSalary, headcount } = seed;
  const auxilioTransporte = auxilioTransporteForSalary(baseSalary);
  const basePrestaciones = baseSalary + auxilioTransporte;

  const cesantias = money(basePrestaciones * TASAS_CARGA.prestaciones.cesantias);
  const prima = money(basePrestaciones * TASAS_CARGA.prestaciones.prima);
  const interesesCesantias = money(basePrestaciones * TASAS_CARGA.prestaciones.interesesCesantias);
  const vacaciones = money(baseSalary * TASAS_CARGA.prestaciones.vacaciones);

  const pensionEmpleador = money(baseSalary * TASAS_CARGA.aportes.pension);
  const arl = money(baseSalary * TASAS_CARGA.aportes.arl);
  const caja = money(baseSalary * TASAS_CARGA.aportes.caja);
  const saludEmpleador = money(baseSalary * TASAS_CARGA.exonerados.salud);
  const icbf = money(baseSalary * TASAS_CARGA.exonerados.icbf);
  const sena = money(baseSalary * TASAS_CARGA.exonerados.sena);

  const totalApropiaciones =
    cesantias + prima + interesesCesantias + vacaciones + pensionEmpleador + arl + caja + saludEmpleador + icbf + sena;

  const deduccionSalud = money(baseSalary * TASAS_DEDUCCION.salud);
  const deduccionPension = money(baseSalary * TASAS_DEDUCCION.pension);
  const totalDeducciones = deduccionSalud + deduccionPension;

  const devengado = money((baseSalary + auxilioTransporte) * headcount);
  const netoPagado = money((baseSalary + auxilioTransporte - totalDeducciones) * headcount);
  const costoEmpresa = money((baseSalary + auxilioTransporte + totalApropiaciones) * headcount);
  const factorCosto = baseSalary > 0 ? (baseSalary + auxilioTransporte + totalApropiaciones) / baseSalary : 0;

  return {
    ...seed,
    auxilioTransporte,
    basePrestaciones,
    cesantias,
    prima,
    interesesCesantias,
    vacaciones,
    pensionEmpleador,
    arl,
    caja,
    saludEmpleador,
    icbf,
    sena,
    totalApropiaciones,
    deduccionSalud,
    deduccionPension,
    totalDeducciones,
    devengado,
    netoPagado,
    costoEmpresa,
    factorCosto,
    benefitsPct: baseSalary > 0 ? (auxilioTransporte + totalApropiaciones) / baseSalary : 0,
  };
}

export const payrollEmployees: PayrollEmployee[] = PAYROLL_SEED.map(liquidatePayrollEmployee);

export const payrollTotals = payrollEmployees.reduce(
  (acc, e) => {
    acc.headcount += e.headcount;
    acc.devengado += e.devengado;
    acc.apropiaciones += e.totalApropiaciones * e.headcount;
    acc.deducciones += e.totalDeducciones * e.headcount;
    acc.neto += e.netoPagado;
    acc.costoEmpresa += e.costoEmpresa;
    return acc;
  },
  { headcount: 0, devengado: 0, apropiaciones: 0, deducciones: 0, neto: 0, costoEmpresa: 0 },
);

export const NOMINA_MENSUAL_TOTAL = payrollTotals.costoEmpresa;
export const NOMINA_CON_CALIDAD_EXTERNA = NOMINA_MENSUAL_TOTAL + EXTERNAL_QUALITY_MONTHLY;

// Backward-compatible exports used by existing UI
export type Empleado = {
  id: string;
  cargo: string;
  area: PayrollArea;
  personas: number;
  salarioBase: number;
  auxilioTransporte: number;
  devengado: number;
  salud: number;
  pension: number;
  arl: number;
  cesantias: number;
  prima: number;
  vacaciones: number;
  interesesCesantias: number;
  parafiscales: { caja: number; icbf: number; sena: number };
  deducciones: { salud: number; pension: number };
  netoPagado: number;
  costoTotal: number;
  factorCosto: number;
};

export const empleados: Empleado[] = payrollEmployees.map((e) => ({
  id: e.id,
  cargo: e.position,
  area: e.area,
  personas: e.headcount,
  salarioBase: e.baseSalary,
  auxilioTransporte: e.auxilioTransporte,
  devengado: e.devengado,
  salud: e.saludEmpleador,
  pension: e.pensionEmpleador,
  arl: e.arl,
  cesantias: e.cesantias * e.headcount,
  prima: e.prima * e.headcount,
  vacaciones: e.vacaciones * e.headcount,
  interesesCesantias: e.interesesCesantias * e.headcount,
  parafiscales: { caja: e.caja * e.headcount, icbf: e.icbf * e.headcount, sena: e.sena * e.headcount },
  deducciones: { salud: e.deduccionSalud * e.headcount, pension: e.deduccionPension * e.headcount },
  netoPagado: e.netoPagado,
  costoTotal: e.costoEmpresa,
  factorCosto: e.factorCosto,
}));

export const FACTOR_CARGA_PROMEDIO =
  payrollTotals.devengado > 0 ? payrollTotals.costoEmpresa / payrollTotals.devengado : 0;

// Compatibilidad con UI antigua
export const FACTOR_CARGA = FACTOR_CARGA_PROMEDIO;
export const TASAS_CARGA_LEGACY = {
  salud: TASAS_CARGA.exonerados.salud,
  pension: TASAS_CARGA.aportes.pension,
  arl: TASAS_CARGA.aportes.arl,
  cesantias: TASAS_CARGA.prestaciones.cesantias,
  prima: TASAS_CARGA.prestaciones.prima,
  vacaciones: TASAS_CARGA.prestaciones.vacaciones,
  interesesCesantias: TASAS_CARGA.prestaciones.interesesCesantias,
  caja: TASAS_CARGA.aportes.caja,
  icbf: TASAS_CARGA.exonerados.icbf,
  sena: TASAS_CARGA.exonerados.sena,
} as const;
