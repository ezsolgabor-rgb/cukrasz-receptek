import { z } from "zod";

/**
 * A szerkesztőből beérkező adat ellenőrzése. Ez az egyetlen „bejárat”,
 * itt nem bízunk a felületben: minden mentés ezen megy át.
 */

const photoInput = z.object({
  id: z.string().optional().nullable(),
  fileName: z.string().trim().min(1),
  caption: z.string().trim().optional().nullable(),
  isCover: z.boolean().default(false),
});

const ingredientInput = z.object({
  id: z.string().optional().nullable(),
  groupName: z.string().trim().optional().nullable(),
  name: z.string().trim().min(1),
  quantity: z.number().nonnegative().optional().nullable(),
  unitId: z.string().optional().nullable(),
  note: z.string().trim().optional().nullable(),
  scalable: z.boolean().default(true),
  componentRecipeId: z.string().optional().nullable(),
});

const stepInput = z.object({
  id: z.string().optional().nullable(),
  text: z.string().trim().min(1),
  durationMinutes: z.number().int().nonnegative().optional().nullable(),
  temperatureC: z.number().int().min(-50).max(400).optional().nullable(),
  note: z.string().trim().optional().nullable(),
  photoFileName: z.string().trim().optional().nullable(),
});

export const recipeInput = z.object({
  id: z.string().optional().nullable(),
  name: z.string().trim().min(1),
  categoryId: z.string().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  baseYieldQty: z.number().positive(),
  baseYieldUnitId: z.string().min(1),
  yieldNote: z.string().trim().optional().nullable(),
  prepMinutes: z.number().int().nonnegative().max(10000).optional().nullable(),
  bakeMinutes: z.number().int().nonnegative().max(10000).optional().nullable(),
  bakeTemperatureC: z.number().int().min(0).max(400).optional().nullable(),
  difficulty: z.number().int().min(1).max(5).optional().nullable(),
  source: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  isFavorite: z.boolean().default(false),
  usualYieldQty: z.number().positive().optional().nullable(),
  usualYieldNote: z.string().trim().optional().nullable(),
  tagNames: z.array(z.string().trim().min(1)).max(30).optional().default([]),
  ingredients: z.array(ingredientInput).max(200),
  steps: z.array(stepInput).max(100),
  photos: z.array(photoInput).optional().default([]),
});

export type RecipeInput = z.infer<typeof recipeInput>;

/** Emberi nyelvű mezőnevek a hibaüzenetekhez. */
const FIELD_LABELS: Record<string, string> = {
  id: "Azonosító",
  name: "Recept neve",
  baseYieldQty: "Alapadag",
  baseYieldUnitId: "Adag mértékegysége",
  ingredients: "Hozzávalók",
  steps: "Elkészítés lépései",
  photos: "Fotók",
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