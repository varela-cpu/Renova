import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { materialSchema } from "@/lib/validation";

export async function GET() {
  const repo = getRepository();
  const materials = await repo.listMaterials();
  return NextResponse.json({ materials });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = materialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const repo = getRepository();
  const material = await repo.saveMaterial(parsed.data);
  return NextResponse.json({ material }, { status: 201 });
}
