import path from "node:path";

/**
 * A feltöltött fotók mappája.
 * Szándékosan fix helyen van (data/uploads a projekt gyökerében), nem
 * környezeti változóból jön: így a build is pontosan látja, hova nyúlunk,
 * és nem telepíti be feleslegesen az egész projektet a kiszolgáló kódba.
 */
export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

/** Csak egyszerű fájlnév engedett – mappába nem lehet kijutni. */
const SAFE_FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/**
 * Fájlnévből biztonságos abszolút útvonal.
 * `null`, ha a név gyanús (mappa, .., vagy a mappán kívülre mutatna).
 */
export function uploadFilePath(fileName: string): string | null {
  if (!SAFE_FILE_NAME.test(fileName) || fileName.includes("..")) return null;

  const resolved = path.resolve(UPLOAD_DIR, fileName);
  if (!resolved.startsWith(UPLOAD_DIR + path.sep)) return null;

  return resolved;
}
