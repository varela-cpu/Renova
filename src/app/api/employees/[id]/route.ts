import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { employeeSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = employeeSchema.safeParse({ ...(body ?? {}), id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const repo = getRepository();
  const employee = await repo.saveEmployee(parsed.data);
  return NextResponse.json({ employee });
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  const repo = getRepository();
  await repo.deleteEmployee(id);
  return NextResponse.json({ ok: true });
}
