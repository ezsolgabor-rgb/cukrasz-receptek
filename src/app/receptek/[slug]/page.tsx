import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PhotoManager } from "@/components/photo-manager";
import { PrintButton } from "@/components/print-button";
import { RecipeIngredients } from "@/components/recipe-ingredients";
import { RecipeNotes } from "@/components/recipe-notes";
import { RecipeSteps } from "@/components/recipe-steps";
import { SiteHeader } from "@/components/site-header";
import { CookingTools } from "@/components/cooking-tools"; // <-- ÚJ IMPORT
import { formatDuration, formatNumber } from "@/lib/format";
import { loadRecipeDetail } from "@/lib/recipe-detail";

export const dynamic = "force-dynamic";

function MetaCell({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-ink-300">
        {label}
      </p>
      <p className="prose-recipe mt-0.5 text-lg">{value}</p>
    </div>
  );
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await loadRecipeDetail(slug);
  if (!detail) notFound();

  const coverPhoto =
    detail.photos.find((photo) => photo.isCover) ?? detail.photos[0] ?? null;
  const totalMinutes = (detail.prepMinutes ?? 0) + (detail.bakeMinutes ?? 0);

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-5 py-8">
        <Link
          href="/"
          className="text-sm text-ink-400 hover:text-forest-600 print:hidden"
        >
          ← Vissza a receptekhez
        </Link>

        <header className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            {detail.category && (
              <span
                className="chip"
                style={{
                  border: `1px solid ${detail.category.color}3d`,
                  color: detail.category.color,
                  background: `${detail.category.color}0f`,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: detail.category.color }}
                />
                {detail.category.name}
              </span>
            )}
            {detail.tags.map((tag) => (
              <span
                key={tag.id}
                className="chip border border-sage-300 bg-white text-forest-700"
              >
                {tag.name}
              </span>
            ))}
          </div>

          <h1 className="mt-3 font-display text-4xl leading-tight text-ink-900">
            {detail.name}
          </h1>

          {detail.description && (
            <p className="prose-recipe mt-2 max-w-2xl text-ink-500">
              {detail.description}
            </p>
          )}

          {detail.usualYieldNote && (
            <p className="mt-2 text-sm text-ink-400">
              Szokásos: {detail.usualYieldNote}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 print:hidden">
            <Link
              href={`/receptek/${detail.slug}/szerkesztes`}
              className="btn btn-primary"
            >
              Szerkesztés
            </Link>
            <Link href={`/receptek/${detail.slug}/sutes`} className="btn btn-ghost">
              Sütés közben
            </Link>
            <PrintButton />
            <span className="text-xs text-ink-300">
              Utoljára módosítva:{" "}
              {new Date(detail.updatedAt).toLocaleDateString("hu-HU")}
            </span>
          </div>

          {coverPhoto && (
            <div className="relative mt-5 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-sage-200 bg-sage-100">
              <Image
                src={`/api/files/${encodeURIComponent(coverPhoto.fileName)}`}
                alt={coverPhoto.caption ?? detail.name}
                fill
                sizes="(max-width: 896px) 100vw, 896px"
                className="object-cover"
                priority
              />
            </div>
          )}
        </header>

        {/* --- ITT JELENNEK MEG A KONYHAI ESZKÖZÖK (Időzítő + WakeLock) --- */}
        <CookingTools bakeMinutes={detail.bakeMinutes} />

        <section className="mt-6">
          <hr className="rule-dashed" />
          <div className="my-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <MetaCell label="Előkészítés" value={formatDuration(detail.prepMinutes)} />
            <MetaCell label="Sütés" value={formatDuration(detail.bakeMinutes)} />
            <MetaCell
              label="Hőfok"
              value={
                detail.bakeTemperatureC ? `${detail.bakeTemperatureC} °C` : null
              }
            />
            <MetaCell
              label="Összesen"
              value={totalMinutes > 0 ? formatDuration(totalMinutes) : null}
            />
            <MetaCell
              label="Nehézség"
              value={detail.difficulty ? `${detail.difficulty} / 5` : null}
            />
          </div>
          <hr className="rule-dashed" />
        </section>

        {detail.yieldNote && (
          <p className="mt-4 text-sm text-ink-400">
            Alapadag: {formatNumber(detail.baseYieldQty, 2)}{" "}
            {detail.baseYieldUnit.code} · {detail.yieldNote}
          </p>
        )}

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

        {detail.allergens.length > 0 && (
          <div className="mt-6 rounded-xl border border-plum-500/20 bg-plum-500/5 p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-plum-500">
              Allergének
            </p>
            <p className="mt-1 text-sm text-ink-700">
              {detail.allergens.join(" · ")}
            </p>
          </div>
        )}

        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink-900">Elkészítés</h2>
          <hr className="rule-dashed my-4" />
          <RecipeSteps steps={detail.steps} />
        </section>

        {detail.notes && (
          <section className="card mt-10 p-5">
            <h2 className="font-display text-lg text-ink-900">Tippek, trükkök</h2>
            <p className="prose-recipe mt-2 text-ink-700">{detail.notes}</p>
            {detail.source && (
              <p className="mt-3 text-sm text-ink-400">Forrás: {detail.source}</p>
            )}
          </section>
        )}

        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink-900">
            Próbák naplója
          </h2>
          <p className="mt-1 text-sm text-ink-400">
            Hogyan sikerült a legutóbb, mit változtattál – hogy legközelebb ne
            kezdd elölről.
          </p>
          <hr className="rule-dashed my-4" />
          <RecipeNotes recipeId={detail.id} notes={detail.notesLog} />
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink-900">Fotók</h2>
          <hr className="rule-dashed my-4" />
          <PhotoManager
            recipeId={detail.id}
            maxMb={detail.maxPhotoMb}
            photos={detail.photos}
          />
        </section>
      </main>
    </div>
  );
}