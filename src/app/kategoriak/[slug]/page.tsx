import Link from "next/link";
import { notFound } from "next/navigation";

import { RecipeGrid } from "@/components/recipe-grid";
import { SiteHeader } from "@/components/site-header";
import { getCategoryBySlug, listRecipeCards } from "@/lib/recipe-queries";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cimke?: string }>;
}) {
  const { slug } = await params;
  const { cimke } = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const allInCategory = await listRecipeCards({ categorySlug: slug });

  // A címkék a kategórián belüli receptekből jönnek – nincs külön lekérdezés.
  const tagCounts = new Map<string, number>();
  for (const recipe of allInCategory) {
    for (const tag of recipe.tags) {
      tagCounts.set(tag.name, (tagCounts.get(tag.name) ?? 0) + 1);
    }
  }
  const tags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "hu"));

  const recipes = cimke
    ? allInCategory.filter((recipe) =>
        recipe.tags.some((tag) => tag.name === cimke),
      )
    : allInCategory;

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
        <Link href="/" className="text-sm text-ink-400 hover:text-forest-600">
          ← Kategóriák
        </Link>

        <header
          className="mt-4 rounded-2xl border p-5"
          style={{
            borderColor: `${category.color}33`,
            background: `radial-gradient(120% 140% at 8% 0%, ${category.color}1a, transparent 62%)`,
          }}
        >
          <span
            className="chip"
            style={{
              border: `1px solid ${category.color}3d`,
              color: category.color,
              background: "rgba(255,255,255,0.7)",
            }}
          >
            Kategória
          </span>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ink-900">
            {category.name}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {allInCategory.length} recept ebben a kategóriában
            {recipes.length !== allInCategory.length && ` · ${recipes.length} találat`}
          </p>
        </header>

        {tags.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-300">
              Szűrés
            </span>
            <Link href={`/kategoriak/${slug}`} className={chipClass(!cimke)}>
              Összes
            </Link>
            {tags.map(([name, count]) => (
              <Link
                key={name}
                href={`/kategoriak/${slug}?cimke=${encodeURIComponent(name)}`}
                className={chipClass(cimke === name)}
              >
                {name}
                <span className={cimke === name ? "text-white/70" : "text-ink-300"}>
                  {count}
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6">
          <RecipeGrid
            recipes={recipes}
            emptyMessage={
              cimke
                ? `Nincs „${cimke}” címkéjű recept ebben a kategóriában.`
                : "Ebben a kategóriában még nincs recept. Vegyél fel egyet a + Új recept gombbal."
            }
          />
        </div>
      </main>
    </div>
  );
}
