"use server";

import { revalidatePath } from "next/cache";

import {
  persistRecipe,
  removeRecipe,
  type PersistRecipeResult,
  type RemoveRecipeResult,
} from "@/lib/recipe-repository";

export type SaveRecipeResult = PersistRecipeResult;
export type DeleteRecipeResult = RemoveRecipeResult;

/**
 * Szerver-akciók: itt csak a gyorsítótár érvénytelenítése történik,
 * a tényleges mentés a `lib/recipe-repository.ts`-ben van.
 */

export async function saveRecipe(raw: unknown): Promise<SaveRecipeResult> {
  const result = await persistRecipe(raw);

  if (result.ok) {
    revalidatePath("/");
    revalidatePath(`/receptek/${result.slug}`);
  }

  return result;
}

export async function deleteRecipe(id: string): Promise<DeleteRecipeResult> {
  const result = await removeRecipe(id);

  if (result.ok) {
    revalidatePath("/");
  }

  return result;
}
