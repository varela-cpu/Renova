import { NextResponse } from "next/server";
import { computeSimulation } from "@/lib/calc";
import { getRepository } from "@/lib/data";
import { volumeSchema } from "@/lib/validation";

/**
 * Simulación financiera en el servidor.
 * GET /api/simulate?volume=100000&productId=prd-005
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = volumeSchema.safeParse(url.searchParams.get("volume") ?? undefined);
  if (!parsed.success) {
    return NextResponse.json({ error: "Volumen inválido" }, { status: 400 });
  }

  const repo = getRepository();
  const [materials, employees, resources, products, settings] = await Promise.all([
    repo.listMaterials(),
    repo.listEmployees(),
    repo.listResources(),
    repo.listProducts(),
    repo.getSettings(),
  ]);

  const productId = url.searchParams.get("productId") ?? settings.activeProductId;
  const product = products.find((p) => p.id === productId) ?? products[0];
  if (!product) {
    return NextResponse.json({ error: "Sin presentaciones" }, { status: 404 });
  }

  const simulation = computeSimulation({
    volume: parsed.data,
    product,
    materials,
    employees,
    resources,
    settings,
  });

  return NextResponse.json({ simulation });
}
