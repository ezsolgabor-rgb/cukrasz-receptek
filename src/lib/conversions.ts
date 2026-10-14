/**
 * Mértékegység-konverziós motor cukrász alkalmazásokhoz
 */

// Alap sűrűség értékek (g/ml)
const DENSITIES = {
  WATER: 1.0,
  FLOUR: 0.53,
  SUGAR: 0.85,
  BUTTER: 0.91,
  OIL: 0.92,
  MILK: 1.03,
  EGG: 1.03,
  HONEY: 1.42
} as const;

// Mértékegységek és átváltási faktorok
const UNITS = {
  // Tömeg
  g: { type: 'mass', baseFactor: 1 },
  kg: { type: 'mass', baseFactor: 1000 },
  dkg: { type: 'mass', baseFactor: 10 },
  
  // Térfogat
  ml: { type: 'volume', baseFactor: 1 },
  l: { type: 'volume', baseFactor: 1000 },
  dl: { type: 'volume', baseFactor: 100 },
  tsp: { type: 'volume', baseFactor: 5 }, // teáskanál
  tbsp: { type: 'volume', baseFactor: 15 }, // evőkanál
  cup: { type: 'volume', baseFactor: 240 }, // csésze
  
  // Darabszám
  db: { type: 'count', baseFactor: 1 },
  csipet: { type: 'count', baseFactor: 1 },
  szelet: { type: 'count', baseFactor: 1 }
} as const;

type Unit = keyof typeof UNITS;
type DensityKey = keyof typeof DENSITIES;

/**
 * Mértékegység konvertálása
 * @param amount - Az átváltandó mennyiség
 * @param fromUnit - Ebből a mértékegységből
 * @param toUnit - Ebbe a mértékegységbe
 * @param ingredientDensity - Opcionális sűrűség (g/ml)
 * @returns A konvertált mennyiség
 */
export function convertUnit(
  amount: number,
  fromUnit: Unit,
  toUnit: Unit,
  ingredientDensity?: number
): number {
  // Ha ugyanaz az egység, nincs konverzió
  if (fromUnit === toUnit) return amount;

  const from = UNITS[fromUnit];
  const to = UNITS[toUnit];

  // Azonos típusú egységek közötti konverzió
  if (from.type === to.type) {
    return (amount * from.baseFactor) / to.baseFactor;
  }

  // Különböző típusú egységek (tömeg <-> térfogat)
  if ((from.type === 'mass' && to.type === 'volume') || 
      (from.type === 'volume' && to.type === 'mass')) {
    
    if (!ingredientDensity) {
      throw new Error(`Sűrűség megadása szükséges ${fromUnit} -> ${toUnit} konverzióhoz`);
    }

    // Tömeg -> térfogat
    if (from.type === 'mass') {
      const grams = amount * from.baseFactor;
      const ml = grams / ingredientDensity;
      return ml / to.baseFactor;
    }
    // Térfogat -> tömeg
    else {
      const ml = amount * from.baseFactor;
      const grams = ml * ingredientDensity;
      return grams / to.baseFactor;
    }
  }

  // Darabszám nem konvertálható más típusba
  throw new Error(`Nem támogatott konverzió: ${fromUnit} (${from.type}) -> ${toUnit} (${to.type})`);
}

/**
 * Segédfüggvény gyakori alapanyagok sűrűségének lekérdezéséhez
 */
export function getDensity(ingredient: DensityKey): number {
  return DENSITIES[ingredient];
}

// Példa használat:
/*
console.log('100 g liszt -> ml:', convertUnit(100, 'g', 'ml', DENSITIES.FLOUR));
console.log('2.5 dl tej -> g:', convertUnit(2.5, 'dl', 'g', DENSITIES.MILK));
console.log('3 evőkanál vaj -> g:', convertUnit(3, 'tbsp', 'g', DENSITIES.BUTTER));
console.log('1 kg cukor -> csésze:', convertUnit(1, 'kg', 'cup', DENSITIES.SUGAR));
*/
