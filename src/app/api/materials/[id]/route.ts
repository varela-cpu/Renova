import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { materialSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = materialSchema.safeParse({ ...(body ?? {}), id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const repo = getRepository();
  const material = await repo.saveMaterial(parsed.data);
  return NextResponse.json({ material });
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  const repo = getRepository();
  await repo.deleteMaterial(id);
  return NextResponse.json({ ok: true });
}
