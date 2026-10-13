import Link from "next/link";

import { RecipeCard, type RecipeCardData } from "@/components/recipe-card";

/** Receptkártyák rácsban – a lista több helyen is ezt használja. */
export function RecipeGrid({
  recipes,
  emptyMessage = "Itt még nincs recept.",
}: {
  recipes: RecipeCardData[];
  emptyMessage?: string;
}) {
  if (recipes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-sage-300 p-8 text-center text-sm text-ink-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <Link key={recipe.id} href={`/receptek/${recipe.slug}`} className="block">
          <RecipeCard recipe={recipe} />
        </Link>
      ))}
    </div>
  );
}
