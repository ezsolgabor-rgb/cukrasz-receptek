// Szerveroldali adatréteg: itt történik a recept tényleges mentése.
// Szándékosan sima függvények – így a szerver-akció vékony marad, és a
// mentési logika önmagában is tesztelhető.

import { prisma } from "./db.ts";
import { describeIssues, recipeInput } from "./recipe-input.ts";
import { slugify } from "./slug.ts";

export type PersistRecipeResult =
  | { ok: true; slug: string }
  | { ok: false; errors: string[] };

export type RemoveRecipeResult = { ok: true } | { ok: false; errors: string[] };

/** Ütközésmentes slug: ha már létezik, -2, -3 … utótagot kap. */
async function uniqueSlug(base: string, exceptId?: string): Promise<string> {
  const root = base || "recept";
  let candidate = root;
  let counter = 2;

  for (;;) {
    const existing = await prisma.recipe.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === exceptId) return candidate;
    candidate = `${root}-${counter}`;
    counter += 1;
  }
}

/**
 * Recept létrehozása vagy módosítása.
 * A hozzávalókat és a lépéseket mindig teljesen újraírjuk – így nem
 * maradnak „árva” sorok, ha valamit törölsz a szerkesztőben.
 */
export async function persistRecipe(raw: unknown): Promise<PersistRecipeResult> {
  const parsed = recipeInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: describeIssues(parsed.error.issues) };
  }

  const data = parsed.data;

  if (data.ingredients.length === 0) {
    return { ok: false, errors: ["Adj meg legalább egy hozzávalót."] };
  }
  if (data.steps.length === 0) {
    return { ok: false, errors: ["Adj meg legalább egy elkészítési lépést."] };
  }

  // A hozzávaló-törzsadathoz (allergén, ár) név alapján automatikusan
  // kapcsolunk – így a kézzel beírt nevek is „okosak” lesznek.
  const masters = await prisma.ingredientMaster.findMany({
    select: { id: true, name: true },
  });
  const masterByName = new Map(
    masters.map((m) => [m.name.trim().toLowerCase(), m.id]),
  );

  // Címkék létrehozása igény szerint.
  const tagIds: string[] = [];
  for (const name of [...new Set(data.tagNames)]) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    tagIds.push(tag.id);
  }

  const ingredientsCreate = data.ingredients.map((line, index) => {
    // Alaprecept esetén a mennyiség hányszoros adagot jelent, mértékegység nélkül.
    const isComponent = Boolean(line.componentRecipeId);
    return {
      sortOrder: index,
      groupName: line.groupName && line.groupName.trim() ? line.groupName.trim() : null,
      name: line.name,
      quantity: line.quantity,
      unitId: isComponent ? null : line.unitId,
      note: line.note && line.note.trim() ? line.note.trim() : null,
      scalable: line.scalable,
      componentRecipeId: line.componentRecipeId,
      ingredientMasterId: isComponent
        ? null
        : (masterByName.get(line.name.trim().toLowerCase()) ?? null),
    };
  });

  const stepsCreate = data.steps.map((step, index) => ({
    sortOrder: index,
    text: step.text,
    durationMinutes: step.durationMinutes,
    temperatureC: step.temperatureC,
    note: step.note && step.note.trim() ? step.note.trim() : null,
    photoFileName: step.photoFileName,
  }));

  const recipeFields = {
    name: data.name,
    categoryId: data.categoryId,
    description: data.description?.trim() ? data.description.trim() : null,
    baseYieldQty: data.baseYieldQty,
    baseYieldUnitId: data.baseYieldUnitId,
    yieldNote: data.yieldNote?.trim() ? data.yieldNote.trim() : null,
    prepMinutes: data.prepMinutes,
    bakeMinutes: data.bakeMinutes,
    bakeTemperatureC: data.bakeTemperatureC,
    difficulty: data.difficulty,
    source: data.source?.trim() ? data.source.trim() : null,
    notes: data.notes?.trim() ? data.notes.trim() : null,
    isFavorite: data.isFavorite,
    usualYieldQty: data.usualYieldQty,
    usualYieldNote: data.usualYieldNote?.trim() ? data.usualYieldNote.trim() : null,
  };

  // --- Módosítás ---------------------------------------------------------
  if (data.id) {
    const existing = await prisma.recipe.findUnique({
      where: { id: data.id },
      select: { id: true, slug: true, name: true },
    });
    if (!existing) {
      return { ok: false, errors: ["Ez a recept már nem található."] };
    }

    const slug =
      existing.name === data.name
        ? existing.slug
        : await uniqueSlug(slugify(data.name), existing.id);

    await prisma.$transaction([
      prisma.recipeIngredient.deleteMany({ where: { recipeId: existing.id } }),
      prisma.recipeStep.deleteMany({ where: { recipeId: existing.id } }),
      prisma.recipe.update({
        where: { id: existing.id },
        data: {
          ...recipeFields,
          slug,
          ingredients: { create: ingredientsCreate },
          steps: { create: stepsCreate },
          tags: { set: tagIds.map((id) => ({ id })) },
        },
      }),
    ]);

    return { ok: true, slug };
  }

  // --- Új recept ---------------------------------------------------------
  const slug = await uniqueSlug(slugify(data.name));

  const created = await prisma.recipe.create({
    data: {
      ...recipeFields,
      slug,
      ingredients: { create: ingredientsCreate },
      steps: { create: stepsCreate },
      tags: { connect: tagIds.map((id) => ({ id })) },
    },
    select: { slug: true },
  });

  return { ok: true, slug: created.slug };
}

/**
 * Recept törlése. Ha egy másik recept hozzávalójaként használod,
 * nem töröljük – előbb azt kell módosítani.
 */
export async function removeRecipe(id: string): Promise<RemoveRecipeResult> {
  const usedIn = await prisma.recipeIngredient.count({
    where: { componentRecipeId: id },
  });
  if (usedIn > 0) {
    return {
      ok: false,
      errors: [
        `Ez a recept ${usedIn} másik receptben szerepel hozzávalóként, ezért nem törölhető. Előbb azokat módosítsd.`,
      ],
    };
  }

  await prisma.recipe.delete({ where: { id } });
  return { ok: true };
}
