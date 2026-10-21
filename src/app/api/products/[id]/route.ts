import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { productSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse({ ...(body ?? {}), id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const repo = getRepository();
  const product = await repo.saveProduct(parsed.data);
  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  const repo = getRepository();
  await repo.deleteProduct(id);
  return NextResponse.json({ ok: true });
}
