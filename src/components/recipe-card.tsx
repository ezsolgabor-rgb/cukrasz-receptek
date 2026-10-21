import Image from "next/image";
import Link from "next/link";

import { formatDuration, formatNumber } from "@/lib/format";

export type RecipeCardData = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  baseYieldQty: number;
  yieldNote: string | null;
  prepMinutes: number | null;
  bakeMinutes: number | null;
  bakeTemperatureC: number | null;
  difficulty: number | null;
  isFavorite: boolean;
  category: { name: string; color: string; icon: string | null } | null;
  baseYieldUnit: { code: string; name: string } | null;
  tags: { id: string; name: string }[];
  ingredients: { name: string; allergenNote: string | null }[];
  coverPhoto: { fileName: string; caption: string | null } | null;
  stepCount: number;
};

/** Kis „nehézség” pontsor. */
function Difficulty({ level }: { level: number | null }) {
  if (!level) return null;
  return (
    <span className="inline-flex items-center gap-1" title={`Nehézség: ${level}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${
            i <= level ? "bg-forest-500" : "bg-sage-300"
          }`}
        />
      ))}
    </span>
  );
}

export function RecipeCard({ recipe }: { recipe: RecipeCardData }) {
  const accent = recipe.category?.color ?? "#6e8a5f";
  const totalMinutes =
    (recipe.prepMinutes ?? 0) + (recipe.bakeMinutes ?? 0) || null;
  const allergens = [
    ...new Set(
      recipe.ingredients
        .map((i) => i.allergenNote)
        .filter((n): n is string => Boolean(n)),
    ),
  ].slice(0, 3);

  const unitCode = recipe.baseYieldUnit?.code ?? "";

  return (
    <Link
      href={`/receptek/${recipe.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-white dark:bg-slate-800 dark:border dark:border-slate-700 block"
    >
      <article className="flex flex-col h-full">
        {/* Fotó, vagy hangulatos helyőrző a kategória színével */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {recipe.coverPhoto ? (
            <Image
              src={`/api/files/${encodeURIComponent(recipe.coverPhoto.fileName)}`}
              alt={recipe.coverPhoto.caption ?? recipe.name}
              fill
              sizes="(max-width: 768px) 100vw, 380px"
              className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-t-2xl"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background: `radial-gradient(120% 100% at 20% 0%, ${accent}2e, ${accent}12 60%), linear-gradient(180deg, #fff, #eef3e7) dark:bg-slate-700`,
              }}
            >
              <div className="flex h-full items-center justify-center dark:bg-slate-700">
                <span
                  className="font-display text-5xl opacity-30"
                  style={{ color: accent }}
                >
                  {recipe.name.charAt(0)}
                </span>
              </div>
            </div>
          )}

          {recipe.category && (
            <span
              className="chip absolute left-3 top-3 backdrop-blur-sm"
              style={{
                backgroundColor: "rgba(255,255,255,0.82)",
                color: accent,
                border: `1px solid ${accent}40`,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: accent }}
              />
              {recipe.category.name}
            </span>
          )}

          {recipe.isFavorite && (
            <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white/85 text-sm text-plum-500 backdrop-blur-sm">
              ★
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <h3 className="font-display text-xl leading-snug text-ink-900 dark:text-slate-100">
              {recipe.name}
            </h3>
            {recipe.description && (
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-500 dark:text-slate-400">
                {recipe.description}
              </p>
            )}
          </div>

          <div className="mt-auto flex flex-wrap gap-2 border-t border-dashed border-sage-300 pt-3">
            <div className="flex items-center gap-1 rounded-full bg-sage-100 dark:bg-slate-700 px-3 py-1 text-sm text-ink-700 dark:text-slate-100">
              <span className="text-sage-500">🍽️</span>
              {`${formatNumber(recipe.baseYieldQty, 2)} ${unitCode}`.trim()}
            </div>
            
            {totalMinutes && (
              <div className="flex items-center gap-1 rounded-full bg-sage-100 px-3 py-1 text-sm text-ink-700">
                <span className="text-sage-500">⏱️</span>
                {formatDuration(totalMinutes)}
              </div>
            )}

            {recipe.difficulty && (
              <div className="flex items-center gap-1 rounded-full bg-sage-100 px-3 py-1 text-sm text-ink-700">
                <span className="text-sage-500">🧗</span>
                <Difficulty level={recipe.difficulty} />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-400 dark:text-slate-500">
            <span>{recipe.ingredients.length} hozzávaló</span>
            <span className="text-sage-400">•</span>
            <span>{recipe.stepCount} lépés</span>
            {recipe.bakeTemperatureC && (
              <>
                <span className="text-sage-400">•</span>
                <span>{recipe.bakeTemperatureC} °C</span>
              </>
            )}
          </div>

          {allergens.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allergens.map((a) => (
                <span
                  key={a}
                  className="chip border border-plum-500/20 bg-plum-500/5 text-plum-500"
                  title={`Allergén: ${a}`}
                >
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}