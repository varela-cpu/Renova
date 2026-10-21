"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { computeSimulation, type Simulation } from "@/lib/calc";
import type {
  Dataset,
  Employee,
  Material,
  Product,
  Resource,
  Settings,
} from "@/lib/domain";

type SaveState = "idle" | "saving" | "saved" | "error";

type RenovaContextValue = {
  status: "loading" | "ready" | "error";
  error: string | null;
  saveState: SaveState;
  dataset: Dataset | null;
  source: "postgres" | "local" | null;
  /** volumen mensual simulado */
  volume: number;
  setVolume: (value: number) => void;
  /** presentación activa */
  productId: string;
  setProductId: (id: string) => void;
  simulation: Simulation | null;
  refresh: () => Promise<void>;
  saveMaterial: (material: Omit<Material, "id"> & { id?: string }) => Promise<void>;
  removeMaterial: (id: string) => Promise<void>;
  saveEmployee: (employee: Omit<Employee, "id"> & { id?: string }) => Promise<void>;
  removeEmployee: (id: string) => Promise<void>;
  saveResource: (resource: Omit<Resource, "id"> & { id?: string }) => Promise<void>;
  removeResource: (id: string) => Promise<void>;
  saveProduct: (product: Omit<Product, "id"> & { id?: string }) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  saveSettings: (settings: Settings) => Promise<void>;
  resetDataset: () => Promise<void>;
};

const RenovaContext = createContext<RenovaContextValue | null>(null);

export function RenovaProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<RenovaContextValue["status"]>("loading");
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [source, setSource] = useState<"postgres" | "local" | null>(null);
  const [volume, setVolumeState] = useState(100000);
  const [productId, setProductIdState] = useState("prd-005");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/dataset", { cache: "no-store" });
      if (!response.ok) throw new Error("No se pudo cargar el dataset");
      const data = await response.json();
      setDataset(data);
      setSource(data.source ?? "local");
      setVolumeState(data.settings.monthlyVolume);
      setProductIdState(data.settings.activeProductId);
      setStatus("ready");
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error desconocido");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/dataset", { cache: "no-store" });
        if (!response.ok) throw new Error("No se pudo cargar el dataset");
        const data = await response.json();
        if (cancelled) return;
        setDataset(data);
        setSource(data.source ?? "local");
        setVolumeState(data.settings.monthlyVolume);
        setProductIdState(data.settings.activeProductId);
        setStatus("ready");
        setError(null);
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Error desconocido");
        setStatus("error");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(
    async (request: () => Promise<Response>) => {
      setSaveState("saving");
      try {
        const response = await request();
        if (!response.ok) {
          const detail = await response.json().catch(() => null);
          throw new Error(detail?.error ?? "No se pudo guardar el cambio");
        }
        setSaveState("saved");
        await refresh();
        setTimeout(() => setSaveState("idle"), 1600);
      } catch (cause) {
        setSaveState("error");
        setError(cause instanceof Error ? cause.message : "Error al guardar");
        throw cause;
      }
    },
    [refresh],
  );

  const saveMaterial = useCallback(
    (material: Omit<Material, "id"> & { id?: string }) =>
      persist(async () => {
        const url = material.id ? `/api/materials/${material.id}` : "/api/materials";
        return fetch(url, {
          method: material.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(material),
        });
      }),
    [persist],
  );

  const removeMaterial = useCallback(
    (id: string) =>
      persist(() => fetch(`/api/materials/${id}`, { method: "DELETE" })),
    [persist],
  );

  const saveEmployee = useCallback(
    (employee: Omit<Employee, "id"> & { id?: string }) =>
      persist(async () => {
        const url = employee.id
          ? `/api/employees/${employee.id}`
          : "/api/employees";
        return fetch(url, {
          method: employee.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(employee),
        });
      }),
    [persist],
  );

  const removeEmployee = useCallback(
    (id: string) =>
      persist(() => fetch(`/api/employees/${id}`, { method: "DELETE" })),
    [persist],
  );

  const saveResource = useCallback(
    (resource: Omit<Resource, "id"> & { id?: string }) =>
      persist(async () => {
        const url = resource.id
          ? `/api/resources/${resource.id}`
          : "/api/resources";
        return fetch(url, {
          method: resource.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resource),
        });
      }),
    [persist],
  );

  const removeResource = useCallback(
    (id: string) =>
      persist(() => fetch(`/api/resources/${id}`, { method: "DELETE" })),
    [persist],
  );

  const saveProduct = useCallback(
    (product: Omit<Product, "id"> & { id?: string }) =>
      persist(async () => {
        const url = product.id ? `/api/products/${product.id}` : "/api/products";
        return fetch(url, {
          method: product.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(product),
        });
      }),
    [persist],
  );

  const removeProduct = useCallback(
    (id: string) =>
      persist(() => fetch(`/api/products/${id}`, { method: "DELETE" })),
    [persist],
  );

  const saveSettings = useCallback(
    (settings: Settings) =>
      persist(() =>
        fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        }),
      ),
    [persist],
  );

  const resetDataset = useCallback(
    () => persist(() => fetch("/api/reset", { method: "POST" })),
    [persist],
  );

  const simulation = useMemo(() => {
    if (!dataset) return null;
    const product =
      dataset.products.find((p) => p.id === productId) ??
      dataset.products[0] ??
      null;
    if (!product) return null;
    return computeSimulation({
      volume,
      product,
      materials: dataset.materials,
      employees: dataset.employees,
      resources: dataset.resources,
      settings: dataset.settings,
    });
  }, [dataset, productId, volume]);

  const value = useMemo<RenovaContextValue>(
    () => ({
      status,
      error,
      saveState,
      dataset,
      source,
      volume,
      setVolume: setVolumeState,
      productId,
      setProductId: setProductIdState,
      simulation,
      refresh,
      saveMaterial,
      removeMaterial,
      saveEmployee,
      removeEmployee,
      saveResource,
      removeResource,
      saveProduct,
      removeProduct,
      saveSettings,
      resetDataset,
    }),
    [
      status,
      error,
      saveState,
      dataset,
      source,
      volume,
      productId,
      simulation,
      refresh,
      saveMaterial,
      removeMaterial,
      saveEmployee,
      removeEmployee,
      saveResource,
      removeResource,
      saveProduct,
      removeProduct,
      saveSettings,
      resetDataset,
    ],
  );

  return <RenovaContext.Provider value={value}>{children}</RenovaContext.Provider>;
}

export function useRenova(): RenovaContextValue {
  const context = useContext(RenovaContext);
  if (!context) {
    throw new Error("useRenova debe usarse dentro de <RenovaProvider>");
  }
  return context;
}
