import Link from "next/link";

import { CategoryCard } from "@/components/category-card";
import { RecipeGrid } from "@/components/recipe-grid";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import { getCategorySummaries, listRecipeCards } from "@/lib/recipe-queries";
import { normalizeForSearch } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // A „Alapok” kategória külön szekciót kap (krémek, piskóták, tészták),
  // és a beállításokban átírható, melyik kategória az.
  const baseSetting = await prisma.appSetting.findUnique({
    where: { key: "baseCategorySlug" },
  });
  const baseSlug = baseSetting?.value ?? "alapreceptek";

  const [categories, recent, recipeCount, stepCount, masterCount] =
    await Promise.all([
      getCategorySummaries(),
      listRecipeCards({ order: "recent", limit: 6 }),
      prisma.recipe.count(),
      prisma.recipeStep.count(),
      prisma.ingredientMaster.count(),
    ]);

  // Az „Alapok” kategóriát név alapján is megtaláljuk, hogy egy átnevezés
  // ne tüntesse el a nyitólapi szekciót.
  const baseCategory =
    categories.find((category) => category.slug === baseSlug) ??
    categories.find((category) =>
      normalizeForSearch(category.name).startsWith("alap"),
    ) ??
    null;
  const menuCategories = categories.filter(
    (category) => category.id !== baseCategory?.id,
  );

  // Az alaprecepteket azonosító alapján kérjük le, így az átnevezés
  // (és az ezzel járó új webcím) sem töri el a nyitólapot.
  const baseRecipes = baseCategory
    ? await listRecipeCards({ categoryId: baseCategory.id })
    : [];

  return (
    <div className="min-h-dvh">
      <main className="mx-auto max-w-6xl px-5 py-8 md:py-12 bg-white dark:bg-slate-900">
        {/* --- Kereső ---------------------------------------------------- */}
        <section>
          <h1 className="max-w-2xl font-display text-3xl leading-tight text-ink-900 dark:text-slate-100 md:text-4xl">
            Mit sütünk ma?
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-500 dark:text-slate-400 md:text-base">
            Válassz kategóriát, vagy keress rá egy névre, hozzávalóra. Az adag
            bármikor átszámolható.
          </p>

          <form
            action="/receptek"
            method="get"
            className="mt-5 flex w-full flex-col gap-2 sm:flex-row sm:items-center"
          >
            <input
              type="search"
              name="q"
              placeholder="Keresés: piskóta, csirke, málna…"
              className="w-full rounded-xl border border-sage-300 bg-white px-4 py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-300 focus:border-forest-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              aria-label="Keresés a receptek között"
            />
            <button type="submit" className="btn btn-primary shrink-0">
              Keresés
            </button>
          </form>

          <p className="mt-3 text-xs text-ink-400">
            {formatNumber(recipeCount, 0)} recept · {formatNumber(stepCount, 0)} lépés ·{" "}
            {formatNumber(masterCount, 0)} hozzávaló a törzsben
          </p>
        </section>

        {/* --- Kategóriák (a „menüpontok”) ------------------------------- */}
        <section className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl text-ink-900">Kategóriák</h2>
            <Link
              href="/receptek"
              className="text-sm font-semibold text-forest-600 hover:underline"
            >
              Összes recept →
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {menuCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>

        {/* --- Alapok / Főbb elemek -------------------------------------- */}
        {baseCategory && (
          <section className="mt-12">
            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: `${baseCategory.color}33`,
                background: `radial-gradient(120% 120% at 10% 0%, ${baseCategory.color}14, transparent 60%)`,
              }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="font-display text-2xl text-ink-900">
                    {baseCategory.name}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-ink-500">
                    Ezekre az alapanyagokra vagy receptekre gyakran építesz rá.
                  </p>
                </div>
                <Link
                  href={`/kategoriak/${baseCategory.slug}`}
                  className="text-sm font-semibold hover:underline"
                  style={{ color: baseCategory.color }}
                >
                  Összes →
                </Link>
              </div>

              {baseRecipes.length === 0 ? (
                <p className="mt-4 text-sm text-ink-400">
                  Még nincs elem ebben a kategóriában.
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {baseRecipes.slice(0, 6).map((recipe) => (
                    <Link
                      key={recipe.id}
                      href={`/receptek/${recipe.slug}`}
                      className="card block p-4 transition-shadow hover:shadow-lift bg-white dark:bg-slate-850 dark:border dark:border-slate-700/50"
                    >