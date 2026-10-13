"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  getRecipeBaseLines,
  type ShoppingSnapshot,
} from "@/app/bevasarlolista/actions";
import { formatNumber } from "@/lib/format";
import {
  displayQuantity,
  shoppingQuantity,
  type BaseLine,
} from "@/lib/recipe-calc";

export type PickerRecipe = {
  id: string;
  name: string;
  slug: string;
  baseYieldQty: number;
  baseYieldUnitCode: string;
  usualYieldQty: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  ingredientCount: number;
};

type SelectedItem = {
  snapshot: ShoppingSnapshot;
  portions: number;
};

const STORAGE_KEY = "klau-bevasarlolista";

const DIMENSION_LABELS: Record<string, string> = {
  mass: "Tömeg",
  volume: "Űrtartalom",
  count: "Darabszám",
  other: "Egyéb",
};

function mergeToBaseLines(items: SelectedItem[]): BaseLine[] {
  const map = new Map<string, BaseLine>();

  for (const item of items) {
    const factor =
      item.snapshot.baseYieldQty > 0
        ? item.portions / item.snapshot.baseYieldQty
        : 1;

    for (const line of item.snapshot.lines) {
      const baseQuantity = line.baseQuantity * factor;
      const price = line.priceTotal === null ? null : line.priceTotal * factor;
      const existing = map.get(line.key);

      if (existing) {
        existing.baseQuantity += baseQuantity;
        existing.usedIn += 1;
        if (price === null) existing.missingPrice = true;
        else existing.priceTotal = (existing.priceTotal ?? 0) + price;
        for (const note of line.notes) {
          if (!existing.notes.includes(note)) existing.notes.push(note);
        }
        if (!existing.fromRecipes.includes(item.snapshot.name)) {
          existing.fromRecipes.push(item.snapshot.name);
        }
      } else {
        map.set(line.key, {
          key: line.key,
          name: line.name,
          dimension: line.dimension,
          baseQuantity,
          unitCode: line.unitCode,
          allergenNote: line.allergenNote,
          priceTotal: price,
          missingPrice: price === null,
          notes: [...line.notes],
          fromRecipes: [item.snapshot.name],
          usedIn: 1,
        });
      }
    }
  }

  return [...map.values()].sort((a, b) => {
    const order: Record<string, number> = { mass: 0, volume: 1, count: 2, other: 3 };
    const byDimension = (order[a.dimension] ?? 9) - (order[b.dimension] ?? 9);
    return byDimension !== 0 ? byDimension : a.name.localeCompare(b.name, "hu");
  });
}

function money(value: number): string {
  return `${value.toLocaleString("hu-HU", { maximumFractionDigits: 0 })} Ft`;
}

function quantityText(line: BaseLine): string {
  const { value, unit } = displayQuantity(line);
  return `${formatNumber(value, 2)} ${unit}`.trim();
}

function shoppingText(line: BaseLine): string {
  const { value, unit } = shoppingQuantity(line);
  return `${formatNumber(value, 2)} ${unit}`.trim();
}

/**
 * Bevásárlólista több receptből. A kiválasztott recepteket összevonja,
 * bázisegységre váltja, és vásárlásra kerekíti.
 */
export function ShoppingList({
  recipes,
  currency = "Ft",
}: {
  recipes: PickerRecipe[];
  currency?: string;
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [restored, setRestored] = useState(false);

  // A kiválasztás megmarad a következő látogatásra is.
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setRestored(true);
          return;
        }
        const saved = JSON.parse(raw) as { recipeId: string; portions: number }[];
        const loaded: SelectedItem[] = [];
        for (const entry of saved) {
          const snapshot = await getRecipeBaseLines(entry.recipeId);
          if (snapshot.ok) loaded.push({ snapshot, portions: entry.portions });
        }
        if (!cancelled && loaded.length > 0) setItems(loaded);
      } catch {
        /* ha nem sikerül, üresen indulunk */
      } finally {
        if (!cancelled) setRestored(true);
      }
    };

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          items.map((item) => ({
            recipeId: item.snapshot.recipeId,
            portions: item.portions,
          })),
        ),
      );
    } catch {
      /* nem baj, ha nem menthető */
    }
  }, [items, restored]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return recipes.slice(0, 40);
    return recipes
      .filter((recipe) => recipe.name.toLowerCase().includes(needle))
      .slice(0, 40);
  }, [recipes, query]);

  const merged = useMemo(() => mergeToBaseLines(items), [items]);

  const cost = merged.reduce((sum, line) => sum + (line.priceTotal ?? 0), 0);
  const missingPrice = merged.filter((line) => line.missingPrice).length;

  const addRecipe = (recipe: PickerRecipe) => {
    if (items.some((item) => item.snapshot.recipeId === recipe.id)) return;
    setErrors([]);
    startTransition(async () => {
      const snapshot = await getRecipeBaseLines(recipe.id);
      if (!snapshot.ok) {
        setErrors(snapshot.errors);
        return;
      }
      setItems((current) => [
        ...current,
        {
          snapshot,
          portions: recipe.usualYieldQty ?? recipe.baseYieldQty,
        },
      ]);
    });
  };

  const removeItem = (recipeId: string) =>
    setItems((current) =>
      current.filter((item) => item.snapshot.recipeId !== recipeId),
    );

  const setPortions = (recipeId: string, portions: number) =>
    setItems((current) =>
      current.map((item) =>
        item.snapshot.recipeId === recipeId
          ? { ...item, portions: portions > 0 ? portions : item.portions }
          : item,
      ),
    );

  const grouped = useMemo(() => {
    const groups: { dimension: string; lines: BaseLine[] }[] = [];
    for (const line of merged) {
      const last = groups[groups.length - 1];
      if (!last || last.dimension !== line.dimension) {
        groups.push({ dimension: line.dimension, lines: [line] });
      } else {
        last.lines.push(line);
      }
    }
    return groups;
  }, [merged]);

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      {/* --- Receptválasztó ------------------------------------------- */}
      <section className="card h-fit p-4 print:hidden">
        <h2 className="font-display text-xl text-ink-900">Recept hozzáadása</h2>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Keresés…"
          className="mt-3 w-full rounded-lg border border-sage-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-ink-300 focus:border-forest-400"
        />

        {errors.length > 0 && (
          <p className="mt-2 text-sm text-plum-500">{errors.join(" ")}</p>
        )}

        <ul className="mt-3 max-h-[26rem] space-y-1 overflow-y-auto">
          {filtered.map((recipe) => {
            const already = items.some((item) => item.snapshot.recipeId === recipe.id);
            return (
              <li key={recipe.id}>
                <button
                  type="button"
                  disabled={already || isPending}
                  onClick={() => addRecipe(recipe)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                    already
                      ? "text-ink-300"
                      : "text-ink-700 hover:bg-sage-50"
                  }`}
                >
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: recipe.categoryColor ?? "#a8bc93" }}
                  />
                  <span className="min-w-0 flex-1 truncate">{recipe.name}</span>
                  <span className="flex-shrink-0 text-xs text-ink-300">
                    {already ? "hozzáadva" : "+"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {filtered.length === 0 && (
          <p className="mt-3 text-sm text-ink-400">Nincs találat.</p>
        )}
      </section>

      {/* --- Összevont lista ------------------------------------------ */}
      <section>
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-sage-300 p-8 text-center text-sm text-ink-400">
            Válassz recepteket a bal oldalon – itt áll össze az összevont
            bevásárlólista, mennyiség szerint összegezve.
          </p>
        ) : (
          <>
            <div className="card p-4 print:hidden">
              <h2 className="font-display text-xl text-ink-900">
                Kiválasztott receptek
              </h2>
              <ul className="mt-3 space-y-2">
                {items.map((item) => (
                  <li
                    key={item.snapshot.recipeId}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-sage-200 bg-white p-2.5"
                  >
                    <Link
                      href={`/receptek/${item.snapshot.slug}`}
                      className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900 hover:text-forest-600"
                    >
                      {item.snapshot.name}
                    </Link>

                    <input
                      type="number"
                      min={1}
                      step="any"
                      value={item.portions}
                      onChange={(event) =>
                        setPortions(
                          item.snapshot.recipeId,
                          Number(event.target.value),
                        )
                      }
                      className="w-20 rounded-lg border border-sage-300 px-2 py-1 text-center text-sm outline-none focus:border-forest-400"
                      aria-label="Mennyiség"
                    />
                    <span className="text-sm text-ink-400">
                      {item.snapshot.baseYieldUnitCode}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeItem(item.snapshot.recipeId)}
                      className="text-xs font-semibold text-ink-300 hover:text-plum-500"
                    >
                      kivétel
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="btn btn-ghost !py-1.5 text-sm"
                >
                  Lista ürítése
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-ghost !py-1.5 text-sm"
                >
                  Nyomtatás
                </button>
              </div>
            </div>

            <div className="card mt-4 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-2xl text-ink-900">
                  Bevásárlólista
                </h2>
                <p className="text-sm text-ink-400">
                  {merged.length} tétel · {items.length} receptből
                </p>
              </div>

              <hr className="rule-dashed my-4" />

              <div className="space-y-5">
                {grouped.map((group) => (
                  <div key={group.dimension}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-300">
                      {DIMENSION_LABELS[group.dimension] ?? group.dimension}
                    </h3>
                    <ul className="space-y-2">
                      {group.lines.map((line) => {
                        const rounded = shoppingQuantity(line);
                        const exact = displayQuantity(line);
                        const differs =
                          Math.abs(rounded.value - exact.value) > 0.001 ||
                          rounded.unit !== exact.unit;

                        return (
                          <li
                            key={line.key}
                            className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-sage-100 pb-2 last:border-0"
                          >
                            <span className="min-w-0 flex-1 prose-recipe">
                              {line.name}
                              {line.allergenNote && (
                                <span className="ml-2 align-middle text-[0.68rem] font-semibold uppercase tracking-wider text-plum-500">
                                  {line.allergenNote}
                                </span>
                              )}
                              {line.notes.length > 0 && (
                                <span className="block text-xs text-ink-400">
                                  {line.notes.join(" · ")}
                                </span>
                              )}
                            </span>

                            <span className="prose-recipe font-semibold text-ink-900">
                              {differs ? shoppingText(line) : quantityText(line)}
                            </span>

                            {differs && (
                              <span className="text-xs text-ink-300">
                                pontosan {quantityText(line)}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              {(cost > 0 || missingPrice > 0) && (
                <div className="mt-5 rounded-xl border border-sage-200 bg-sage-50 p-3">
                  <p className="text-sm text-ink-500">
                    Becsült anyagköltség:{" "}
                    <span className="font-display text-lg text-ink-900">
                      {money(cost)}
                    </span>
                    {missingPrice > 0 && (
                      <span className="text-ink-400">
                        {" "}
                        · {missingPrice} tételnél nincs ár
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
