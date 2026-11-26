"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { useRenova } from "@/components/renova-provider";
import { ProductViewer } from "@/components/three/product-viewer";
import { formatCop, formatCopShort, formatNumber, formatPercent } from "@/lib/format";
import { VOLUME_PRESETS } from "@/lib/domain";
import { empleados, FACTOR_CARGA } from "../../data/payroll";

function Card({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-sage/40 px-6 py-5">
        <div>
          {eyebrow ? <p className="label-eyebrow">{eyebrow}</p> : null}
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-forest">
            {title}
          </h2>
        </div>
      </header>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const tones = {
    neutral: "text-forest",
    good: "text-leaf",
    warn: "text-sun",
    bad: "text-coral",
  };
  return (
    <div className="card-solid flex flex-col gap-2 px-5 py-4">
      <p className="label-eyebrow">{label}</p>
      <p className={`font-display text-3xl font-semibold tracking-tight ${tones[tone]}`}>
        {value}
      </p>
      {hint ? <p className="text-sm text-forest/70">{hint}</p> : null}
    </div>
  );
}

export default function DashboardPage() {
  const { status, error, dataset, volume, setVolume, productId, setProductId, simulation } =
    useRenova();

  const products = useMemo(() => dataset?.products ?? [], [dataset?.products]);
  const activeProduct = useMemo(
    () => products.find((p) => p.id === productId) ?? products[0] ?? null,
    [products, productId],
  );
  const payrollResumen = useMemo(() => {
    const base = empleados.reduce((acc, empleado) => acc + empleado.devengado, 0);
    const costo = empleados.reduce((acc, empleado) => acc + empleado.costoTotal, 0);
    const personas = empleados.reduce((acc, empleado) => acc + empleado.personas, 0);
    const volumen = Math.max(1, simulation?.volume ?? 0);
    return {
      base,
      costo,
      cargas: costo - base,
      personas,
      porUnidad: costo / volumen,
    };
  }, [simulation?.volume]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="label-eyebrow">Cargando simulador RENOVA...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="card flex flex-col items-start gap-3 px-6 py-6">
        <p className="label-eyebrow text-coral">Error</p>
        <p className="text-lg text-forest">{error}</p>
      </div>
    );
  }

  if (!simulation || !activeProduct) {
    return (
      <div className="card flex flex-col items-start gap-3 px-6 py-6">
        <p className="label-eyebrow">Sin datos</p>
        <p className="text-forest/70">Agrega presentaciones o restablece el dataset.</p>
      </div>
    );
  }

  const sustainability = simulation.sustainability;

  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-sage/40">
        <div className="pointer-events-none absolute inset-0">
          <svg className="absolute -left-16 -top-14 h-64 w-64 opacity-30" viewBox="0 0 200 200">
            <path d="M40 60 C60 30, 110 30, 140 70 C170 110, 150 160, 100 170 C50 160, 20 110, 40 60 Z" fill="#287a5d" />
            <path d="M85 75 C98 58, 122 62, 130 82 C138 108, 122 132, 98 138 C78 130, 74 98, 85 75 Z" fill="#3f5d3a" />
            <path d="M55 90 C65 78, 82 82, 88 95 C94 112, 82 128, 66 126 C54 118, 50 102, 55 90 Z" fill="#145b45" />
          </svg>
          <svg className="absolute -right-20 top-2 h-72 w-72 opacity-28" viewBox="0 0 200 200">
            <path d="M60 70 C80 40, 130 40, 150 80 C170 120, 150 170, 100 175 C50 165, 35 115, 60 70 Z" fill="#145b45" />
            <path d="M90 88 C102 72, 122 76, 130 94 C138 118, 122 140, 98 144 C82 136, 78 108, 90 88 Z" fill="#287a5d" />
          </svg>
          <svg className="absolute bottom-[-60px] left-[18%] h-68 w-68 opacity-26" viewBox="0 0 200 200">
            <path d="M50 80 C70 50, 120 55, 140 90 C155 130, 135 170, 90 165 C55 150, 35 110, 50 80 Z" fill="#287a5d" />
            <path d="M78 95 C90 80, 110 84, 118 100 C126 122, 110 144, 88 148 C72 140, 68 114, 78 95 Z" fill="#3f5d3a" />
          </svg>
          <svg className="absolute top-[30%] left-[-30px] h-40 w-40 opacity-22 rotate-12" viewBox="0 0 200 200">
            <path d="M70 60 C88 42, 116 48, 126 70 C134 96, 116 122, 88 126 C66 116, 58 84, 70 60 Z" fill="#3f5d3a" />
          </svg>
          <svg className="absolute top-[20%] right-[10%] h-36 w-36 opacity-20 -rotate-6" viewBox="0 0 200 200">
            <path d="M66 64 C82 48, 108 52, 118 74 C126 98, 110 122, 86 126 C68 116, 60 88, 66 64 Z" fill="#287a5d" />
          </svg>
        </div>
        <div className="relative bg-gradient-to-br from-mist via-cream to-ivory px-6 py-10 sm:px-10">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label-eyebrow">Panel financiero</p>
              <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-forest sm:text-5xl">
                Detergente en polvo RENOVA
              </h1>
              <p className="mt-2 max-w-2xl text-base text-forest/70">
                Simulador de costos, nómina, recursos, punto de equilibrio y sostenibilidad
                para el proyecto de maquila en Soacha, Cundinamarca.
              </p>
            </div>
            <div className="card-solid flex items-center gap-3 px-4 py-2 text-sm text-forest/70">
              <span className="h-2 w-2 rounded-full bg-leaf" />
              <span>RENOVA</span>
            </div>
          </header>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <Card eyebrow="Producto" title="Modelo 3D RENOVA">
          <div className="relative h-[440px] overflow-hidden rounded-[1rem] border border-sage/40 bg-gradient-to-br from-mist via-cream to-ivory">
            <ProductViewer
              weightLabel={activeProduct.weightKg === 5 ? "5 kg" : `${activeProduct.weightKg} kg`}
              productCode={activeProduct.code}
            />
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-forest/80 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-cream">
              <span>Vista giratoria</span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => setProductId(product.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  product.id === productId
                    ? "bg-forest text-cream"
                    : "bg-sage/25 text-forest hover:bg-sage/40"
                }`}
              >
                {product.name} ({product.weightKg} kg)
              </button>
            ))}
          </div>
        </Card>

        <Card eyebrow="Simulador" title="Volumen mensual">
          <div className="flex flex-wrap gap-2">
            {VOLUME_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setVolume(preset)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  volume === preset
                    ? "bg-forest text-cream"
                    : "bg-sage/25 text-forest hover:bg-sage/40"
                }`}
              >
                {formatNumber(preset)} und
              </button>
            ))}
            <input
              type="number"
              min={0}
              step={1000}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value) || 0)}
              className="rounded-full border border-sage/60 bg-cream px-4 py-2 text-sm font-semibold text-forest"
            />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Stat
              label="Ingreso a precio de venta"
              value={formatCopShort(simulation.revenueMonth)}
              hint={formatCop(simulation.revenueMonth)}
            />
            <Stat
              label="Costo total mensual"
              value={formatCopShort(simulation.totalCostMonth)}
              hint={formatCop(simulation.totalCostMonth)}
            />
            <Stat
              label="Margen neto mensual"
              value={formatCopShort(simulation.marginMonth)}
              hint={formatCop(simulation.marginMonth)}
              tone={simulation.marginMonth >= 0 ? "good" : "bad"}
            />
            <Stat
              label="Punto de equilibrio"
              value={`${formatNumber(Math.ceil(simulation.breakEvenUnits))} und`}
              hint={
                simulation.breakEvenUnits === Infinity
                  ? "Sin equilibrio con precio actual"
                  : `Incluye fijos + nómina: ${formatCopShort(simulation.breakEvenFixedMonthly)}`
              }
            />
          </div>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Costo total por unidad"
          value={formatCop(simulation.totalCostPerUnit)}
          hint={`Insumos ${formatCop(simulation.costMaterialPerUnit)} + Nómina ${formatCop(simulation.payroll.costPerUnit)} + Fijos ${formatCop(simulation.fixedMonthly / Math.max(1, simulation.volume))}`}
        />
        <Stat
          label="PVP sin IVA"
          value={formatCop(simulation.pvp)}
          hint={`PVP con IVA ${formatCop(simulation.priceToConsumer)}`}
        />
        <Stat
          label="Margen neto por unidad"
          value={formatCop(simulation.netIncomePerUnit)}
          hint={formatPercent(simulation.marginPct)}
          tone={simulation.marginPct >= 0.2 ? "good" : simulation.marginPct > 0 ? "warn" : "bad"}
        />
        <Stat
          label="Margen de contribución"
          value={formatPercent(simulation.contributionPct)}
          hint={`${formatCop(simulation.contributionPerUnit)} por unidad`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card eyebrow="Sostenibilidad" title={`Veredicto: ${sustainability.level.replace("_", " ")}`}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-forest/70">Puntuación</p>
              <p className="font-display text-3xl font-semibold text-forest">
                {(sustainability.score * 100).toFixed(0)}%
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-sage/40">
              <div
                className="h-full bg-gradient-to-r from-leaf to-forest"
                style={{ width: `${sustainability.score * 100}%` }}
              />
            </div>
            <ul className="flex flex-col gap-3">
              {sustainability.checks.map((check) => (
                <li
                  key={check.label}
                  className="flex items-start gap-3 rounded-2xl border border-sage/40 bg-cream/70 px-4 py-3"
                >
                  <span
                    className={`mt-1 h-2 w-2 rounded-full ${
                      check.ok ? "bg-leaf" : "bg-coral"
                    }`}
                  />
                  <div>
                    <p className="font-semibold text-forest">{check.label}</p>
                    <p className="text-sm text-forest/70">{check.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card eyebrow="Resumen" title="Descomposición de costos (por unidad)">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="text-forest/60">
                  <th className="pb-3 font-medium">Concepto</th>
                  <th className="pb-3 text-right font-medium">COP/und</th>
                  <th className="pb-3 text-right font-medium">% del PVP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/30">
                <tr>
                  <td className="py-3 text-forest">Insumos (materia prima + empaque)</td>
                  <td className="py-3 text-right font-medium text-forest">
                    {formatCop(simulation.costMaterialPerUnit)}
                  </td>
                  <td className="py-3 text-right text-forest/70">
                    {formatPercent(simulation.costMaterialPerUnit / Math.max(1, simulation.pvp))}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-forest">Nómina</td>
                  <td className="py-3 text-right font-medium text-forest">
                    {formatCop(simulation.payroll.costPerUnit)}
                  </td>
                  <td className="py-3 text-right text-forest/70">
                    {formatPercent(simulation.payroll.costPerUnit / Math.max(1, simulation.pvp))}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-forest">Costos fijos (recursos recurrentes)</td>
                  <td className="py-3 text-right font-medium text-forest">
                    {formatCop(simulation.fixedMonthly / Math.max(1, simulation.volume))}
                  </td>
                  <td className="py-3 text-right text-forest/70">
                    {formatPercent(
                      (simulation.fixedMonthly / Math.max(1, simulation.volume)) /
                        Math.max(1, simulation.pvp),
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-forest">Indirectos ({formatPercent(dataset?.settings.indirectPct ?? 0.08, 0)})</td>
                  <td className="py-3 text-right font-medium text-forest">
                    {formatCop(simulation.indirectPerUnit)}
                  </td>
                  <td className="py-3 text-right text-forest/70">
                    {formatPercent(simulation.indirectPerUnit / Math.max(1, simulation.pvp))}
                  </td>
                </tr>
                <tr className="bg-sage/15">
                  <td className="py-3 font-semibold text-forest">Costo total</td>
                  <td className="py-3 text-right font-semibold text-forest">
                    {formatCop(simulation.totalCostPerUnit)}
                  </td>
                  <td className="py-3 text-right font-semibold text-forest/70">
                    {formatPercent(simulation.totalCostPerUnit / Math.max(1, simulation.pvp))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="card px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage/25 text-forest">
              <Wallet className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="label-eyebrow">Costos de personal</p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-forest">
                Nómina real del turno
              </h2>
              <p className="text-sm text-forest/70">
                Modelo ilustrativo con factor de carga {formatPercent(FACTOR_CARGA, 0)} ·{" "}
                {formatNumber(payrollResumen.personas)} personas
              </p>
            </div>
          </div>
          <Link
            href="/costos-personal"
            className="rounded-full bg-forest px-5 py-2 text-sm font-semibold text-cream transition hover:bg-leaf"
          >
            Ver desglose
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="card-solid px-5 py-4 sm:col-span-2">
            <p className="label-eyebrow">Costo real mensual</p>
            <p className="mt-1 font-display text-4xl font-semibold tracking-tight text-forest">
              {formatCopShort(payrollResumen.costo)}
            </p>
            <p className="text-sm text-forest/70">{formatCop(payrollResumen.costo)}</p>
            <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-sage/30">
              <div
                className="bg-forest"
                style={{
                  width: `${
                    (payrollResumen.base / Math.max(1, payrollResumen.costo)) * 100
                  }%`,
                }}
              />
              <div
                className="bg-sun"
                style={{
                  width: `${
                    (payrollResumen.cargas / Math.max(1, payrollResumen.costo)) * 100
                  }%`,
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-forest/70">
              <span>
                Salario base{" "}
                {formatPercent(payrollResumen.base / Math.max(1, payrollResumen.costo))}
              </span>
              <span>
                Cargas{" "}
                {formatPercent(payrollResumen.cargas / Math.max(1, payrollResumen.costo))}
              </span>
            </div>
          </div>
          <div className="card-solid flex flex-col justify-center gap-2 px-5 py-4">
            <p className="label-eyebrow">Por unidad</p>
            <p className="font-display text-3xl font-semibold tracking-tight text-forest">
              {formatCop(payrollResumen.porUnidad)}
            </p>
            <p className="text-sm text-forest/70">
              Al volumen de {formatNumber(simulation.volume)} und/mes
            </p>
          </div>
          <div className="card-solid flex flex-col justify-center gap-2 px-5 py-4">
            <p className="label-eyebrow">Factor de carga</p>
            <p className="font-display text-3xl font-semibold tracking-tight text-leaf">
              {FACTOR_CARGA.toFixed(2)}x
            </p>
            <p className="text-sm text-forest/70">
              {formatNumber(payrollResumen.personas)} personas en un turno
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card eyebrow="Meta" title="Cumplimiento frente a la meta">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-forest/70">Volumen / Meta</p>
              <p className="font-semibold text-forest">
                {formatNumber(simulation.volume)} / {formatNumber(simulation.targetUnits)} und
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-sage/40">
              <div
                className="h-full bg-gradient-to-r from-sun to-leaf"
                style={{ width: `${Math.min(100, simulation.targetCompliancePct)}%` }}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-sage/40 px-4 py-3">
                <p className="label-eyebrow">Cumplimiento</p>
                <p className="mt-1 font-display text-2xl font-semibold text-forest">
                  {formatPercent(simulation.targetCompliancePct / 100)}
                </p>
              </div>
              <div className="rounded-2xl border border-sage/40 px-4 py-3">
                <p className="label-eyebrow">Ingresos netos requeridos / esperados</p>
                <p className="mt-1 text-sm text-forest">
                  {formatCop(simulation.targetNetIncome)} / {formatCop(simulation.netIncomeMonth)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card eyebrow="Inversión" title="Recursos únicos vs recurrentes">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-sage/40 px-4 py-3">
              <p className="label-eyebrow">Inversión inicial</p>
              <p className="mt-1 font-display text-2xl font-semibold text-forest">
                {formatCop(simulation.investment)}
              </p>
              <p className="text-sm text-forest/70">
                Tangibles + Intangibles únicos
              </p>
            </div>
            <div className="rounded-2xl border border-sage/40 px-4 py-3">
              <p className="label-eyebrow">Costos fijos mensuales</p>
              <p className="mt-1 font-display text-2xl font-semibold text-forest">
                {formatCop(simulation.fixedMonthly)}
              </p>
              <p className="text-sm text-forest/70">
                Tangibles + Intangibles recurrentes
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="label-eyebrow">Detalle</p>
            <ul className="mt-2 flex flex-col gap-2">
              {(dataset?.resources ?? []).slice(0, 6).map((resource) => (
                <li
                  key={resource.id}
                  className="flex items-center justify-between rounded-2xl border border-sage/40 px-4 py-2 text-sm"
                >
                  <span className="text-forest">
                    {resource.concept}
                    <span className="ml-2 text-forest/50">
                      {resource.kind === "TANGIBLE" ? "Tangible" : "Intangible"} ·{" "}
                      {resource.recurrence === "UNICO" ? "Único" : "Recurrente"}
                    </span>
                  </span>
                  <span className="font-medium text-forest">{formatCop(resource.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </section>
    </div>
  );
}
