// A számítási mag adatbázis-oldali párja: recept -> CalcLine fa,
// illetve bevásárlólista összeállítása.

import { prisma } from "./db.ts";
import type { BaseLine, CalcComponent, CalcLine } from "./recipe-calc.ts";
import { flattenToBase } from "./recipe-calc.ts";

/** Legfeljebb ilyen mélyen bontjuk ki az összetett recepteket. */
const MAX_COMPONENT_DEPTH = 3;

const ingredientInclude = {
  unit: true,
  ingredientMaster: true,
  componentRecipe: {
    select: {
      id: true,
      name: true,
      slug: true,
      baseYieldQty: true,
      baseYieldUnit: { select: { code: true } },
    },
  },
};

export async function loadCalcLines(
  recipeId: string,
  depth = 0,
  visited: Set<string> = new Set(),
): Promise<CalcLine[]> {
  const rows = await prisma.recipeIngredient.findMany({
    where: { recipeId },
    orderBy: { sortOrder: "asc" },
    include: ingredientInclude,
  });

  const lines: CalcLine[] = [];

  for (const row of rows) {
    let component: CalcComponent | null = null;
    const candidate = row.componentRecipe;

    // Körkörös hivatkozást nem engedünk (A tartalmazza B-t, B tartalmazza A-t).
    if (candidate && depth < MAX_COMPONENT_DEPTH && !visited.has(candidate.id)) {
      const nextVisited = new Set(visited);
      nextVisited.add(candidate.id);
      component = {
        id: candidate.id,
        name: candidate.name,
        slug: candidate.slug,
        baseYieldQty: candidate.baseYieldQty,
        baseYieldUnitCode: candidate.baseYieldUnit.code,
        lines: await loadCalcLines(candidate.id, depth + 1, nextVisited),
      };
    }

    lines.push({
      id: row.id,
      groupName: row.groupName,
      name: component ? component.name : row.name,
      quantity: row.quantity,
      unit: row.unit
        ? {
            id: row.unit.id,
            code: row.unit.code,
            dimension: row.unit.dimension,
            factorToBase: row.unit.factorToBase,
          }
        : null,
      note: row.note,
      scalable: row.scalable,
      component,
      masterId: row.ingredientMasterId,
      pricePerBaseUnit: row.ingredientMaster?.pricePerBaseUnit ?? null,
      allergenNote: row.ingredientMaster?.allergenNote ?? null,
    });
  }

  return lines;
}

export type ShoppingRequest = {
  recipeId: string;
  /** Hányszoros adag kell. */
  factor: number;
};

/** Több receptből egyetlen, összevont bevásárlólista. */
export async function buildShoppingList(requests: ShoppingRequest[]): Promise<{
  lines: BaseLine[];
  missingPrice: number;
  estimatedCost: number;
  recipeNames: string[];
}> {
  const output = new Map<string, BaseLine>();
  const recipeNames: string[] = [];

  for (const request of requests) {
    if (request.factor <= 0) continue;
    const recipe = await prisma.recipe.findUnique({
      where: { id: request.recipeId },
      select: { id: true, name: true },
    });
    if (!recipe) continue;

    const lines = await loadCalcLines(recipe.id);
    flattenToBase(lines, request.factor, recipe.name, output);
    recipeNames.push(recipe.name);
  }

  const lines = [...output.values()].sort((a, b) => {
    const order: Record<string, number> = { mass: 0, volume: 1, count: 2, other: 3 };
    const byDimension = (order[a.dimension] ?? 9) - (order[b.dimension] ?? 9);
    return byDimension !== 0 ? byDimension : a.name.localeCompare(b.name, "hu");
  });

  const missingPrice = lines.filter((line) => line.missingPrice).length;
  const estimatedCost = lines.reduce((sum, line) => sum + (line.priceTotal ?? 0), 0);

  return { lines, missingPrice, estimatedCost, recipeNames };
}

/** A választóhoz: minden recept a hozzávaló-számmal (kis adatcsomag). */
export async function loadRecipePicker() {
  const recipes = await prisma.recipe.findMany({
    where: { isArchived: false },
    orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      baseYieldQty: true,
      baseYieldUnit: { select: { code: true } },
      usualYieldQty: true,
      category: { select: { name: true, color: true } },
      _count: { select: { ingredients: true } },
    },
  });

  return recipes.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    slug: recipe.slug,
    baseYieldQty: recipe.baseYieldQty,
    baseYieldUnitCode: recipe.baseYieldUnit.code,
    usualYieldQty: recipe.usualYieldQty,
    categoryName: recipe.category?.name ?? null,
    categoryColor: recipe.category?.color ?? null,
    ingredientCount: recipe._count.ingredients,
  }));
}

/** A szerkesztőhöz: mely receptek választhatók be hozzávalóként. */
export async function loadComponentChoices(excludeRecipeId?: string) {
  const recipes = await prisma.recipe.findMany({
    where: {
      isArchived: false,
      ...(excludeRecipeId ? { NOT: { id: excludeRecipeId } } : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      baseYieldQty: true,
      baseYieldUnit: { select: { code: true } },
    },
  });

  return recipes.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    baseYieldQty: recipe.baseYieldQty,
    baseYieldUnitCode: recipe.baseYieldUnit.code,
  }));
}
