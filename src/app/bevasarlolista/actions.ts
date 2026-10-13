"use server";

import { prisma } from "@/lib/db";
import { flattenToBase, type BaseLine } from "@/lib/recipe-calc";
import { loadCalcLines, loadRecipePicker } from "@/lib/recipe-calc-data";

export type ShoppingLine = {
  key: string;
  name: string;
  dimension: string;
  baseQuantity: number;
  unitCode: string | null;
  allergenNote: string | null;
  priceTotal: number | null;
  missingPrice: boolean;
  notes: string[];
};

export type ShoppingSnapshot = {
  ok: boolean;
  errors: string[];
  recipeId: string;
  name: string;
  slug: string;
  baseYieldQty: number;
  baseYieldUnitCode: string;
  lines: ShoppingLine[];
};

/** Egy recept hozzávalói bázisegységre bontva (alapreceptek kibontva). */
export async function getRecipeBaseLines(
  recipeId: string,
): Promise<ShoppingSnapshot> {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: {
      id: true,
      name: true,
      slug: true,
      baseYieldQty: true,
      baseYieldUnit: { select: { code: true } },
    },
  });

  if (!recipe) {
    return {
      ok: false,
      errors: ["Ez a recept nem található."],
      recipeId,
      name: "",
      slug: "",
      baseYieldQty: 1,
      baseYieldUnitCode: "",
      lines: [],
    };
  }

  const calcLines = await loadCalcLines(recipe.id);
  const merged = flattenToBase(calcLines, 1, recipe.name);

  return {
    ok: true,
    errors: [],
    recipeId: recipe.id,
    name: recipe.name,
    slug: recipe.slug,
    baseYieldQty: recipe.baseYieldQty,
    baseYieldUnitCode: recipe.baseYieldUnit.code,
    lines: [...merged.values()].map((line: BaseLine) => ({
      key: line.key,
      name: line.name,
      dimension: line.dimension,
      baseQuantity: line.baseQuantity,
      unitCode: line.unitCode,
      allergenNote: line.allergenNote,
      priceTotal: line.priceTotal,
      missingPrice: line.missingPrice,
      notes: line.notes,
    })),
  };
}

/** A választóhoz (keresés nélkül, kis adatcsomag). */
export async function getRecipePicker() {
  return loadRecipePicker();
}
