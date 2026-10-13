// Szerveroldali adatréteg a fotókhoz – a szerver-akciók ezt hívják.
// Szándékosan sima függvények, hogy önmagukban is tesztelhetők legyenek.

import { unlink } from "node:fs/promises";

import { prisma } from "./db.ts";
import { uploadFilePath } from "./uploads.ts";

export type PhotoResult =
  | { ok: true; slug: string | null }
  | { ok: false; errors: string[] };

/** Borítókép beállítása – egyszerre csak egy fotó lehet borító. */
export async function setCoverPhoto(
  recipeId: string,
  photoId: string,
): Promise<PhotoResult> {
  const photo = await prisma.recipePhoto.findFirst({
    where: { id: photoId, recipeId },
    select: { id: true, recipe: { select: { slug: true } } },
  });
  if (!photo) {
    return { ok: false, errors: ["Ez a fotó nem ehhez a recepthez tartozik."] };
  }

  await prisma.$transaction([
    prisma.recipePhoto.updateMany({
      where: { recipeId },
      data: { isCover: false },
    }),
    prisma.recipePhoto.update({
      where: { id: photoId },
      data: { isCover: true },
    }),
  ]);

  return { ok: true, slug: photo.recipe.slug };
}

/** Képaláírás módosítása. */
export async function updatePhotoCaption(
  photoId: string,
  caption: string,
): Promise<PhotoResult> {
  const photo = await prisma.recipePhoto.update({
    where: { id: photoId },
    data: { caption: caption.trim() || null },
    select: { recipe: { select: { slug: true } } },
  });

  return { ok: true, slug: photo.recipe.slug };
}

/** „Ez a kézzel írt eredeti lap” jelző. */
export async function setPhotoOriginalScan(
  photoId: string,
  value: boolean,
): Promise<PhotoResult> {
  const photo = await prisma.recipePhoto.update({
    where: { id: photoId },
    data: { isOriginalScan: value },
    select: { recipe: { select: { slug: true } } },
  });

  return { ok: true, slug: photo.recipe.slug };
}

/**
 * Fotó törlése. Az adatbázis-rekord és a lemezen lévő fájl is törlődik.
 * Ha a borító tűnt el, az első megmaradt fotó lesz az új borító.
 */
export async function deletePhoto(photoId: string): Promise<PhotoResult> {
  const photo = await prisma.recipePhoto.findUnique({
    where: { id: photoId },
    select: {
      id: true,
      fileName: true,
      isCover: true,
      recipeId: true,
      recipe: { select: { slug: true } },
    },
  });

  if (!photo) {
    return { ok: false, errors: ["Ez a fotó már nem található."] };
  }

  await prisma.recipePhoto.delete({ where: { id: photo.id } });

  if (photo.isCover) {
    const next = await prisma.recipePhoto.findFirst({
      where: { recipeId: photo.recipeId },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });
    if (next) {
      await prisma.recipePhoto.update({
        where: { id: next.id },
        data: { isCover: true },
      });
    }
  }

  try {
    const filePath = uploadFilePath(photo.fileName);
    if (filePath) {
      await unlink(filePath);
    }
  } catch {
    // Ha a fájl már nincs meg, az nem hiba – az adatbázis a mérvadó.
  }

  return { ok: true, slug: photo.recipe.slug };
}
