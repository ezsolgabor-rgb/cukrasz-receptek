/**
 * Megjelenítési segédek. A mennyiségeket magyar formátumban adjuk ki
 * (tizedesvessző), és konyhai értelemben kerekítünk.
 */

/** 1.5 -> "1,5"  |  0.333 -> "0,33"  |  12.0 -> "12" */
export function formatNumber(value: number, maxDecimals = 2): string {
  const rounded = Number(value.toFixed(maxDecimals));
  return rounded.toLocaleString("hu-HU", {
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * Konyhai kerekítés: kis mennyiségnél finomabban, nagynál durvábban.
 * (Pl. 7,3 g -> 7 g, de 0,7 g -> 0,7 g.)
 */
export function roundForKitchen(value: number): number {
  if (value === 0) return 0;
  if (value < 1) return Math.round(value * 100) / 100;
  if (value < 10) return Math.round(value * 10) / 10;
  if (value < 100) return Math.round(value);
  if (value < 1000) return Math.round(value / 5) * 5;
  return Math.round(value / 10) * 10;
}

/** "250 g" | "ízlés szerint" */
export function formatQuantity(
  quantity: number | null,
  unitCode?: string | null,
): string {
  if (quantity === null) return "ízlés szerint";
  const value = formatNumber(quantity, 2);
  return unitCode ? `${value} ${unitCode}` : value;
}

/** 95 -> "1 ó 35 p", 25 -> "25 perc" */
export function formatDuration(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} perc`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} ó` : `${hours} ó ${rest} p`;
}
