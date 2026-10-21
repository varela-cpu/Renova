import { z } from "zod";
import { CONTRACT_TYPES } from "@/lib/domain";

const nonNegative = z.number().finite().min(0);
const nonEmpty = z.string().trim().min(1, "Este campo es obligatorio");
const optionalText = z.string().trim().default("");

export const materialSchema = z
  .object({
    id: z.string().optional(),
    name: nonEmpty,
    supplier: optionalText,
    reference: optionalText,
    unit: z.string().trim().min(1).default("kg"),
    compositionPct: z.number().finite().min(0).max(100).nullable().default(null),
    unitsPerProduct: nonNegative.default(0),
    unitCost: nonNegative.default(0),
    isPackaging: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
  })
  .refine(
    (m) => m.compositionPct != null || m.unitsPerProduct > 0,
    {
      message:
        "Define el % de composición o las unidades por producto para calcular la cantidad",
      path: ["compositionPct"],
    },
  );

export const employeeSchema = z.object({
  id: z.string().optional(),
  position: nonEmpty,
  contractType: z.enum(CONTRACT_TYPES).or(z.string().trim().min(1)),
  headcount: z.number().int().min(0).max(1000).default(1),
  baseSalary: nonNegative.default(0),
  benefitsPct: z.number().finite().min(0).max(5).default(0.55),
  sortOrder: z.number().int().default(0),
});

export const resourceSchema = z.object({
  id: z.string().optional(),
  kind: z.enum(["TANGIBLE", "INTANGIBLE"]),
  concept: nonEmpty,
  detail: optionalText,
  value: nonNegative.default(0),
  recurrence: z.enum(["UNICO", "RECURRENTE"]),
  sortOrder: z.number().int().default(0),
});

export const productSchema = z.object({
  id: z.string().optional(),
  code: nonEmpty,
  name: nonEmpty,
  weightKg: z.number().finite().min(0.01),
  pvp: nonNegative.default(0),
});

export const settingsSchema = z.object({
  currency: z.literal("COP").default("COP"),
  ivaPct: z.number().finite().min(0).max(1).default(0.19),
  indirectPct: z.number().finite().min(0).max(5).default(0.08),
  targetUnits: z.number().int().min(0).default(100000),
  activeProductId: z.string().trim().min(1),
  monthlyVolume: z.number().int().min(0).default(100000),
  minMarginPct: z.number().finite().min(0).max(1).default(0.2),
});

export const volumeSchema = z.coerce
  .number()
  .int()
  .min(0)
  .max(100_000_000)
  .default(100000);
