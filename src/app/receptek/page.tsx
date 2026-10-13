import Link from "next/link";

import { RecipeGrid } from "@/components/recipe-grid";
import { SiteHeader } from "@/components/site-header";
import { getCategorySummaries, listRecipeCards } from "@/lib/recipe-queries";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  kategoria?: string;
  cimke?: string;
  kedvenc?: string;
};

/** Link-építő: mindig csak a ténylegesen beállított szűrők kerülnek az URL-be. */
function buildUrl(params: SearchParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `/receptek?${query}` : "/receptek";
}

export default async function AllRecipesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const query = sp.q?.trim() ?? "";
  const categorySlug = sp.kategoria ?? "";
  const tagName = sp.cimke ?? "";
  const favoriteOnly = sp.kedvenc === "1";

  // Először a keresés + kategória + kedvenc szűrők, majd a címke –
  // így a felajánlott címkék mindig az aktuális találatokhoz illenek.
  const [matching, categories] = await Promise.all([
    listRecipeCards({
      q: query,
      categorySlug: categorySlug || undefined,
      favoriteOnly,
    }),
    getCategorySummaries(),
  ]);

  const tagCounts = new Map<string, number>();
  for (const recipe of matching) {
    for (const tag of recipe.tags) {
      tagCounts.set(tag.name, (tagCounts.get(tag.name) ?? 0) + 1);
    }
  }
  const tags = [...tagCounts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "hu"),
  );

  const recipes = tagName
    ? matching.filter((recipe) => recipe.tags.some((tag) => tag.name === tagName))
    : matching;

  const chipClass = (active: boolean) =>
    `chip border transition-colors ${
      active
        ? "border-forest-600 bg-forest-600 text-white"
        : "border-sage-300 bg-white text-ink-700 hover:border-forest-300"
    }`;

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="font-display text-3xl text-ink-900">Összes recept</h1>

        {/* --- Keresés ---------------------------------------------------- */}
        <form
          action="/receptek"
          method="get"
          className="mt-4 flex max-w-xl items-center gap-2"
        >
          {categorySlug && <input type="hidden" name="kategoria" value={categorySlug} />}
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Keresés név, hozzávaló vagy címke szerint…"
            className="w-full rounded-xl border border-sage-300 bg-white px-4 py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-300 focus:border-forest-400"
            aria-label="Keresés"
          />
          <button type="submit" className="btn btn-primary shrink-0">
            Keresés
          </button>
        </form>

        {/* --- Szűrők ----------------------------------------------------- */}
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-300">
              Kategória
            </span>
            <Link href={buildUrl({ q: query })} className={chipClass(!categorySlug)}>
              Mind
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={buildUrl({ q: query, kategoria: category.slug })}
                className={chipClass(categorySlug === category.slug)}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
                <span
                  className={
                    categorySlug === category.slug ? "text-white/70" : "text-ink-300"
                  }
                >
                  {category.count}
                </span>
              </Link>
            ))}

            <Link
              href={buildUrl({
                q: query,
                kategoria: categorySlug,
                kedvenc: favoriteOnly ? undefined : "1",
              })}
              className={chipClass(favoriteOnly)}
            >
              ★ Kedvencek
            </Link>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-300">
                Címke
              </span>
              {tagName && (
                <Link
                  href={buildUrl({
                    q: query,
                    kategoria: categorySlug,
                    kedvenc: favoriteOnly ? "1" : undefined,
                  })}
                  className={chipClass(false)}
                >
                  ✕ {tagName}
                </Link>
              )}
              {tags
                .filter(([name]) => name !== tagName)
                .map(([name, count]) => (
                  <Link
                    key={name}
                    href={buildUrl({
                      q: query,
                      kategoria: categorySlug,
                      cimke: name,
                      kedvenc: favoriteOnly ? "1" : undefined,
                    })}
                    className={chipClass(false)}
                  >
                    {name}
                    <span className="text-ink-300">{count}</span>
                  </Link>
                ))}
            </div>
          )}
        </div>

        <p className="mt-6 text-sm text-ink-400">
          {recipes.length} találat
          {query && <> a(z) „{query}” keresésre</>}
        </p>

        <div className="mt-4">
          <RecipeGrid
            recipes={recipes}
            emptyMessage={
              query
                ? `Nincs találat a(z) „${query}” keresésre. Próbáld a hozzávaló nevével is.`
                : "Nincs a szűrőknek megfelelő recept."
            }
          />
        </div>
      </main>
    </div>
  );
}
