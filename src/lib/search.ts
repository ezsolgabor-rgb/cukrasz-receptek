/**
 * Kereséshez: ékezetek és kis/nagybetűk eltüntetése.
 * Így a „kremes” is megtalálja a „Krémes”-t, a „beigli” a „Beigli”-t.
 */
export function normalizeForSearch(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
