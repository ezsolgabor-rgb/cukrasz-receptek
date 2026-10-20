import Link from "next/link";
import { notFound } from "next/navigation";

import { RecipeIngredients } from "@/components/recipe-ingredients";
import { RecipeSteps } from "@/components/recipe-steps";
import { WakeLockButton } from "@/components/wake-lock";
import { formatNumber } from "@/lib/format";
import { loadRecipeDetail } from "@/lib/recipe-detail";

export const dynamic = "force-dynamic";

/**
 * „Sütés közben” nézet: nagy betűk, kevés dísz, időzítők.
 * Telefonon a konyhában ez a használható változat.
 */
export default async function CookingModePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await loadRecipeDetail(slug);
  if (!detail) notFound();

  return (
    <div className="min-h-dvh">
      <div className="border-b border-sage-200 bg-sage-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-5 py-3">
          <Link
            href={`/receptek/${detail.slug}`}
            className="text-sm font-semibold text-forest-600 hover:underline"
          >
            ← Vissza a recepthez
          </Link>
          <span className="chip border border-forest-200 bg-forest-600/5 text-forest-700">
            Sütés közben
          </span>
          <div className="ml-auto">
            <WakeLockButton />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <h1 className="font-display text-4xl leading-tight text-ink-900">
          {detail.name}
        </h1>
        <p className="mt-2 text-lg text-ink-500">
          Alapadag: {formatNumber(detail.baseYieldQty, 2)} {detail.baseYieldUnit.code}
          {detail.yieldNote ? ` · ${detail.yieldNote}` : ""}
        </p>

        <div className="mt-8">
          <RecipeIngredients
            lines={detail.scalerLines}
            baseYieldQty={detail.baseYieldQty}
            baseYieldUnit={detail.baseYieldUnit}
            usualYieldQty={detail.usualYieldQty}
            priceMultiplier={detail.priceMultiplier}
            currency={detail.currency}
            panSizes={detail.panSizes}
          />
        </div>

        <section className="mt-12">
          <h2 className="font-display text-3xl text-ink-900">Elkészítés</h2>
          <hr className="rule-dashed my-5" />
          <RecipeSteps steps={detail.steps} big />
        </section>
      </main>
    </div>
  );
}