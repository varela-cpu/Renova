import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { resourceSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = resourceSchema.safeParse({ ...(body ?? {}), id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const repo = getRepository();
  const resource = await repo.saveResource(parsed.data);
  return NextResponse.json({ resource });
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  const repo = getRepository();
  await repo.deleteResource(id);
  return NextResponse.json({ ok: true });
}
