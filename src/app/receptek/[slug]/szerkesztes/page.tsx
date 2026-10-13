import { notFound } from "next/navigation";

import { RecipeForm } from "@/components/recipe-form";
import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/db";
import type { RecipeFormValues } from "@/lib/recipe-form-types";
import { getRecipeFormOptions } from "@/lib/recipe-options";

export const dynamic = "force-dynamic";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [recipe, options] = await Promise.all([
    prisma.recipe.findUnique({
      where: { slug },
      include: {
        tags: true,
        steps: { orderBy: { sortOrder: "asc" } },
        ingredients: { orderBy: { sortOrder: "asc" } },
      },
    }),
    getRecipeFormOptions(),
  ]);

  if (!recipe) notFound();

  const initial: RecipeFormValues = {
    id: recipe.id,
    name: recipe.name,
    categoryId: recipe.categoryId,
    description: recipe.description,
    baseYieldQty: recipe.baseYieldQty,
    baseYieldUnitId: recipe.baseYieldUnitId,
    yieldNote: recipe.yieldNote,
    prepMinutes: recipe.prepMinutes,
    bakeMinutes: recipe.bakeMinutes,
    bakeTemperatureC: recipe.bakeTemperatureC,
    difficulty: recipe.difficulty,
    source: recipe.source,
    notes: recipe.notes,
    isFavorite: recipe.isFavorite,
    tagNames: recipe.tags.map((tag) => tag.name),
    ingredients: recipe.ingredients.map((line) => ({
      groupName: line.groupName,
      name: line.name,
      quantity: line.quantity,
      unitId: line.unitId,
      note: line.note,
      scalable: line.scalable,
    })),
    steps: recipe.steps.map((step) => ({
      text: step.text,
      durationMinutes: step.durationMinutes,
      temperatureC: step.temperatureC,
      note: step.note,
      photoFileName: step.photoFileName || null,
    })),
    componentRecipeId: recipe.componentRecipeId || undefined,
    componentChoices: [],
  };

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-5 py-8">
        <h1 className="font-display text-3xl text-ink-900">
          {recipe.name} – szerkesztés
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          A módosítások mentés után azonnal életbe lépnek a receptlapon is.
        </p>

        <div className="mt-6">
          <RecipeForm
            mode="edit"
            initial={initial}
            cancelHref={`/receptek/${recipe.slug}`}
            units={options.units}
            categories={options.categories}
            groupSuggestions={options.groupSuggestions}
          />
        </div>
      </main>
    </div>
  );
}
