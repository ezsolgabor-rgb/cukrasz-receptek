"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import {
  deletePhoto,
  setCoverPhoto,
  setPhotoOriginalScan,
  updatePhotoCaption,
} from "@/app/receptek/photo-actions";

export type ManagedPhoto = {
  id: string;
  fileName: string;
  caption: string | null;
  isCover: boolean;
  isOriginalScan: boolean;
};

/** Hosszabbik oldal ennyi pixelre csökken feltöltés előtt. */
const MAX_SIDE = 1800;
const JPEG_QUALITY = 0.85;

/**
 * A telefonos fotók 5-8 MB-osak lennének. A böngészőben kicsinyítjük őket
 * feltöltés előtt – így gyors a receptlap, és nem hízik meg a tár.
 * Ha a böngésző nem tudja megnyitni (pl. iPhone HEIC), az eredetit töltjük fel.
 */
async function prepareFile(file: File): Promise<File> {
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

export function PhotoManager({
  recipeId,
  photos,
  maxMb,
}: {
  recipeId: string;
  photos: ManagedPhoto[];
  maxMb: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [asOriginal, setAsOriginal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setErrors([]);
    const collected: string[] = [];

    for (const [index, original] of files.entries()) {
      setBusy(`Feltöltés: ${index + 1} / ${files.length}`);
      try {
        const prepared = await prepareFile(original);
        const body = new FormData();
        body.append("recipeId", recipeId);
        body.append("file", prepared);
        body.append("isOriginalScan", asOriginal ? "true" : "false");
        body.append(
          "caption",
          original.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim(),
        );

        const response = await fetch("/api/photos", { method: "POST", body });
        const result = (await response.json()) as
          | { ok: true }
          | { ok: false; errors: string[] };

        if (!result.ok) {
          collected.push(...result.errors.map((e) => `${original.name}: ${e}`));
        }
      } catch {
        collected.push(`${original.name}: a feltöltés nem sikerült.`);
      }
    }

    setBusy(null);
    setErrors(collected);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  };

  const runAction = (action: () => Promise<unknown>) => {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* --- Feltöltés ------------------------------------------------- */}
      <div className="rounded-xl border border-dashed border-sage-300 bg-white p-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />

          <button
            type="button"
            className="btn btn-primary"
            disabled={busy !== null}
            onClick={() => inputRef.current?.click()}
          >
            {busy ?? "Fotó kiválasztása"}
          </button>

          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#4c6b44]"
              checked={asOriginal}
              onChange={(event) => setAsOriginal(event.target.checked)}
            />
            Ez a kézzel írt eredeti lap
          </label>

          <span className="text-xs text-ink-300">
            JPG, PNG, WEBP · max. {maxMb} MB · telefonról is mehet
          </span>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-ink-400">
          A nagy fotókat feltöltés előtt automatikusan kicsinyítjük, hogy gyors
          maradjon a receptlap. Az első feltöltött kép lesz a borító.
        </p>

        {errors.length > 0 && (
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-plum-500">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
      </div>

      {/* --- Feltöltött fotók ----------------------------------------- */}
      {photos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-sage-300 p-6 text-center text-sm text-ink-400">
          Még nincs fotó ennél a receptnél. Ide kerülhet a kész sütemény képe,
          a szeletelés állapota, vagy akár a kézzel írt lap fényképe.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <figure key={photo.id} className="card overflow-hidden">
              <div className="relative aspect-[4/3] w-full bg-sage-100">
                <Image
                  src={`/api/files/${encodeURIComponent(photo.fileName)}`}
                  alt={photo.caption ?? "Receptfotó"}
                  fill
                  sizes="(max-width: 640px) 100vw, 320px"
                  className="object-cover"
                />
                {photo.isCover && (
                  <span className="chip absolute left-2 top-2 bg-forest-600 text-white">
                    Borító
                  </span>
                )}
                {photo.isOriginalScan && (
                  <span className="chip absolute right-2 top-2 bg-plum-500 text-white">
                    Eredeti lap
                  </span>
                )}
              </div>

              <figcaption className="space-y-2 p-3">
                <input
                  defaultValue={photo.caption ?? ""}
                  placeholder="Képaláírás"
                  className="w-full rounded-lg border border-sage-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-forest-400"
                  onBlur={(event) => {
                    const value = event.target.value;
                    if (value !== (photo.caption ?? "")) {
                      void updatePhotoCaption(photo.id, value);
                    }
                  }}
                />

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {!photo.isCover && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => runAction(() => setCoverPhoto(recipeId, photo.id))}
                      className="font-semibold text-forest-600 hover:underline disabled:opacity-50"
                    >
                      Borító
                    </button>
                  )}

                  <label className="flex items-center gap-1.5 text-ink-500">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-[#4c6b44]"
                      defaultChecked={photo.isOriginalScan}
                      disabled={isPending}
                      onChange={(event) =>
                        runAction(() =>
                          setPhotoOriginalScan(photo.id, event.target.checked),
                        )
                      }
                    />
                    eredeti lap
                  </label>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Törlöd ezt a fotót? A fájl is törlődik a lemezről.",
                        )
                      ) {
                        runAction(() => deletePhoto(photo.id));
                      }
                    }}
                    className="ml-auto font-semibold text-plum-500 hover:underline disabled:opacity-50"
                  >
                    Törlés
                  </button>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
