import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";

/** Restablece toda la base de datos a los valores semilla de la ficha técnica. */
export async function POST() {
  const repo = getRepository();
  const dataset = await repo.reset();
  return NextResponse.json({ ok: true, dataset });
}
