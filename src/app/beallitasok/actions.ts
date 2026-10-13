"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import {
  loadCakeSizeRows,
  loadCategoryRows,
  loadIngredientRows,
  loadSettingRows,
  loadUnitRows,
} from "@/lib/settings-data";
import type { RowPayload, SaveResult } from "@/lib/settings-types";
import { slugify } from "@/lib/slug";

const text = (value: string | boolean | undefined): string =>
  typeof value === "string" ? value.trim() : "";

const bool = (value: string | boolean | undefined): boolean =>
  value === true || value === "true";

const num = (value: string | boolean | undefined, fallback = 0): number => {
  const raw = typeof value === "string" ? value.replace(",", ".").trim() : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const int = (value: string | boolean | undefined, fallback = 0): number =>
  Math.round(num(value, fallback));

function refresh() {
  revalidatePath("/");
  revalidatePath("/receptek");
  revalidatePath("/beallitasok");
}

// ---------------------------------------------------------------------------
// Kategóriák
// ---------------------------------------------------------------------------

async function categorySlug(name: string, exceptId?: string): Promise<string> {
  const root = slugify(name) || "kategoria";
  let candidate = root;
  let counter = 2;

  for (;;) {
    const existing = await prisma.category.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === exceptId) return candidate;
    candidate = `${root}-${counter}`;
    counter += 1;
  }
}

export async function saveCategories(rows: RowPayload[]): Promise<SaveResult> {
  const errors: string[] = [];

  for (const row of rows) {
    const name = text(row.values.name);

    if (row.removed) {
      if (!row.id) continue;
      const used = await prisma.recipe.count({ where: { categoryId: row.id } });
      if (used > 0) {
        errors.push(
          `„${name || "Névtelen"}”: ${used} recept tartozik ide, ezért nem törölhető. Sorold át őket előbb.`,
        );
        continue;
      }
      await prisma.category.delete({ where: { id: row.id } });
      continue;
    }

    if (!name) {
      errors.push("A kategória neve nem lehet üres.");
      continue;
    }

    const duplicate = await prisma.category.findFirst({
      where: { name, ...(row.id ? { NOT: { id: row.id } } : {}) },
      select: { id: true },
    });
    if (duplicate) {
      errors.push(`„${name}”: már van ilyen nevű kategória.`);
      continue;
    }

    const color = text(row.values.color) || "#7a8570";
    const sortOrder = int(row.values.sortOrder, 0);

    if (row.id) {
      const existing = await prisma.category.findUnique({
        where: { id: row.id },
        select: { name: true, slug: true },
      });
      const slug =
        existing && existing.name === name
          ? existing.slug
          : await categorySlug(name, row.id);
      await prisma.category.update({
        where: { id: row.id },
        data: { name, color, sortOrder, slug },
      });
    } else {
      await prisma.category.create({
        data: { name, color, sortOrder, slug: await categorySlug(name) },
      });
    }
  }

  refresh();
  return { ok: errors.length === 0, errors, rows: await loadCategoryRows() };
}

// ---------------------------------------------------------------------------
// Mértékegységek
// ---------------------------------------------------------------------------

const DIMENSIONS = ["mass", "volume", "count", "other"];

export async function saveUnits(rows: RowPayload[]): Promise<SaveResult> {
  const errors: string[] = [];

  for (const row of rows) {
    const code = text(row.values.code);

    if (row.removed) {
      if (!row.id) continue;
      const [usedAsYield, usedInLines] = await Promise.all([
        prisma.recipe.count({ where: { baseYieldUnitId: row.id } }),
        prisma.recipeIngredient.count({ where: { unitId: row.id } }),
      ]);
      if (usedAsYield > 0 || usedInLines > 0) {
        errors.push(
          `„${code}”: ${usedAsYield} recept adagja és ${usedInLines} hozzávaló-sor használja, ezért nem törölhető. Kapcsold inkább ki.`,
        );
        continue;
      }
      await prisma.unit.delete({ where: { id: row.id } });
      continue;
    }

    if (!code) {
      errors.push("A mértékegység jele nem lehet üres.");
      continue;
    }

    const duplicate = await prisma.unit.findFirst({
      where: { code, ...(row.id ? { NOT: { id: row.id } } : {}) },
      select: { id: true },
    });
    if (duplicate) {
      errors.push(`„${code}”: már van ilyen jelű mértékegység.`);
      continue;
    }

    const dimension = text(row.values.dimension);
    const data = {
      code,
      name: text(row.values.name) || code,
      dimension: DIMENSIONS.includes(dimension) ? dimension : "other",
      factorToBase: num(row.values.factorToBase, 1) || 1,
      decimals: Math.min(4, Math.max(0, int(row.values.decimals, 0))),
      sortOrder: int(row.values.sortOrder, 0),
      isActive: bool(row.values.isActive),
    };

    if (row.id) {
      await prisma.unit.update({ where: { id: row.id }, data });
    } else {
      await prisma.unit.create({ data });
    }
  }

  refresh();
  return { ok: errors.length === 0, errors, rows: await loadUnitRows() };
}

// ---------------------------------------------------------------------------
// Tortaformák
// ---------------------------------------------------------------------------

export async function saveCakeSizes(rows: RowPayload[]): Promise<SaveResult> {
  const errors: string[] = [];

  for (const row of rows) {
    const diameterCm = int(row.values.diameterCm, 0);

    if (row.removed) {
      if (row.id) await prisma.cakeSize.delete({ where: { id: row.id } });
      continue;
    }

    if (diameterCm <= 0) {
      errors.push("A forma átmérője legyen nagyobb nullánál.");
      continue;
    }

    const slices = int(row.values.slices, 0);
    if (slices <= 0) {
      errors.push(`${diameterCm} cm: a szeletszám legyen nagyobb nullánál.`);
      continue;
    }

    const duplicate = await prisma.cakeSize.findFirst({
      where: { diameterCm, ...(row.id ? { NOT: { id: row.id } } : {}) },
      select: { id: true },
    });
    if (duplicate) {
      errors.push(`${diameterCm} cm: már szerepel a listában.`);
      continue;
    }

    const data = {
      diameterCm,
      slices,
      note: text(row.values.note) || null,
      isActive: bool(row.values.isActive),
      sortOrder: diameterCm * 10,
    };

    if (row.id) {
      await prisma.cakeSize.update({ where: { id: row.id }, data });
    } else {
      await prisma.cakeSize.create({ data });
    }
  }

  refresh();
  return { ok: errors.length === 0, errors, rows: await loadCakeSizeRows() };
}

// ---------------------------------------------------------------------------
// Hozzávaló-törzsadat
// ---------------------------------------------------------------------------

export async function saveIngredientMasters(rows: RowPayload[]): Promise<SaveResult> {
  const errors: string[] = [];

  for (const row of rows) {
    const name = text(row.values.name);

    if (row.removed) {
      if (row.id) await prisma.ingredientMaster.delete({ where: { id: row.id } });
      continue;
    }

    if (!name) {
      errors.push("A hozzávaló neve nem lehet üres.");
      continue;
    }

    const duplicate = await prisma.ingredientMaster.findFirst({
      where: { name, ...(row.id ? { NOT: { id: row.id } } : {}) },
      select: { id: true },
    });
    if (duplicate) {
      errors.push(`„${name}”: már szerepel a törzsben.`);
      continue;
    }

    const priceText = text(row.values.pricePerBaseUnit);

    const data = {
      name,
      defaultUnitId: text(row.values.defaultUnitId) || null,
      allergenNote: text(row.values.allergenNote) || null,
      supplierNote: text(row.values.supplierNote) || null,
      pricePerBaseUnit: priceText ? num(priceText, 0) : null,
      isActive: bool(row.values.isActive),
    };

    if (row.id) {
      await prisma.ingredientMaster.update({ where: { id: row.id }, data });
    } else {
      await prisma.ingredientMaster.create({ data });
    }
  }

  refresh();
  return { ok: errors.length === 0, errors, rows: await loadIngredientRows() };
}

// ---------------------------------------------------------------------------
// Beállítások (kulcs-érték)
// ---------------------------------------------------------------------------

export async function saveAppSettings(rows: RowPayload[]): Promise<SaveResult> {
  const errors: string[] = [];

  for (const row of rows) {
    const key = row.id ?? text(row.values.key);
    if (!key) {
      errors.push("Hiányzó beállítás-kulcs.");
      continue;
    }

    await prisma.appSetting.upsert({
      where: { key },
      update: { value: text(row.values.value) },
      create: {
        key,
        value: text(row.values.value),
        label: text(row.values.label) || null,
        group: "general",
      },
    });
  }

  refresh();
  return { ok: errors.length === 0, errors, rows: await loadSettingRows() };
}
