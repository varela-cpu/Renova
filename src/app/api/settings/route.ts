import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { settingsSchema } from "@/lib/validation";

export async function GET() {
  const repo = getRepository();
  const settings = await repo.getSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const repo = getRepository();
  const settings = await repo.saveSettings(parsed.data);
  return NextResponse.json({ settings });
}
