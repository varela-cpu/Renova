export type PayrollArea = "Producción" | "Calidad" | "Almacén" | "Administración";

export type Empleado = {
  id: string;
  cargo: string;
  area: PayrollArea;
  personas: number;
  salarioBase: number;
  devengado: number;
  salud: number;
  pension: number;
  arl: number;
  cesantias: number;
  prima: number;
  vacaciones: number;
  interesesCesantias: number;
  parafiscales: {
    caja: number;
    icbf: number;
    sena: number;
  };
  deducciones: {
    salud: number;
    pension: number;
  };
  netoPagado: number;
  costoTotal: number;
  factorCosto: number;
};

type EmpleadoBase = Pick<Empleado, "id" | "cargo" | "area" | "personas" | "salarioBase">;

export const FACTOR_CARGA = 0.35;

export const TASAS_CARGA = {
  salud: 0.08,
  pension: 0.12,
  arl: 0.005,
  cesantias: 0.04,
  prima: 0.04,
  vacaciones: 0.03,
  interesesCesantias: 0.005,
  caja: 0.01,
  icbf: 0.01,
  sena: 0.01,
} as const;

export const TASAS_DEDUCCION = {
  salud: 0.04,
  pension: 0.04,
} as const;

const EMPLEADOS_BASE: EmpleadoBase[] = [
  {
    id: "pay-001",
    cargo: "Coordinación de producción",
    area: "Producción",
    personas: 1,
    salarioBase: 3650000,
  },
  {
    id: "pay-002",
    cargo: "Operario de pesaje y preparación",
    area: "Producción",
    personas: 1,
    salarioBase: 2150000,
  },
  {
    id: "pay-003",
    cargo: "Operario de mezclado",
    area: "Producción",
    personas: 1,
    salarioBase: 2350000,
  },
  {
    id: "pay-004",
    cargo: "Operarios de llenado y empaque",
    area: "Producción",
    personas: 2,
    salarioBase: 1850000,
  },
  {
    id: "pay-005",
    cargo: "Analista de calidad",
    area: "Calidad",
    personas: 1,
    salarioBase: 2450000,
  },
  {
    id: "pay-006",
    cargo: "Responsable de almacén y despacho",
    area: "Almacén",
    personas: 1,
    salarioBase: 2050000,
  },
  {
    id: "pay-007",
    cargo: "Auxiliar de producción y limpieza",
    area: "Producción",
    personas: 1,
    salarioBase: 1950000,
  },
];

const money = (value: number) => Math.round(value);

export const empleados: Empleado[] = EMPLEADOS_BASE.map((item) => {
  const devengado = item.salarioBase * item.personas;
  const salud = money(devengado * TASAS_CARGA.salud);
  const pension = money(devengado * TASAS_CARGA.pension);
  const arl = money(devengado * TASAS_CARGA.arl);
  const cesantias = money(devengado * TASAS_CARGA.cesantias);
  const prima = money(devengado * TASAS_CARGA.prima);
  const vacaciones = money(devengado * TASAS_CARGA.vacaciones);
  const interesesCesantias = money(devengado * TASAS_CARGA.interesesCesantias);
  const parafiscales = {
    caja: money(devengado * TASAS_CARGA.caja),
    icbf: money(devengado * TASAS_CARGA.icbf),
    sena: money(devengado * TASAS_CARGA.sena),
  };
  const deducciones = {
    salud: money(devengado * TASAS_DEDUCCION.salud),
    pension: money(devengado * TASAS_DEDUCCION.pension),
  };
  const costoTotal = money(
    devengado +
      salud +
      pension +
      arl +
      cesantias +
      prima +
      vacaciones +
      interesesCesantias +
      parafiscales.caja +
      parafiscales.icbf +
      parafiscales.sena,
  );
  const netoPagado = money(devengado - deducciones.salud - deducciones.pension);

  return {
    ...item,
    devengado,
    salud,
    pension,
    arl,
    cesantias,
    prima,
    vacaciones,
    interesesCesantias,
    parafiscales,
    deducciones,
    netoPagado,
    costoTotal,
    factorCosto: devengado > 0 ? costoTotal / devengado : 0,
  };
});
