"use client";

import { useState } from "react";
import { useRenova } from "@/components/renova-provider";
import { formatCop } from "@/lib/format";
import type { Resource } from "@/lib/domain";

const EMPTY_RESOURCE: Omit<Resource, "id"> = {
  kind: "TANGIBLE",
  concept: "",
  detail: "",
  value: 0,
  recurrence: "UNICO",
  sortOrder: 0,
};

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-forest">
      <span className="label-eyebrow">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-sage/60 bg-cream px-3 py-2"
      />
    </label>
  );
}

export default function RecursosPage() {
  const { dataset, saveResource, removeResource, saveState } = useRenova();
  const resources = dataset?.resources ?? [];
  const [draft, setDraft] = useState<Omit<Resource, "id"> & { id?: string }>(EMPTY_RESOURCE);
  const [editing, setEditing] = useState<string | null>(null);

  const sorted = [...resources].sort((a, b) => a.kind.localeCompare(b.kind) || a.sortOrder - b.sortOrder);
  const investment = sorted
    .filter((r) => r.recurrence === "UNICO")
    .reduce((acc, r) => acc + r.value, 0);
  const fixed = sorted
    .filter((r) => r.recurrence === "RECURRENTE")
    .reduce((acc, r) => acc + r.value, 0);

  const startEdit = (resource: Resource) => {
    setEditing(resource.id);
    setDraft(resource);
  };

  const reset = () => {
    setEditing(null);
    setDraft({ ...EMPTY_RESOURCE, sortOrder: sorted.length });
  };

  const submit = async () => {
    await saveResource(draft);
    reset();
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="label-eyebrow">Recursos</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-forest">Activos, inversiones y gastos</h1>
        <p className="mt-1 text-forest/70">
          Tangibles e intangibles. Únicos (inversión inicial) o recurrentes (fijos mensuales).
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card-solid px-5 py-4">
          <p className="label-eyebrow">Inversión inicial</p>
          <p className="mt-1 font-display text-3xl font-semibold text-forest">{formatCop(investment)}</p>
        </div>
        <div className="card-solid px-5 py-4">
          <p className="label-eyebrow">Costos fijos mensuales</p>
          <p className="mt-1 font-display text-3xl font-semibold text-forest">{formatCop(fixed)}</p>
        </div>
        <div className="card-solid px-5 py-4">
          <p className="label-eyebrow">Estado</p>
          <p className="mt-1 text-forest/70">
            {saveState === "saving" ? "Guardando..." : saveState === "saved" ? "Guardado" : "Listo"}
          </p>
        </div>
      </section>

      <section className="card overflow-hidden">
        <header className="border-b border-sage/40 px-6 py-4">
          <p className="label-eyebrow">Formulario</p>
          <p className="text-forest">{editing ? "Editar recurso" : "Agregar recurso"}</p>
        </header>
        <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm text-forest">
            <span className="label-eyebrow">Tipo</span>
            <select
              value={draft.kind}
              onChange={(event) => setDraft((d) => ({ ...d, kind: event.target.value as Resource["kind"] }))}
              className="rounded-xl border border-sage/60 bg-cream px-3 py-2"
            >
              <option value="TANGIBLE">Tangible</option>
              <option value="INTANGIBLE">Intangible</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-forest">
            <span className="label-eyebrow">Recurrencia</span>
            <select
              value={draft.recurrence}
              onChange={(event) => setDraft((d) => ({ ...d, recurrence: event.target.value as Resource["recurrence"] }))}
              className="rounded-xl border border-sage/60 bg-cream px-3 py-2"
            >
              <option value="UNICO">Único (inversión)</option>
              <option value="RECURRENTE">Recurrente (mensual)</option>
            </select>
          </label>
          <Input label="Concepto" value={draft.concept} onChange={(v) => setDraft((d) => ({ ...d, concept: v }))} />
          <Input label="Detalle" value={draft.detail} onChange={(v) => setDraft((d) => ({ ...d, detail: v }))} />
          <Input label="Valor (COP)" type="number" value={draft.value} onChange={(v) => setDraft((d) => ({ ...d, value: Number(v) || 0 }))} />
          <Input label="Orden" type="number" value={draft.sortOrder} onChange={(v) => setDraft((d) => ({ ...d, sortOrder: Number(v) || 0 }))} />
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-sage/40 px-6 py-4">
          <button onClick={submit} className="rounded-full bg-forest px-5 py-2 text-sm font-semibold text-cream">
            {editing ? "Guardar cambios" : "Agregar"}
          </button>
          <button onClick={reset} className="rounded-full px-5 py-2 text-sm font-semibold text-forest/70">
            Cancelar
          </button>
        </div>
      </section>

      <section className="card overflow-hidden">
        <header className="border-b border-sage/40 px-6 py-4">
          <p className="label-eyebrow">Listado</p>
          <p className="text-forest">{sorted.length} recursos</p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="text-forest/60">
                <th className="px-6 py-3 font-medium">Concepto</th>
                <th className="px-6 py-3 font-medium">Tipo</th>
                <th className="px-6 py-3 font-medium">Recurrencia</th>
                <th className="px-6 py-3 font-medium">Detalle</th>
                <th className="px-6 py-3 text-right font-medium">Valor</th>
                <th className="px-6 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/30">
              {sorted.map((resource) => (
                <tr key={resource.id}>
                  <td className="px-6 py-3 font-semibold text-forest">{resource.concept}</td>
                  <td className="px-6 py-3 text-forest/70">{resource.kind === "TANGIBLE" ? "Tangible" : "Intangible"}</td>
                  <td className="px-6 py-3 text-forest/70">{resource.recurrence === "UNICO" ? "Único" : "Recurrente"}</td>
                  <td className="px-6 py-3 text-forest/70">{resource.detail || "-"}</td>
                  <td className="px-6 py-3 text-right font-medium text-forest">{formatCop(resource.value)}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => startEdit(resource)} className="px-3 py-1 text-forest/70">
                      Editar
                    </button>
                    <button onClick={() => removeResource(resource.id)} className="px-3 py-1 text-coral">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
