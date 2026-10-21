import { NextResponse } from "next/server";
import { getRepository, repositoryKind } from "@/lib/data";

/** Dataset completo: lo consume el dashboard y las matrices editables. */
export async function GET() {
  const repo = getRepository();
  const [materials, employees, resources, products, settings] = await Promise.all([
    repo.listMaterials(),
    repo.listEmployees(),
    repo.listResources(),
    repo.listProducts(),
    repo.getSettings(),
  ]);

  return NextResponse.json({
    materials,
    employees,
    resources,
    products,
    settings,
    source: repositoryKind(),
  });
}
