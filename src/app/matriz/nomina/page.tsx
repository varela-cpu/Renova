"use client";

import { useMemo, useState } from "react";
import { useRenova } from "@/components/renova-provider";
import { formatCop } from "@/lib/format";
import { CONTRACT_TYPES } from "@/lib/domain";
import type { Employee } from "@/lib/domain";
import { computePayroll } from "@/lib/calc";

const EMPTY_EMPLOYEE: Omit<Employee, "id"> = {
  position: "",
  contractType: "Indefinido",
  headcount: 1,
  baseSalary: 0,
  benefitsPct: 0,
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

export default function NominaPage() {
  const { dataset, saveEmployee, removeEmployee, saveState } = useRenova();
  const employees = dataset?.employees ?? [];
  const [draft, setDraft] = useState<Omit<Employee, "id"> & { id?: string }>(EMPTY_EMPLOYEE);
  const [editing, setEditing] = useState<string | null>(null);

  const payroll = useMemo(() => computePayroll(employees, 1), [employees]);
  const sorted = payroll.rows;
  const totalPeople = payroll.totalPeople;
  const totalMonth = payroll.totalMonth;

  const startEdit = (employee: Employee) => {
    setEditing(employee.id);
    setDraft(employee);
  };

  const reset = () => {
    setEditing(null);
    setDraft({ ...EMPTY_EMPLOYEE, sortOrder: sorted.length });
  };

  const submit = async () => {
    await saveEmployee(draft);
    reset();
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="label-eyebrow">Matriz</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-forest">Nómina</h1>
        <p className="mt-1 text-forest/70">
          Nómina con liquidación detallada (prestaciones, aportes, auxilio). Control de calidad externo:{" "}
          {formatCop(payroll.externalQualityMonth)}/mes aparte.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card-solid px-5 py-4">
          <p className="label-eyebrow">Total personas</p>
          <p className="mt-1 font-display text-3xl font-semibold text-forest">{totalPeople}</p>
        </div>
        <div className="card-solid px-5 py-4">
          <p className="label-eyebrow">Costo mensual total</p>
          <p className="mt-1 font-display text-3xl font-semibold text-forest">{formatCop(totalMonth)}</p>
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
          <p className="text-forest">{editing ? "Editar cargo" : "Agregar cargo"}</p>
        </header>
        <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
          <Input label="Cargo" value={draft.position} onChange={(v) => setDraft((d) => ({ ...d, position: v }))} />
          <label className="flex flex-col gap-1 text-sm text-forest">
            <span className="label-eyebrow">Tipo de contrato</span>
            <select
              value={draft.contractType}
              onChange={(event) => setDraft((d) => ({ ...d, contractType: event.target.value }))}
              className="rounded-xl border border-sage/60 bg-cream px-3 py-2"
            >
              {CONTRACT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <Input label="Personas" type="number" value={draft.headcount} onChange={(v) => setDraft((d) => ({ ...d, headcount: Number(v) || 0 }))} />
          <Input label="Salario base (COP)" type="number" value={draft.baseSalary} onChange={(v) => setDraft((d) => ({ ...d, baseSalary: Number(v) || 0 }))} />
          <Input label="Orden" type="number" value={draft.sortOrder} onChange={(v) => setDraft((d) => ({ ...d, sortOrder: Number(v) || 0 }))} />
          <div className="flex flex-col gap-1 text-sm text-forest">
            <span className="label-eyebrow">Prestaciones/cargas</span>
            <div className="rounded-xl border border-sage/40 bg-sage/10 px-3 py-2 text-forest/70">
              Calculadas automáticamente por liquidación detallada
            </div>
          </div>
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
          <p className="text-forest">{sorted.length} cargos</p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="text-forest/60">
                <th className="px-6 py-3 font-medium">Cargo</th>
                <th className="px-6 py-3 font-medium">Contrato</th>
                <th className="px-6 py-3 text-right font-medium">Personas</th>
                <th className="px-6 py-3 text-right font-medium">Salario base</th>
                <th className="px-6 py-3 text-right font-medium">Prestaciones</th>
                <th className="px-6 py-3 text-right font-medium">Costo/persona</th>
                <th className="px-6 py-3 text-right font-medium">Costo mensual</th>
                <th className="px-6 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/30">
              {sorted.map((employee) => {
                return (
                  <tr key={employee.id}>
                    <td className="px-6 py-3 font-semibold text-forest">{employee.position}</td>
                    <td className="px-6 py-3 text-forest/70">{employee.contractType}</td>
                    <td className="px-6 py-3 text-right text-forest">{employee.headcount}</td>
                    <td className="px-6 py-3 text-right text-forest">{formatCop(employee.baseSalary)}</td>
                    <td className="px-6 py-3 text-right text-forest/70">{(employee.benefitsPct * 100).toFixed(2)}%</td>
                    <td className="px-6 py-3 text-right text-forest">{formatCop(employee.costPerPerson)}</td>
                    <td className="px-6 py-3 text-right font-medium text-forest">{formatCop(employee.costTotalMonth)}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => startEdit(employee)} className="px-3 py-1 text-forest/70">
                        Editar
                      </button>
                      <button onClick={() => removeEmployee(employee.id)} className="px-3 py-1 text-coral">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
