import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

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

/**
 * Lépésfotó feltöltése a receptszerkesztőből.
 * Csak a fájlt tárolja és visszaadja a nevét – a recepthez kapcsolás a
 * mentéskor történik. (Ha közben mégsem mentesz, a fájl „árva” marad; ez
 * néhány száz kilobájt, és később takarítható.)
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, errors: ["Az adat nem olvasható."] }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ ok: false, errors: ["Nem érkezett képfájl."] }, { status: 400 });
  }

  const maxSetting = await prisma.appSetting.findUnique({
    where: { key: "maxPhotoSizeMb" },
  });
  const maxMb = Number(maxSetting?.value ?? 12) || 12;
  if (file.size > maxMb * 1024 * 1024) {
    return Response.json(
      { ok: false, errors: [`A kép nagyobb, mint ${maxMb} MB.`] },
      { status: 413 },
    );
  }

  const extension =
    EXTENSION_BY_MIME[file.type.toLowerCase()] ||
    path.extname(file.name).toLowerCase() ||
    ".jpg";

  if (!Object.values(EXTENSION_BY_MIME).includes(extension)) {
    return Response.json(
      { ok: false, errors: ["JPG, PNG, WEBP, GIF vagy AVIF formátum használható."] },
      { status: 400 },
    );
  }

  const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(
    path.join(UPLOAD_DIR, fileName),
    new Uint8Array(await file.arrayBuffer()),
  );

  return Response.json({ ok: true, fileName });
}
