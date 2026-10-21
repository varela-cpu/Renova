import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { productSchema } from "@/lib/validation";

export async function GET() {
  const repo = getRepository();
  const products = await repo.listProducts();
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const repo = getRepository();
  const product = await repo.saveProduct(parsed.data);
  return NextResponse.json({ product }, { status: 201 });
}
