import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { UPLOAD_DIR } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

type UploadResponse =
  | { ok: true; fileName: string; isCover: boolean }
  | { ok: false; errors: string[] };

/**
 * Fotó feltöltése egy recepthez.
 * A fájl a data/uploads mappába kerül, az adatbázisba csak a hivatkozás.
 * Az első fotó automatikusan borító lesz.
 */
export async function POST(request: Request): Promise<Response> {
  const fail = (errors: string[], status = 400) =>
    Response.json({ ok: false, errors } satisfies UploadResponse, { status });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(["A feltöltött adat nem olvasható."]);
  }

  const recipeId = String(form.get("recipeId") ?? "");
  if (!recipeId) return fail(["Hiányzó recept – a feltöltés nem azonosítható."]);

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail(["Nem érkezett képfájl."]);
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true, slug: true },
  });
  if (!recipe) return fail(["Ez a recept nem található."], 404);

  const maxSizeSetting = await prisma.appSetting.findUnique({
    where: { key: "maxPhotoSizeMb" },
  });
  const maxMb = Number(maxSizeSetting?.value ?? 12);
  const limit = (Number.isFinite(maxMb) && maxMb > 0 ? maxMb : 12) * 1024 * 1024;

  if (file.size > limit) {
    return fail(
      [`A fotó nagyobb, mint ${Math.round(limit / 1024 / 1024)} MB. Próbáld kisebbre venni, vagy töltsd fel telefonról.`],
      413,
    );
  }

  const extension =
    EXTENSION_BY_MIME[file.type.toLowerCase()] ||
    path.extname(file.name).toLowerCase() ||
    ".jpg";

  if (!Object.values(EXTENSION_BY_MIME).includes(extension)) {
    return fail([
      "Ez a fájltípus nem használható. JPG, PNG, WEBP, GIF vagy AVIF formátum kell.",
    ]);
  }

  const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;
  const caption = String(form.get("caption") ?? "").trim() || null;
  const isOriginalScan = String(form.get("isOriginalScan") ?? "") === "true";

  await mkdir(UPLOAD_DIR, { recursive: true });
  const contents = new Uint8Array(await file.arrayBuffer());
  // A fájlnevet mi adjuk (időbélyeg + véletlen), ezért itt nem kell
  // a felhasználótól származó nevet ellenőrizni.
  await writeFile(path.join(UPLOAD_DIR, fileName), contents);

  const existing = await prisma.recipePhoto.count({ where: { recipeId } });

  const photo = await prisma.recipePhoto.create({
    data: {
      recipeId,
      fileName,
      caption,
      isOriginalScan,
      isCover: existing === 0,
      sortOrder: existing,
    },
    select: { fileName: true, isCover: true },
  });

  revalidatePath("/");
  revalidatePath(`/receptek/${recipe.slug}`);

  return Response.json({
    ok: true,
    fileName: photo.fileName,
    isCover: photo.isCover,
  } satisfies UploadResponse);
}
