import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { RecipeCard } from "@/components/recipe-card";
import { listRecipeCards } from "@/lib/recipe-queries";

export const dynamic = "force-dynamic";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Lekérjük magát a kategóriát
  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    notFound();
  }

  // Biztonságosan lekérjük a kategóriához tartozó receptkártyákat a központi lekérdezővel
  const recipes = await listRecipeCards({ categoryId: category.id });

  return (
    <div className="min-h-dvh bg-sage-50/50 dark:bg-gray-950">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Link
          href="/"
          className="text-sm text-ink-400 hover:text-forest-600 dark:text-gray-400"
        >
          ← Vissza a főoldalra
        </Link>

        {/* Kategória fejléc kártya */}
        <div className="card mt-4 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span
                className="chip mb-2"
                style={{
                  backgroundColor: category.color ? `${category.color}20` : '#22c55e20',
                  color: category.color || '#22c55e',
                }}
              >
                Kategória
              </span>
              <h1 className="font-display text-3xl font-bold text-ink-900 dark:text-slate-100">
                {category.name}
              </h1>
              <p className="mt-1 text-sm text-ink-500 dark:text-gray-400">
                {recipes.length} recept ebben a kategóriában
              </p>
            </div>

            {/* Kategória szerkesztése gomb */}
            <div>
              <Link
                href={`/kategoriak/${category.id}/szerkesztes`}
                className="inline-flex items-center gap-2 rounded-xl border border-sage-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm hover:bg-sage-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 transition"
              >
                ✏️ Kategória szerkesztése
              </Link>
            </div>
          </div>
        </div>

        {/* Recept lista */}
        <div className="mt-8">
          {recipes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sage-300 p-8 text-center dark:border-gray-800">
              <p className="text-sm text-ink-500 dark:text-gray-400">
                Ebben a kategóriában még nincs recept. Vegyél fel egyet a + Új recept gombbal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}