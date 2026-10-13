"use client";

/** Hosszabbik oldal ennyi pixelre csökken feltöltés előtt. */
const MAX_SIDE = 1800;
const JPEG_QUALITY = 0.85;

/**
 * A telefonos fotók 5-8 MB-osak lennének. A böngészőben kicsinyítjük őket
 * feltöltés előtt – így gyors a receptlap, és nem hízik meg a tár.
 * Ha a böngésző nem tudja megnyitni (pl. iPhone HEIC), az eredetit adjuk vissza.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));

    if (scale === 1 && file.size < 1_500_000) {
      bitmap.close();
      return file;
    }

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "foto";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    // Pl. HEIC: nem tudjuk átalakítani, marad az eredeti fájl.
    return file;
  }
}
