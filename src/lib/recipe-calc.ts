/**
 * Számítási mag – szándékosan adatbázis nélküli, tiszta függvények.
 * Ezért önmagában is tesztelhető, és ugyanezt használja a receptlap,
 * a költségszámítás és a bevásárlólista is.
 */

import { roundForKitchen } from "./format.ts";

export type UnitInfo = {
  id: string;
  code: string;
  dimension: string;
  factorToBase: number;
};

export type CalcLine = {
  id: string;
  groupName: string | null;
  name: string;
  quantity: number | null;
  unit: UnitInfo | null;
  note: string | null;
  scalable: boolean;
  /** Kész recept hozzávalóként (a quantity ilyenkor hányszoros adag). */
  component: CalcComponent | null;
  /** Hozzávaló-törzs: azonosító és ár / bázisegység (Ft / g, ml, db). */
  masterId: string | null;
  pricePerBaseUnit: number | null;
  allergenNote: string | null;
};

export type CalcComponent = {
  id: string;
  name: string;
  slug: string;
  baseYieldQty: number;
  baseYieldUnitCode: string;
  lines: CalcLine[];
};

/** Ami a szorzáshoz kell – ennyi elég a felületnek is. */
export type Scalable = { quantity: number | null; scalable: boolean };

/** Egy sor szorzója: a nem skálázódó sorokat nem bántjuk. */
export function multiplierFor(line: { scalable: boolean }, factor: number): number {
  return line.scalable ? factor : 1;
}

/** A sor mennyisége adott szorzóval (null = „ízlés szerint”). */
export function scaledQuantity(line: Scalable, factor: number): number | null {
  if (line.quantity === null) return null;
  return line.quantity * multiplierFor(line, factor);
}

// ---------------------------------------------------------------------------
// A felületnek átadott, egyszerű forma
// ---------------------------------------------------------------------------

export type ScalerLine = {
  id: string;
  groupName: string | null;
  name: string;
  quantity: number | null;
  unitCode: string | null;
  note: string | null;
  scalable: boolean;
  /** Kész recept hozzávalóként: hányszoros adag. */
  isComponent: boolean;
  componentSlug: string | null;
  componentLines: ScalerLine[];
  /** Költségszámításhoz – a felület ugyanígy számol, mint a szerver. */
  pricePerBaseUnit: number | null;
  factorToBase: number | null;
};

export function toScalerLines(lines: CalcLine[]): ScalerLine[] {
  return lines.map((line) => ({
    id: line.id,
    groupName: line.groupName,
    name: line.name,
    quantity: line.quantity,
    unitCode: line.component ? "×" : (line.unit?.code ?? null),
    note: line.note,
    scalable: line.scalable,
    isComponent: line.component !== null,
    componentSlug: line.component?.slug ?? null,
    componentLines: line.component ? toScalerLines(line.component.lines) : [],
    pricePerBaseUnit: line.pricePerBaseUnit,
    factorToBase: line.unit?.factorToBase ?? null,
  }));
}

/** Anyagköltség a felületen, ugyanazzal a képlettel, mint a szerveren. */
export function costOfScalerLines(lines: ScalerLine[], factor: number): CostResult {
  let total = 0;
  let missingPrice = 0;
  let countedLines = 0;

  for (const line of lines) {
    countedLines += 1;

    if (line.isComponent) {
      const inner = costOfScalerLines(
        line.componentLines,
        factor * (line.quantity ?? 1),
      );
      total += inner.total;
      missingPrice += inner.missingPrice;
      continue;
    }

    const quantity = scaledQuantity(line, factor);
    if (
      quantity === null ||
      line.pricePerBaseUnit === null ||
      line.factorToBase === null
    ) {
      missingPrice += 1;
      continue;
    }

    total += quantity * line.factorToBase * line.pricePerBaseUnit;
  }

  return { total, missingPrice, countedLines };
}

/** A bázis sorok lapos listája – a felület csoportosításhoz használja. */
export function groupScalerLines(lines: ScalerLine[]) {
  const groups: { name: string; lines: ScalerLine[] }[] = [];
  for (const line of lines) {
    const name = line.groupName ?? "";
    const last = groups[groups.length - 1];
    if (!last || last.name !== name) groups.push({ name, lines: [line] });
    else last.lines.push(line);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Költség
// ---------------------------------------------------------------------------

export type CostResult = {
  /** Ft-ban, a kerekítés nélkül. */
  total: number;
  /** Hány sornál nincs ár (ebből nem tudunk számolni). */
  missingPrice: number;
  /** Hány hozzávaló-sort vettünk figyelembe összesen. */
  countedLines: number;
};

/** Egy sor költsége: mennyiség -> bázisegység -> ár. */
function lineCost(line: CalcLine, factor: number): number | null {
  if (line.component) {
    const inner = computeCost(
      line.component.lines,
      factor * (line.quantity ?? 1),
    );
    return inner.missingPrice === 0 ? inner.total : null;
  }

  const quantity = scaledQuantity(line, factor);
  if (quantity === null || !line.unit || line.pricePerBaseUnit === null) {
    return null;
  }
  // A faktorToBase a bázisegységre vált (kg -> g, l -> ml), az ár pedig
  // bázisegységre (g, ml, db) van megadva – így az átváltás pontos.
  return quantity * line.unit.factorToBase * line.pricePerBaseUnit;
}

export function computeCost(lines: CalcLine[], factor = 1): CostResult {
  let total = 0;
  let missingPrice = 0;
  let countedLines = 0;

  for (const line of lines) {
    countedLines += 1;
    const cost = lineCost(line, factor);
    if (cost === null) missingPrice += 1;
    else total += cost;
  }

  return { total, missingPrice, countedLines };
}

/** Javasolt eladási ár az anyagköltségből (pl. 3×). */
export function suggestedPrice(materialCost: number, multiplier: number): number {
  if (!Number.isFinite(multiplier) || multiplier <= 0) return materialCost;
  return materialCost * multiplier;
}

// ---------------------------------------------------------------------------
// Bevásárlólista
// ---------------------------------------------------------------------------

export type BaseLine = {
  key: string;
  name: string;
  /** mass | volume | count | other */
  dimension: string;
  /** Összesített mennyiség bázisegységben (g / ml / db). */
  baseQuantity: number;
  /** Az eredeti sorok egysége (ha mind ugyanaz), különben null. */
  unitCode: string | null;
  allergenNote: string | null;
  priceTotal: number | null;
  missingPrice: boolean;
  notes: string[];
  fromRecipes: string[];
  /** Hány receptben fordul elő. */
  usedIn: number;
};

const BASE_UNIT_BY_DIMENSION: Record<string, string> = {
  mass: "g",
  volume: "ml",
  count: "db",
};

function keyFor(line: CalcLine): { key: string; dimension: string } {
  const dimension = line.unit?.dimension ?? "other";
  if (line.masterId) return { key: `master:${line.masterId}`, dimension };
  const normalized = line.name.trim().toLowerCase();
  return { key: `nev:${normalized}|${line.unit?.code ?? ""}`, dimension };
}

/**
 * A hozzávalókat bázisegységre bontja, és összevonja.
 * Az összetett (alapreceptre hivatkozó) sorokat rekurzívan kibontja.
 */
export function flattenToBase(
  lines: CalcLine[],
  factor: number,
  recipeName: string,
  output: Map<string, BaseLine> = new Map(),
): Map<string, BaseLine> {
  for (const line of lines) {
    if (line.component) {
      flattenToBase(
        line.component.lines,
        factor * (line.quantity ?? 1),
        recipeName,
        output,
      );
      continue;
    }

    const quantity = scaledQuantity(line, factor);
    if (quantity === null || !line.unit) continue;

    const { key, dimension } = keyFor(line);
    const baseQuantity = quantity * line.unit.factorToBase;
    const cost = lineCost(line, factor);

    const existing = output.get(key);
    if (existing) {
      existing.baseQuantity += baseQuantity;
      existing.usedIn += 1;
      if (cost === null) existing.missingPrice = true;
      else existing.priceTotal = (existing.priceTotal ?? 0) + cost;
      if (line.note && !existing.notes.includes(line.note)) {
        existing.notes.push(line.note);
      }
      if (!existing.fromRecipes.includes(recipeName)) {
        existing.fromRecipes.push(recipeName);
      }
    } else {
      output.set(key, {
        key,
        name: line.name,
        dimension,
        baseQuantity,
        unitCode: line.unit.code,
        allergenNote: line.allergenNote,
        priceTotal: cost,
        missingPrice: cost === null,
        notes: line.note ? [line.note] : [],
        fromRecipes: [recipeName],
        usedIn: 1,
      });
    }
  }

  return output;
}

/** Konyhai, olvasható mennyiség: 1250 g -> „1,25 kg”, 2,5 dl, 250 ml. */
export function displayQuantity(line: BaseLine): { value: number; unit: string } {
  const { dimension, baseQuantity } = line;

  if (dimension === "mass") {
    if (baseQuantity >= 1000) return { value: baseQuantity / 1000, unit: "kg" };
    return { value: baseQuantity, unit: "g" };
  }
  if (dimension === "volume") {
    if (baseQuantity >= 1000) return { value: baseQuantity / 1000, unit: "l" };
    if (baseQuantity >= 100) return { value: baseQuantity / 100, unit: "dl" };
    return { value: baseQuantity, unit: "ml" };
  }
  if (dimension === "count") {
    return { value: baseQuantity, unit: line.unitCode ?? "db" };
  }
  return { value: baseQuantity, unit: line.unitCode ?? "" };
}

/** Vásárlásra kerekítés: 2,4 kg liszt -> vegyél 2,5 kg-ot. */
export function shoppingQuantity(line: BaseLine): { value: number; unit: string } {
  const { dimension, baseQuantity } = line;

  if (dimension === "mass" || dimension === "volume") {
    const step =
      baseQuantity <= 500
        ? 50
        : baseQuantity <= 2000
          ? 100
          : baseQuantity <= 10000
            ? 250
            : 500;
    const rounded = Math.ceil(baseQuantity / step) * step;
    return displayQuantity({ ...line, baseQuantity: rounded });
  }

  if (dimension === "count") {
    return { value: Math.ceil(baseQuantity), unit: line.unitCode ?? "db" };
  }

  return { value: roundForKitchen(baseQuantity), unit: line.unitCode ?? "" };
}

/** Mennyiség szövegesen, magyar formátumban. */
export function formatBaseQuantity(
  value: number,
  unit: string,
  maxDecimals = 2,
): string {
  const rounded = Number(value.toFixed(maxDecimals));
  return `${rounded.toLocaleString("hu-HU", { maximumFractionDigits: maxDecimals })} ${unit}`.trim();
}
