import { RecipeForm } from "@/components/recipe-form";
import { SiteHeader } from "@/components/site-header";
import {
  emptyRecipeForm,
  getRecipeFormOptions,
} from "@/lib/recipe-options";

export const dynamic = "force-dynamic";

export const metadata = { title: "Új recept – Klau recepttár" };

export default async function NewRecipePage() {
  const options = await getRecipeFormOptions();

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-5 py-8">
        <h1 className="font-display text-3xl text-ink-900">Új recept</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
          Írd be, ahogy a füzetben van – a sorok sorrendjét később is
          átrendezheted. Ami nem skálázódik (csipet só, tepsi kenése,
          díszítés), annál vedd ki a pipát.
        </p>

        <div className="mt-6">
          <RecipeForm
            mode="create"
            initial={{
              ...emptyRecipeForm(options.defaultUnitId),
              componentRecipeId: undefined,
              componentChoices: [],
              photoFileName: undefined,
              componentRecipe: undefined
            }}
            cancelHref="/"
            units={options.units}
            categories={options.categories}
            groupSuggestions={options.groupSuggestions}
          />
        </div>
      </main>
    </div>
  );
}
