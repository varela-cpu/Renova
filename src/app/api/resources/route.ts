import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { resourceSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const kind = new URL(request.url).searchParams.get("kind");
  const repo = getRepository();
  const all = await repo.listResources();
  const resources = kind ? all.filter((r) => r.kind === kind) : all;
  return NextResponse.json({ resources });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const repo = getRepository();
  const resource = await repo.saveResource(parsed.data);
  return NextResponse.json({ resource }, { status: 201 });
}
