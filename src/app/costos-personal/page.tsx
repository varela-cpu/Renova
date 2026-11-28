"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Info,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  empleados,
  FACTOR_CARGA_PROMEDIO,
  TASAS_CARGA,
  TASAS_DEDUCCION,
  EXTERNAL_QUALITY_MONTHLY,
  SMMLV_2026,
  AUXILIO_TRANSPORTE_2026,
} from "@/lib/payroll";
import type { Empleado, PayrollArea } from "@/lib/payroll";
import { formatCop, formatCopShort, formatNumber, formatPercent } from "@/lib/format";

const COLORS = ["#145b45", "#287a5d", "#e8b14c", "#f07863", "#a2b99a"];
const AREAS = Array.from(new Set(empleados.map((empleado) => empleado.area)));
const FILTROS: Array<PayrollArea | "Todas"> = ["Todas", ...AREAS];

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="card-solid flex flex-col gap-3 px-5 py-4">
      <div className="flex items-center justify-between">
        <p className="label-eyebrow">{label}</p>
        <Icon className="h-5 w-5 text-leaf" aria-hidden />
      </div>
      <p className="font-display text-3xl font-semibold tracking-tight text-forest">
        {value}
      </p>
      <p className="text-sm text-forest/70">{hint}</p>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <header className="border-b border-sage/40 px-6 py-5">
        {eyebrow ? <p className="label-eyebrow">{eyebrow}</p> : null}
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-forest">
          {title}
        </h2>
      </header>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

export default function CostosPersonalPage() {
  const [area, setArea] = useState<PayrollArea | "Todas">("Todas");

  const totals = useMemo(() => {
    const rows =
      area === "Todas"
        ? empleados
        : empleados.filter((empleado) => empleado.area === area);
    const sum = (pick: (empleado: Empleado) => number) =>
      rows.reduce((acc, empleado) => acc + pick(empleado), 0);

    const base = sum((empleado) => empleado.devengado);
    const seguridadSocial = sum(
      (empleado) => empleado.salud + empleado.pension + empleado.arl,
    );
    const prestaciones = sum(
      (empleado) =>
        empleado.cesantias +
        empleado.prima +
        empleado.vacaciones +
        empleado.interesesCesantias,
    );
    const parafiscales = sum(
      (empleado) =>
        empleado.parafiscales.caja +
        empleado.parafiscales.icbf +
        empleado.parafiscales.sena,
    );
    const cargas = seguridadSocial + prestaciones + parafiscales;
    const deducciones = sum(
      (empleado) => empleado.deducciones.salud + empleado.deducciones.pension,
    );

    return {
      rows,
      base,
      seguridadSocial,
      prestaciones,
      parafiscales,
      cargas,
      deducciones,
      costo: sum((empleado) => empleado.costoTotal),
      neto: sum((empleado) => empleado.netoPagado),
      personas: sum((empleado) => empleado.personas),
    };
  }, [area]);

  const composicion = useMemo(
    () => [
      { name: "Salario base", value: totals.base, color: COLORS[0] },
      { name: "Prestaciones", value: totals.prestaciones, color: COLORS[1] },
      { name: "Seguridad social", value: totals.seguridadSocial, color: COLORS[2] },
      { name: "Parafiscales", value: totals.parafiscales, color: COLORS[3] },
    ],
    [totals],
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-eyebrow">Dashboard · Nómina</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-forest sm:text-5xl">
            Costos de personal
          </h1>
          <p className="mt-2 max-w-3xl text-base text-forest/70">
            Costo real mensual de la nómina de producción: salario base,
            prestaciones, seguridad social, parafiscales y deducciones de los
            empleados.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-sage/60 bg-cream px-4 py-2 text-sm font-semibold text-forest transition hover:bg-sage/25"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al panel
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Costo real mensual"
          value={formatCopShort(totals.costo)}
          hint={formatCop(totals.costo)}
        />
        <StatCard
          icon={TrendingUp}
          label="Salario base"
          value={formatCopShort(totals.base)}
          hint={`Factor promedio ${FACTOR_CARGA_PROMEDIO.toFixed(2)}x · Calidad ext. ${formatCopShort(EXTERNAL_QUALITY_MONTHLY)}`}
        />
        <StatCard
          icon={ShieldCheck}
          label="Cargas empleador"
          value={formatCopShort(totals.cargas)}
          hint={`${formatPercent(totals.costo > 0 ? totals.cargas / totals.costo : 0)} del costo real`}
        />
        <StatCard
          icon={Users}
          label="Personas"
          value={formatNumber(totals.personas)}
          hint={`${totals.rows.length} cargos en el turno`}
        />
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div>
          <p className="label-eyebrow">Filtro por área</p>
          <p className="mt-1 text-sm text-forest/70">
            Los indicadores, el gráfico y la tabla se recalculan al cambiar el área.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((filtro) => (
            <button
              key={filtro}
              type="button"
              onClick={() => setArea(filtro)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                area === filtro
                  ? "bg-forest text-cream"
                  : "bg-sage/25 text-forest hover:bg-sage/40"
              }`}
            >
              {filtro}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard eyebrow="Composición" title="¿Cómo se reparte el costo?">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={composicion}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={105}
                  paddingAngle={2}
                  stroke="#faf7ee"
                  strokeWidth={3}
                >
                  {composicion.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCop(Number(value))}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "#a2b99a",
                    fontFamily: "inherit",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "0.8rem" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {composicion.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center justify-between rounded-2xl border border-sage/40 px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2 text-forest/70">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.name}
                </span>
                <span className="font-semibold text-forest">
                  {formatCopShort(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Desglose" title="Detalle del costo empresarial">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between rounded-2xl bg-sage/15 px-4 py-3">
              <span className="text-forest">Salario base (devengado)</span>
              <span className="font-semibold text-forest">{formatCop(totals.base)}</span>
            </div>
            <div className="rounded-2xl border border-sage/40 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold text-forest">
                  <ShieldCheck className="h-4 w-4 text-leaf" aria-hidden />
                  Seguridad social
                </span>
                <span className="font-semibold text-forest">
                  {formatCop(totals.seguridadSocial)}
                </span>
              </div>
              <p className="mt-2 pl-6 text-sm text-forest/70">
                Salud empleador {formatPercent(TASAS_CARGA.exonerados.salud)} (exonerada) · Pensión{" "}
                {formatPercent(TASAS_CARGA.aportes.pension)} · ARL{" "}
                {formatPercent(TASAS_CARGA.aportes.arl)}
              </p>
            </div>
            <div className="rounded-2xl border border-sage/40 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold text-forest">
                  <TrendingUp className="h-4 w-4 text-leaf" aria-hidden />
                  Prestaciones
                </span>
                <span className="font-semibold text-forest">
                  {formatCop(totals.prestaciones)}
                </span>
              </div>
              <p className="mt-2 pl-6 text-sm text-forest/70">
                Cesantías {formatPercent(TASAS_CARGA.prestaciones.cesantias)} · Prima{" "}
                {formatPercent(TASAS_CARGA.prestaciones.prima)} · Vacaciones{" "}
                {formatPercent(TASAS_CARGA.prestaciones.vacaciones)} · Intereses{" "}
                {formatPercent(TASAS_CARGA.prestaciones.interesesCesantias)}
              </p>
            </div>
            <div className="rounded-2xl border border-sage/40 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold text-forest">
                  <Building2 className="h-4 w-4 text-leaf" aria-hidden />
                  Parafiscales
                </span>
                <span className="font-semibold text-forest">
                  {formatCop(totals.parafiscales)}
                </span>
              </div>
              <p className="mt-2 pl-6 text-sm text-forest/70">
                Caja {formatPercent(TASAS_CARGA.aportes.caja)} · ICBF{" "}
                {formatPercent(TASAS_CARGA.exonerados.icbf)} · SENA{" "}
                {formatPercent(TASAS_CARGA.exonerados.sena)} (exonerados art. 114-1 E.T.)
              </p>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-forest px-4 py-3 text-cream">
              <span className="font-semibold">Costo real para la empresa</span>
              <span className="font-display text-xl font-semibold">
                {formatCop(totals.costo)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-dashed border-sage/60 px-4 py-3 text-sm">
              <span className="text-forest/70">
                Deducciones al empleado (
                {formatPercent(TASAS_DEDUCCION.salud + TASAS_DEDUCCION.pension)})
              </span>
              <span className="font-semibold text-forest">
                {formatCop(totals.deducciones)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-dashed border-sage/60 px-4 py-3 text-sm">
              <span className="text-forest/70">Neto pagado al personal</span>
              <span className="font-semibold text-forest">{formatCop(totals.neto)}</span>
            </div>
          </div>
        </SectionCard>
      </section>

      <SectionCard eyebrow="Plantilla" title="Costo por cargo">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="text-forest/60">
                <th className="pb-3 font-medium">Cargo</th>
                <th className="pb-3 font-medium">Área</th>
                <th className="pb-3 text-center font-medium">Personas</th>
                <th className="pb-3 text-right font-medium">Salario/persona</th>
                <th className="pb-3 text-right font-medium">Devengado</th>
                <th className="pb-3 text-right font-medium">Cargas</th>
                <th className="pb-3 text-right font-medium">Deducciones</th>
                <th className="pb-3 text-right font-medium">Costo total</th>
                <th className="pb-3 text-right font-medium">Factor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/30">
              {totals.rows.map((empleado) => (
                <tr key={empleado.id}>
                  <td className="py-3 font-semibold text-forest">{empleado.cargo}</td>
                  <td className="py-3 text-forest/70">{empleado.area}</td>
                  <td className="py-3 text-center text-forest">
                    {formatNumber(empleado.personas)}
                  </td>
                  <td className="py-3 text-right text-forest/70">
                    {formatCop(empleado.salarioBase)}
                  </td>
                  <td className="py-3 text-right text-forest">
                    {formatCop(empleado.devengado)}
                  </td>
                  <td className="py-3 text-right text-forest/70">
                    {formatCop(empleado.costoTotal - empleado.devengado)}
                  </td>
                  <td className="py-3 text-right text-forest/70">
                    {formatCop(
                      empleado.deducciones.salud + empleado.deducciones.pension,
                    )}
                  </td>
                  <td className="py-3 text-right font-semibold text-forest">
                    {formatCop(empleado.costoTotal)}
                  </td>
                  <td className="py-3 text-right text-leaf">
                    {empleado.factorCosto.toFixed(2)}x
                  </td>
                </tr>
              ))}
              <tr className="bg-sage/15 font-semibold text-forest">
                <td className="py-3">Total</td>
                <td className="py-3">—</td>
                <td className="py-3 text-center">{formatNumber(totals.personas)}</td>
                <td className="py-3 text-right">—</td>
                <td className="py-3 text-right">{formatCop(totals.base)}</td>
                <td className="py-3 text-right">{formatCop(totals.cargas)}</td>
                <td className="py-3 text-right">{formatCop(totals.deducciones)}</td>
                <td className="py-3 text-right">{formatCop(totals.costo)}</td>
                <td className="py-3 text-right">{FACTOR_CARGA_PROMEDIO.toFixed(2)}x</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="card flex items-start gap-3 px-6 py-5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-leaf" aria-hidden />
        <p className="text-sm text-forest/70">
          Liquidación detallada 2026: SMMLV {formatCop(SMMLV_2026)} · auxilio de transporte{" "}
          {formatCop(AUXILIO_TRANSPORTE_2026)} (hasta 2 SMMLV). Cesantías/prima sobre salario+auxilio;
          vacaciones sobre salario; aportes sobre salario. Salud, ICBF y SENA en 0% por exoneración
          art. 114-1 E.T. Control de calidad externo: {formatCop(EXTERNAL_QUALITY_MONTHLY)}/mes (aparte).
        </p>
      </div>
    </div>
  );
}
