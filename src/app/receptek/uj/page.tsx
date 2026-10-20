import { RecipeForm } from "@/components/recipe-form";
import {
  emptyRecipeForm,
  getRecipeFormOptions,
} from "@/lib/recipe-options";

export const dynamic = "force-dynamic";

export const metadata = { title: "Új recept – Gábor receptkönyve" };

export default async function NewRecipePage() {
  const options = await getRecipeFormOptions();

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="font-display text-3xl text-ink-900">Új recept</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
        Másold be a hozzávalókat és az elkészítést a megfelelő mezőkbe!
      </p>

      <div className="mt-6">
        <RecipeForm
          mode="create"
          initial={{
            ...emptyRecipeForm(options.defaultUnitId),
            componentRecipeId: null,
            componentChoices: [],
            photoFileName: null,
            componentRecipe: null
          }}
          cancelHref="/"
          units={options.units}
          categories={options.categories}
          groupSuggestions={options.groupSuggestions}
        />
      </div>
    </main>
  );
}