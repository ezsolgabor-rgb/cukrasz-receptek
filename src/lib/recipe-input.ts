import { z } from "zod";

/**
 * A szerkesztőből beérkező adat ellenőrzése. Ez az egyetlen „bejárat”,
 * itt nem bízunk a felületben: minden mentés ezen megy át.
 */

const ingredientInput = z.object({
  groupName: z.string().trim().nullable(),
  name: z.string().trim().min(1),
  quantity: z.number().nonnegative().nullable(),
  unitId: z.string().nullable(),
  note: z.string().trim().nullable(),
  scalable: z.boolean(),
  componentRecipeId: z.string().nullable(),
});

const stepInput = z.object({
  text: z.string().trim().min(1),
  durationMinutes: z.number().int().nonnegative().nullable(),
  temperatureC: z.number().int().min(-50).max(400).nullable(),
  note: z.string().trim().nullable(),
  photoFileName: z.string().trim().nullable(),
});

export const recipeInput = z.object({
  id: z.string().nullable(),
  name: z.string().trim().min(1),
  categoryId: z.string().nullable(),
  description: z.string().trim().nullable(),
  baseYieldQty: z.number().positive(),
  baseYieldUnitId: z.string().min(1),
  yieldNote: z.string().trim().nullable(),
  prepMinutes: z.number().int().nonnegative().max(10000).nullable(),
  bakeMinutes: z.number().int().nonnegative().max(10000).nullable(),
  bakeTemperatureC: z.number().int().min(0).max(400).nullable(),
  difficulty: z.number().int().min(1).max(5).nullable(),
  source: z.string().trim().nullable(),
  notes: z.string().trim().nullable(),
  isFavorite: z.boolean(),
  usualYieldQty: z.number().positive().nullable(),
  usualYieldNote: z.string().trim().nullable(),
  tagNames: z.array(z.string().trim().min(1)).max(30),
  ingredients: z.array(ingredientInput).max(200),
  steps: z.array(stepInput).max(100),
});

export type RecipeInput = z.infer<typeof recipeInput>;

/** Emberi nyelvű mezőnevek a hibaüzenetekhez. */
const FIELD_LABELS: Record<string, string> = {
  name: "Recept neve",
  baseYieldQty: "Alapadag",
  baseYieldUnitId: "Adag mértékegysége",
  ingredients: "Hozzávalók",
  steps: "Elkészítés lépései",
  usualYieldQty: "Szokásos adag",
  componentRecipeId: "Alaprecept",
  difficulty: "Nehézség",
  bakeTemperatureC: "Sütési hőmérséklet",
};

/** A validációs hibákból olvasható magyar mondatokat készítünk. */
export function describeIssues(
  issues: { path: PropertyKey[]; message: string; code?: string }[],
): string[] {
  return issues.map((issue) => {
    const field = String(issue.path[0] ?? "");
    const label = FIELD_LABELS[field] || field || "Adat";

    if (issue.code === "too_small") {
      return `${label}: kötelező megadni (nem lehet üres vagy nulla).`;
    }
    if (issue.code === "too_big") {
      return `${label}: túl nagy érték.`;
    }
    if (issue.code === "invalid_type") {
      return `${label}: hiányos vagy hibás adat.`;
    }
    return `${label}: ${issue.message}`;
  });
}
