import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { employeeSchema } from "@/lib/validation";

export async function GET() {
  const repo = getRepository();
  const employees = await repo.listEmployees();
  return NextResponse.json({ employees });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = employeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const repo = getRepository();
  const employee = await repo.saveEmployee(parsed.data);
  return NextResponse.json({ employee }, { status: 201 });
}
