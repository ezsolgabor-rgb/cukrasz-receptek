import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { uploadFilePath } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

/** A feltöltött fotók kiszolgálása: /api/files/<fájlnév> */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const filePath = uploadFilePath(decodeURIComponent(name));

  if (!filePath) {
    return new Response("Hibás fájlnév", { status: 400 });
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      return new Response("Nem található", { status: 404 });
    }

    const content = await readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();

    return new Response(new Uint8Array(content), {
      headers: {
        "Content-Type": MIME_TYPES[extension] ?? "application/octet-stream",
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Nem található", { status: 404 });
  }
}
