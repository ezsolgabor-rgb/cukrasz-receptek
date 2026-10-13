/**
 * A szerkesztő űrlap és a szerveroldal közös típusai.
 */

export type UnitOption = {
  id: string;
  code: string;
  name: string;
  dimension: string;
  factorToBase: number;
};

export type CategoryOption = {
  id: string;
  name: string;
  color: string;
};

/** Kezdeti értékek a szerkesztőnek (üres űrlapnál minden null / üres). */
export type RecipeFormValues = {
  id: string | null;
  name: string;
  categoryId: string | null;
  description: string | null;
  baseYieldQty: number;
  baseYieldUnitId: string;
  yieldNote: string | null;
  prepMinutes: number | null;
  bakeMinutes: number | null;
  bakeTemperatureC: number | null;
  difficulty: number | null;
  source: string | null;
  notes: string | null;
  isFavorite: boolean;
  tagNames: string[];
  /** A szokásos sütési mennyiség (a receptlapi gyorsgomboz). */
  usualYieldQty: number | null;
  usualYieldNote: string | null;
  ingredients: {
    groupName: string | null;
    name: string;
    quantity: number | null;
    unitId: string | null;
    note: string | null;
    scalable: boolean;
    /** Ha ki van töltve, ez a sor egy másik recept (alaprecept). */
    componentRecipeId: string | null;
  }[];
  steps: {
    text: string;
    durationMinutes: number | null;
    temperatureC: number | null;
    note: string | null;
    /** Kép a lépéshez (a feltöltött fájl neve). */
    photoFileName: string | null;
  }[];
};

/** Egy választható alaprecept a szerkesztőhöz. */
export type ComponentChoice = {
  id: string;
  name: string;
  baseYieldQty: number;
  baseYieldUnitCode: string;
};

/** A mértékegységek csoportosítása a legördülő listához. */
export const DIMENSION_LABELS: Record<string, string> = {
  mass: "Tömeg",
  volume: "Űrtartalom",
  count: "Darabszám",
  other: "Egyéb",
};
