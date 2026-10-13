"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  costOfScalerLines,
  groupScalerLines,
  scaledQuantity,
  type ScalerLine,
} from "@/lib/recipe-calc";
import { formatNumber, formatQuantity, roundForKitchen } from "@/lib/format";

export type PanSize = {
  id: string;
  diameterCm: number;
  slices: number;
  note: string | null;
};

function money(value: number, currency: string): string {
  return `${value.toLocaleString("hu-HU", { maximumFractionDigits: 0 })} ${currency}`;
}

/** Egy hozzávaló-sor, a hozzá tartozó esetleges alrecepttel együtt. */
function LineItem({
  line,
  factor,
  path,
  checked,
  onToggle,
  showBase,
}: {
  line: ScalerLine;
  factor: number;
  path: string;
  checked: Record<string, boolean>;
  onToggle: (key: string) => void;
  showBase: boolean;
}) {
  const key = path;
  const isChecked = Boolean(checked[key]);

  // Összetett sor: nem mennyiséget, hanem hányszoros adagot mutatunk.
  const value = line.isComponent
    ? (line.quantity ?? 1) * (line.scalable ? factor : 1)
    : scaledQuantity(line, factor);

  const display = line.isComponent
    ? `${formatNumber(value ?? 1, 2)}× adag`
    : formatQuantity(
        value === null ? null : roundForKitchen(value),
        line.unitCode,
      );

  return (
    <li className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => onToggle(key)}
        className="check-circle mt-0.5"
        aria-label={isChecked ? "Kipipálás visszavonása" : "Kipipálva"}
        style={isChecked ? { background: "#4c6b44", borderColor: "#4c6b44" } : undefined}
      >
        {isChecked && <span className="text-xs font-bold text-white">✓</span>}
      </button>

      <div className="min-w-0 flex-1">
        <p className="prose-recipe">
          <span
            className={
              isChecked ? "text-ink-300 line-through" : "font-semibold text-ink-900"
            }
          >
            {display}
          </span>{" "}
          {line.isComponent && line.componentSlug ? (
            <Link
              href={`/receptek/${line.componentSlug}`}
              className={`underline decoration-dotted underline-offset-4 ${
                isChecked ? "text-ink-300" : "text-forest-700"
              }`}
              title="Ez egy alaprecept – kattints a megnyitásához"
            >
              {line.name}
            </Link>
          ) : (
            <span className={isChecked ? "text-ink-300" : ""}>{line.name}</span>
          )}

          {!line.scalable && (
            <span className="ml-2 align-middle text-[0.68rem] font-semibold uppercase tracking-wider text-ink-300">
              nem skálázódik
            </span>
          )}
        </p>

        {line.note && <p className="text-sm text-ink-400">{line.note}</p>}

        {showBase && line.scalable && line.quantity !== null && (
          <p className="text-xs text-ink-300">
            alap:{" "}
            {line.isComponent
              ? `${formatNumber(line.quantity, 2)}× adag`
              : formatQuantity(line.quantity, line.unitCode)}
          </p>
        )}

        {line.componentLines.length > 0 && (
          <ul className="mt-2 space-y-1.5 border-l border-dashed border-sage-300 pl-4">
            {line.componentLines.map((child) => (
              <LineItem
                key={child.id}
                line={child}
                factor={factor * (line.quantity ?? 1)}
                path={`${key}/${child.id}`}
                checked={checked}
                onToggle={onToggle}
                showBase={showBase}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

/**
 * A receptlap hozzávaló-blokkja.
 * A +/− léptetővel állítod, hány szeletre / tepsiire / adagra számoljunk,
 * és minden hozzávaló azonnal átvált. Az anyagköltség is élőben követi.
 */
export function RecipeIngredients({
  lines,
  baseYieldQty,
  baseYieldUnit,
  usualYieldQty = null,
  priceMultiplier = 0,
  currency = "Ft",
  panSizes = [],
}: {
  lines: ScalerLine[];
  baseYieldQty: number;
  baseYieldUnit: { code: string; name: string; dimension: string };
  usualYieldQty?: number | null;
  /** Az anyagköltség szorzója a javasolt eladási árhoz (pl. 3). */
  priceMultiplier?: number;
  currency?: string;
  panSizes?: PanSize[];
}) {
  const [target, setTarget] = useState<number>(baseYieldQty);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [hideChecked, setHideChecked] = useState(false);

  const isCount = baseYieldUnit.dimension === "count";

  const step = useMemo(() => {
    if (isCount) return 1;
    const raw = baseYieldQty / 10;
    if (raw <= 0) return 1;
    const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
    return Math.max(1, Math.round(raw / magnitude) * magnitude);
  }, [baseYieldQty, isCount]);

  const factor = baseYieldQty > 0 ? target / baseYieldQty : 1;
  const groups = useMemo(() => groupScalerLines(lines), [lines]);

  const cost = useMemo(() => costOfScalerLines(lines, factor), [lines, factor]);
  const hasAnyPrice = cost.total > 0;
  const perPortion = target > 0 && cost.total > 0 ? cost.total / target : 0;
  const suggested =
    priceMultiplier > 0 && cost.total > 0 ? cost.total * priceMultiplier : 0;

  const scaledLabel =
    Math.abs(factor - 1) < 0.001 ? null : `${formatNumber(factor, 2)}× mennyiség`;

  const toggle = (key: string) =>
    setChecked((current) => ({ ...current, [key]: !current[key] }));

  return (
    <section>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="font-display text-2xl text-ink-900">Hozzávalók</h2>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="btn-step"
            aria-label="Kevesebb"
            onClick={() => setTarget((t) => Math.max(1, Number((t - step).toFixed(2))))}
          >
            −
          </button>
          <input
            type="number"
            min={1}
            step={step}
            value={target}
            inputMode="decimal"
            onChange={(event) => {
              const next = Number(event.target.value);
              setTarget(Number.isFinite(next) && next > 0 ? next : 1);
            }}
            className="w-20 rounded-lg border border-sage-300 bg-white px-2 py-2 text-center font-display text-xl text-ink-900 outline-none focus:border-forest-400"
            aria-label="Mennyiség"
          />
          <button
            type="button"
            className="btn-step"
            aria-label="Több"
            onClick={() => setTarget((t) => Number((t + step).toFixed(2)))}
          >
            +
          </button>
          <span className="font-display text-xl text-ink-700">
            {baseYieldUnit.code}
          </span>
        </div>

        {scaledLabel && (
          <span className="chip border border-forest-200 bg-forest-600/5 text-forest-700">
            {scaledLabel}
          </span>
        )}

        {usualYieldQty !== null && Math.abs(target - usualYieldQty) > 0.001 && (
          <button
            type="button"
            onClick={() => setTarget(usualYieldQty)}
            className="chip border border-sage-300 bg-white text-forest-700 hover:border-forest-300"
            title="A szokásos sütési mennyiség"
          >
            ☆ szokásos: {formatNumber(usualYieldQty, 2)} {baseYieldUnit.code}
          </button>
        )}

        <button
          type="button"
          onClick={() => setHideChecked((value) => !value)}
          className="ml-auto text-xs font-semibold text-ink-400 underline decoration-dotted underline-offset-4 hover:text-forest-600 print:hidden"
        >
          {hideChecked ? "Kipipáltak mutatása" : "Kipipáltak elrejtése"}
        </button>
      </div>

      {panSizes.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 print:hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-300">
            Tortaforma
          </span>
          {panSizes.map((size) => {
            const isActive = Math.abs(target - size.slices) < 0.001;
            return (
              <button
                key={size.id}
                type="button"
                onClick={() => setTarget(size.slices)}
                title={size.note ?? undefined}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  isActive
                    ? "border-forest-600 bg-forest-600 text-white"
                    : "border-sage-300 bg-white text-ink-700 hover:border-forest-300"
                }`}
              >
                {size.diameterCm} cm · {size.slices} szelet
              </button>
            );
          })}
        </div>
      )}

      <hr className="rule-dashed my-4" />

      <div className="space-y-5">
        {groups.map((group) => {
          const visible = hideChecked
            ? group.lines.filter((line) => !checked[line.id])
            : group.lines;
          if (visible.length === 0) return null;

          return (
            <div key={group.name || "_"}>
              {group.name && (
                <h3 className="mb-2 font-display text-lg text-forest-600">
                  {group.name}
                </h3>
              )}
              <ul className="space-y-2.5">
                {visible.map((line) => (
                  <LineItem
                    key={line.id}
                    line={line}
                    factor={factor}
                    path={line.id}
                    checked={checked}
                    onToggle={toggle}
                    showBase={scaledLabel !== null}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* --- Anyagköltség --------------------------------------------- */}
      {(hasAnyPrice || cost.missingPrice > 0) && (
        <div className="mt-6 rounded-xl border border-sage-200 bg-white p-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-ink-300">
            Anyagköltség
          </p>

          {hasAnyPrice ? (
            <>
              <p className="mt-1 font-display text-xl text-ink-900">
                {money(cost.total, currency)}
                <span className="ml-2 text-sm font-normal text-ink-400">
                  {formatNumber(target, 2)} {baseYieldUnit.code}
                </span>
              </p>
              <p className="mt-1 text-sm text-ink-500">
                {money(perPortion, currency)} / {baseYieldUnit.code}
                {suggested > 0 && (
                  <>
                    {" · "}
                    <span className="text-forest-600">
                      javasolt ár: {money(suggested, currency)}
                    </span>
                    <span className="text-ink-300">
                      {" "}
                      (anyagköltség × {formatNumber(priceMultiplier, 1)})
                    </span>
                  </>
                )}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-ink-500">
              Még nincs ár megadva a hozzávalókhoz.
            </p>
          )}

          {cost.missingPrice > 0 && (
            <p className="mt-2 text-xs text-ink-400">
              {cost.missingPrice} sornál nincs ár a hozzávaló-törzsben, ezért a
              költség csak részben számolható. A Beállítások → Hozzávaló-törzs
              fülön pótolhatod.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
