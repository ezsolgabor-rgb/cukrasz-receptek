"use server";

import { revalidatePath } from "next/cache";

import {
  deletePhoto as deletePhotoCore,
  setCoverPhoto as setCoverPhotoCore,
  setPhotoOriginalScan as setPhotoOriginalScanCore,
  updatePhotoCaption as updatePhotoCaptionCore,
  type PhotoResult,
} from "@/lib/photo-repository";

export type PhotoActionResult = PhotoResult;

/**
 * Szerver-akciók a fotókhoz: a tényleges munka a
 * `lib/photo-repository.ts`-ben van, itt csak a gyorsítótár frissül.
 */

function revalidate(slug: string | null) {
  revalidatePath("/");
  if (slug) revalidatePath(`/receptek/${slug}`);
}

export async function setCoverPhoto(
  recipeId: string,
  photoId: string,
): Promise<PhotoActionResult> {
  const result = await setCoverPhotoCore(recipeId, photoId);
  if (result.ok) revalidate(result.slug);
  return result;
}

export async function updatePhotoCaption(
  photoId: string,
  caption: string,
): Promise<PhotoActionResult> {
  const result = await updatePhotoCaptionCore(photoId, caption);
  if (result.ok) revalidate(result.slug);
  return result;
}

export async function setPhotoOriginalScan(
  photoId: string,
  value: boolean,
): Promise<PhotoActionResult> {
  const result = await setPhotoOriginalScanCore(photoId, value);
  if (result.ok) revalidate(result.slug);
  return result;
}

export async function deletePhoto(photoId: string): Promise<PhotoActionResult> {
  const result = await deletePhotoCore(photoId);
  if (result.ok) revalidate(result.slug);
  return result;
}
