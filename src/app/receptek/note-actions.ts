"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";

export type NoteResult = { ok: boolean; errors: string[] };

const KINDS = ["tapasztalat", "sikerult", "felresikerult", "otlet"];

async function slugOf(recipeId: string): Promise<string | null> {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { slug: true },
  });
  return recipe?.slug ?? null;
}

/** Új bejegyzés a próbák naplójába. */
export async function addRecipeNote(
  recipeId: string,
  text: string,
  kind: string,
): Promise<NoteResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, errors: ["Írj valamit a bejegyzésbe."] };
  }

  const slug = await slugOf(recipeId);
  if (!slug) {
    return { ok: false, errors: ["Ez a recept nem található."] };
  }

  await prisma.recipeNote.create({
    data: {
      recipeId,
      text: trimmed,
      kind: KINDS.includes(kind) ? kind : "tapasztalat",
    },
  });

  revalidatePath(`/receptek/${slug}`);
  return { ok: true, errors: [] };
}

/** Bejegyzés törlése. */
export async function deleteRecipeNote(noteId: string): Promise<NoteResult> {
  const note = await prisma.recipeNote.findUnique({
    where: { id: noteId },
    select: { recipe: { select: { slug: true } } },
  });
  if (!note) return { ok: false, errors: ["Ez a bejegyzés már nincs meg."] };

  await prisma.recipeNote.delete({ where: { id: noteId } });
  revalidatePath(`/receptek/${note.recipe.slug}`);
  return { ok: true, errors: [] };
}
