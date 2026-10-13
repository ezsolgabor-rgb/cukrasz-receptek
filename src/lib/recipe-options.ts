import "server-only";

import { prisma } from "@/lib/db";
import type {
  CategoryOption,
  RecipeFormValues,
  UnitOption,
} from "@/lib/recipe-form-types";

export type RecipeFormOptions = {
  units: UnitOption[];
  categories: CategoryOption[];
  groupSuggestions: string[];
  defaultUnitId: string;
};

/** A szerkesztőhöz szükséges választékok (mértékegységek, kategóriák). */
export async function getRecipeFormOptions(): Promise<RecipeFormOptions> {
  const [units, categories, groupRows, defaultUnitSetting] = await Promise.all([
    prisma.unit.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        dimension: true,
        factorToBase: true,
      },
    }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.recipeIngredient.findMany({
      where: { groupName: { not: null } },
      distinct: ["groupName"],
      select: { groupName: true },
      orderBy: { groupName: "asc" },
    }),
    prisma.appSetting.findUnique({ where: { key: "defaultYieldUnit" } }),
  ]);

  const preferredCode = defaultUnitSetting?.value ?? "adag";
  const defaultUnit = units.find((unit) => unit.code === preferredCode) ?? units[0];

  return {
    units,
    categories,
    groupSuggestions: groupRows
      .map((row) => row.groupName)
      .filter((name): name is string => Boolean(name)),
    defaultUnitId: defaultUnit?.id ?? "",
  };
}

/** Üres űrlap új recepthez. */
export function emptyRecipeForm(defaultUnitId: string): RecipeFormValues {
  return {
    id: null,
    name: "",
    categoryId: null,
    description: null,
    baseYieldQty: 12,
    baseYieldUnitId: defaultUnitId,
    yieldNote: null,
    prepMinutes: null,
    bakeMinutes: null,
    bakeTemperatureC: null,
    difficulty: null,
    source: null,
    notes: null,
    isFavorite: false,
    usualYieldQty: null,
    usualYieldNote: null,
    tagNames: [],
    ingredients: [],
    steps: [],
  };
}
