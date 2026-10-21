"use client";

import { useState } from "react";
import { useRenova } from "@/components/renova-provider";
import { formatCop } from "@/lib/format";
import type { Material } from "@/lib/domain";

const EMPTY_MATERIAL: Omit<Material, "id"> = {
  name: "",
  supplier: "",
  reference: "",
  unit: "kg",
  compositionPct: null,
  unitsPerProduct: 0,
  unitCost: 0,
  isPackaging: false,
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

export default function InsumosPage() {
  const { dataset, saveMaterial, removeMaterial, saveState } = useRenova();
  const materials = dataset?.materials ?? [];
  const [draft, setDraft] = useState<Omit<Material, "id"> & { id?: string }>(EMPTY_MATERIAL);
  const [editing, setEditing] = useState<string | null>(null);

  const sorted = [...materials].sort((a, b) => a.sortOrder - b.sortOrder);

  const startEdit = (material: Material) => {
    setEditing(material.id);
    setDraft(material);
  };

  const reset = () => {
    setEditing(null);
    setDraft({ ...EMPTY_MATERIAL, sortOrder: sorted.length });
  };

  const submit = async () => {
    await saveMaterial(draft);
    reset();
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="label-eyebrow">Matriz</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-forest">Insumos y empaque</h1>
        <p className="mt-1 text-forest/70">
          Materia prima con % de composición, insumos por unidad o empaque. Los cálculos usan la
          ficha técnica como referencia editable.
        </p>
      </header>

      <section className="card overflow-hidden">
        <header className="flex items-center justify-between border-b border-sage/40 px-6 py-4">
          <div>
            <p className="label-eyebrow">Formulario</p>
            <p className="text-forest">
              {editing ? "Editar insumo" : "Agregar insumo"}
            </p>
          </div>
          <div className="text-sm text-forest/60">
            Estado: {saveState === "saving" ? "Guardando..." : saveState === "saved" ? "Guardado" : "Listo"}
          </div>
        </header>
        <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
          <Input label="Nombre" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
          <Input label="Proveedor" value={draft.supplier} onChange={(v) => setDraft((d) => ({ ...d, supplier: v }))} />
          <Input label="Referencia" value={draft.reference} onChange={(v) => setDraft((d) => ({ ...d, reference: v }))} />
          <Input label="Unidad" value={draft.unit} onChange={(v) => setDraft((d) => ({ ...d, unit: v }))} />
          <Input
            label="% Composición"
            type="number"
            value={draft.compositionPct ?? ""}
            onChange={(v) => setDraft((d) => ({ ...d, compositionPct: v === "" ? null : Number(v) }))}
          />
          <Input
            label="Und / producto"
            type="number"
            value={draft.unitsPerProduct}
            onChange={(v) => setDraft((d) => ({ ...d, unitsPerProduct: Number(v) || 0 }))}
          />
          <Input
            label="Costo unitario (COP)"
            type="number"
            value={draft.unitCost}
            onChange={(v) => setDraft((d) => ({ ...d, unitCost: Number(v) || 0 }))}
          />
          <Input
            label="Orden"
            type="number"
            value={draft.sortOrder}
            onChange={(v) => setDraft((d) => ({ ...d, sortOrder: Number(v) || 0 }))}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-sage/40 px-6 py-4">
          <label className="flex items-center gap-2 text-sm text-forest">
            <input
              type="checkbox"
              checked={draft.isPackaging}
              onChange={(event) => setDraft((d) => ({ ...d, isPackaging: event.target.checked }))}
            />
            Es empaque
          </label>
          <button
            onClick={submit}
            className="rounded-full bg-forest px-5 py-2 text-sm font-semibold text-cream"
          >
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
          <p className="text-forest">{materials.length} registros</p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="text-forest/60">
                <th className="px-6 py-3 font-medium">Insumo</th>
                <th className="px-6 py-3 font-medium">Proveedor</th>
                <th className="px-6 py-3 font-medium">Unidad</th>
                <th className="px-6 py-3 text-right font-medium">% Composición</th>
                <th className="px-6 py-3 text-right font-medium">Und/Producto</th>
                <th className="px-6 py-3 text-right font-medium">Costo unitario</th>
                <th className="px-6 py-3 text-center font-medium">Empaque</th>
                <th className="px-6 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/30">
              {sorted.map((material) => (
                <tr key={material.id}>
                  <td className="px-6 py-3">
                    <p className="font-semibold text-forest">{material.name}</p>
                    <p className="text-forest/50">{material.reference || "-"}</p>
                  </td>
                  <td className="px-6 py-3 text-forest/70">{material.supplier || "-"}</td>
                  <td className="px-6 py-3 text-forest/70">{material.unit}</td>
                  <td className="px-6 py-3 text-right text-forest">
                    {material.compositionPct == null ? "-" : `${material.compositionPct}%`}
                  </td>
                  <td className="px-6 py-3 text-right text-forest">{material.unitsPerProduct}</td>
                  <td className="px-6 py-3 text-right text-forest">{formatCop(material.unitCost)}</td>
                  <td className="px-6 py-3 text-center text-forest/70">
                    {material.isPackaging ? "Sí" : "No"}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => startEdit(material)} className="px-3 py-1 text-forest/70">
                      Editar
                    </button>
                    <button
                      onClick={() => removeMaterial(material.id)}
                      className="px-3 py-1 text-coral"
                    >
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
