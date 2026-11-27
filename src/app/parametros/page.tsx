"use client";

import { useEffect, useState } from "react";
import { useRenova } from "@/components/renova-provider";
import { DEFAULT_SETTINGS } from "@/lib/domain";
import type { Settings } from "@/lib/domain";
import { formatPercent } from "@/lib/format";

export default function ParametrosPage() {
  const { dataset, saveSettings, resetDataset, saveState } = useRenova();
  const serverSettings = dataset?.settings ?? null;
  const [form, setForm] = useState<Settings>(serverSettings ?? DEFAULT_SETTINGS);
  const [lastSeenAt, setLastSeenAt] = useState<number | null>(serverSettings ? 0 : null);

  useEffect(() => {
    if (serverSettings && lastSeenAt === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(serverSettings);
      setLastSeenAt(Date.now());
    }
  }, [serverSettings, lastSeenAt]);

  const submit = async () => {
    await saveSettings(form);
  };

  const reset = async () => {
    if (confirm("Â¿Restablecer todo el dataset a los valores semilla de la ficha tÃ©cnica?")) {
      await resetDataset();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="label-eyebrow">ParÃ¡metros</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-forest">ConfiguraciÃ³n del simulador</h1>
        <p className="mt-1 text-forest/70">
          IVA, costos indirectos, meta mensual, presentaciÃ³n activa y umbral de sostenibilidad.
        </p>
      </header>

      <section className="card overflow-hidden">
        <header className="flex items-center justify-between border-b border-sage/40 px-6 py-4">
          <div>
            <p className="label-eyebrow">Formulario</p>
            <p className="text-forest">Ajustes generales</p>
          </div>
          <div className="text-sm text-forest/60">
            {saveState === "saving" ? "Guardando..." : saveState === "saved" ? "Guardado" : "Listo"}
          </div>
        </header>
        <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm text-forest">
            <span className="label-eyebrow">IVA (%)</span>
            <input
              type="number"
              step="0.01"
              value={(form.ivaPct * 100).toFixed(0)}
              onChange={(event) =>
                setForm((f) => ({ ...f, ivaPct: (Number(event.target.value) || 0) / 100 }))
              }
              className="rounded-xl border border-sage/60 bg-cream px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-forest">
            <span className="label-eyebrow">Costos indirectos (% sobre insumos)</span>
            <input
              type="number"
              step="0.01"
              value={(form.indirectPct * 100).toFixed(0)}
              onChange={(event) =>
                setForm((f) => ({ ...f, indirectPct: (Number(event.target.value) || 0) / 100 }))
              }
              className="rounded-xl border border-sage/60 bg-cream px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-forest">
            <span className="label-eyebrow">Meta mensual (unidades)</span>
            <input
              type="number"
              value={form.targetUnits}
              onChange={(event) => setForm((f) => ({ ...f, targetUnits: Number(event.target.value) || 0 }))}
              className="rounded-xl border border-sage/60 bg-cream px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-forest">
            <span className="label-eyebrow">Volumen mensual simulado</span>
            <input
              type="number"
              value={form.monthlyVolume}
              onChange={(event) => setForm((f) => ({ ...f, monthlyVolume: Number(event.target.value) || 0 }))}
              className="rounded-xl border border-sage/60 bg-cream px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-forest">
            <span className="label-eyebrow">Margen mÃ­nimo para sostenibilidad</span>
            <input
              type="number"
              step="0.01"
              value={(form.minMarginPct * 100).toFixed(0)}
              onChange={(event) =>
                setForm((f) => ({ ...f, minMarginPct: (Number(event.target.value) || 0) / 100 }))
              }
              className="rounded-xl border border-sage/60 bg-cream px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-forest">
            <span className="label-eyebrow">PresentaciÃ³n activa</span>
            <select
              value={form.activeProductId}
              onChange={(event) => setForm((f) => ({ ...f, activeProductId: event.target.value }))}
              className="rounded-xl border border-sage/60 bg-cream px-3 py-2"
            >
              {(dataset?.products ?? []).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.weightKg} kg) - {product.code}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-sage/40 px-6 py-4">
          <button onClick={submit} className="rounded-full bg-forest px-5 py-2 text-sm font-semibold text-cream">
            Guardar parÃ¡metros
          </button>
          <button onClick={reset} className="rounded-full px-5 py-2 text-sm font-semibold text-coral">
            Restablecer dataset
          </button>
          <p className="text-sm text-forest/60">
            IVA {formatPercent(form.ivaPct)}, Indirectos {formatPercent(form.indirectPct)}, Margen mÃ­nimo{" "}
            {formatPercent(form.minMarginPct)}
          </p>
        </div>
      </section>
    </div>
  );
}

