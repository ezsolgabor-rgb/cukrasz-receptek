// Egy recept minden adata, amire a receptlapnak és a „sütés közben"
// nézetnek szüksége van. Egy helyen, hogy a kettő ne csússzon el.

import { prisma } from "./db.ts";
import { toScalerLines, type CalcLine, type ScalerLine } from "./recipe-calc.ts";
import { loadCalcLines } from "./recipe-calc-data.ts";

export type PanSize = {
  id: string;
  diameterCm: number;
  slices: number;
  note: string | null;
};

export type RecipeStepData = {
  id: string;
  sortOrder: number;
  text: string;
  durationMinutes: number | null;
  temperatureC: number | null;
  note: string | null;
  photoFileName: string | null;
};

export type RecipePhotoData = {
  id: string;
  fileName: string;
  caption: string | null;
  isCover: boolean;
  isOriginalScan: boolean;
};

export type RecipeNoteData = {
  id: string;
  noteDate: string;
  text: string;
  kind: string;
};

export type RecipeDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: { name: string; color: string } | null;
  tags: { id: string; name: string }[];
  baseYieldQty: number;
  baseYieldUnit: { code: string; name: string; dimension: string };
  yieldNote: string | null;
  usualYieldQty: number | null;
  usualYieldNote: string | null;
  prepMinutes: number | null;
  bakeMinutes: number | null;
  bakeTemperatureC: number | null;
  difficulty: number | null;
  source: string | null;
  notes: string | null;
  isFavorite: boolean;
  updatedAt: string;
  steps: RecipeStepData[];
  photos: RecipePhotoData[];
  notesLog: RecipeNoteData[];
  scalerLines: ScalerLine[];
  panSizes: PanSize[];
  allergens: string[];
  priceMultiplier: number;
  currency: string;
  maxPhotoMb: number;
};

/** Az allergéneket az összetett receptekből is összegyűjtjük. */
function collectAllergens(lines: CalcLine[], found: Set<string> = new Set()) {
  for (const line of lines) {
    if (line.allergenNote) found.add(line.allergenNote);
    if (line.component) collectAllergens(line.component.lines, found);
  }
  return found;
}

export async function loadRecipeDetail(slug: string): Promise<RecipeDetail | null> {
  const recipe = await prisma.recipe.findUnique({
    where: { slug },
    include: {
      category: true,
      baseYieldUnit: true,
      tags: true,
      steps: { orderBy: { sortOrder: "asc" } },
      photos: { orderBy: { sortOrder: "asc" } },
      notesLog: { orderBy: { noteDate: "desc" }, take: 40 },
    },
  });

  if (!recipe) return null;

  const [calcLines, settingRows, cakeSizes] = await Promise.all([
    loadCalcLines(recipe.id),
    prisma.appSetting.findMany({
      where: { key: { in: ["priceMultiplier", "currency", "maxPhotoSizeMb"] } },
    }),
    recipe.baseYieldUnit.code === "szelet"
      ? prisma.cakeSize.findMany({
          where: { isActive: true },
          orderBy: { diameterCm: "asc" },
          select: { id: true, diameterCm: true, slices: true, note: true },
        })
      : Promise.resolve([]),
  ]);

  const settings = new Map(settingRows.map((row) => [row.key, row.value]));

  return {
    id: recipe.id,
    name: recipe.name,
    slug: recipe.slug,
    description: recipe.description,
    category: recipe.category
      ? { name: recipe.category.name, color: recipe.category.color }
      : null,
    tags: recipe.tags.map((tag) => ({ id: tag.id, name: tag.name })),
    baseYieldQty: recipe.baseYieldQty,
    baseYieldUnit: {
      code: recipe.baseYieldUnit.code,
      name: recipe.baseYieldUnit.name,
      dimension: recipe.baseYieldUnit.dimension,
    },
    yieldNote: recipe.yieldNote,
    usualYieldQty: recipe.usualYieldQty,
    usualYieldNote: recipe.usualYieldNote,
    prepMinutes: recipe.prepMinutes,
    bakeMinutes: recipe.bakeMinutes,
    bakeTemperatureC: recipe.bakeTemperatureC,
    difficulty: recipe.difficulty,
    source: recipe.source,
    notes: recipe.notes,
    isFavorite: recipe.isFavorite,
    updatedAt: recipe.updatedAt.toISOString(),
    steps: recipe.steps.map((step) => ({
      id: step.id,
      sortOrder: step.sortOrder,
      text: step.text,
      durationMinutes: step.durationMinutes,
      temperatureC: step.temperatureC,
      note: step.note,
      photoFileName: step.photoFileName,
    })),
    photos: recipe.photos.map((photo) => ({
      id: photo.id,
      fileName: photo.fileName,
      caption: photo.caption,
      isCover: photo.isCover,
      isOriginalScan: photo.isOriginalScan,
    })),
    notesLog: recipe.notesLog.map((note) => ({
      id: note.id,
      noteDate: note.noteDate.toISOString(),
      text: note.text,
      kind: note.kind,
    })),
    scalerLines: toScalerLines(calcLines),
    panSizes: cakeSizes,
    allergens: [...collectAllergens(calcLines)].sort((a, b) => a.localeCompare(b, "hu")),
    priceMultiplier: Number(settings.get("priceMultiplier") ?? 3) || 0,
    currency: settings.get("currency") ?? "Ft",
    maxPhotoMb: Number(settings.get("maxPhotoSizeMb") ?? 12) || 12,
  };
}
