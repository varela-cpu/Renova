"use client";

import { useMemo } from "react";
import { useRenova } from "@/components/renova-provider";
import { ProductViewer } from "@/components/three/product-viewer";
import { formatCop, formatCopShort, formatNumber, formatPercent } from "@/lib/format";
import { VOLUME_PRESETS } from "@/lib/domain";

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
  const { status, error, dataset, volume, setVolume, productId, setProductId, simulation, source } =
    useRenova();

  const products = useMemo(() => dataset?.products ?? [], [dataset?.products]);
  const activeProduct = useMemo(
    () => products.find((p) => p.id === productId) ?? products[0] ?? null,
    [products, productId],
  );

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
          <span
            className={`h-2 w-2 rounded-full ${
              source === "postgres" ? "bg-leaf" : "bg-sun"
            }`}
          />
          <span>
            Fuente: {source === "postgres" ? "Neon + Prisma" : "Archivo local (data/renova.json)"}
          </span>
        </div>
      </header>

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
                  : `Faltan/sobran: ${formatNumber(simulation.targetGap)} frente a meta`
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
