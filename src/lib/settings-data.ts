// A beállítások tábláinak kanonikus betöltése.
// Ugyanezt használja a beállítások oldala és a mentő művelet is, így a
// megjelenített és a mentett forma nem csúszhat el egymástól.

import { prisma } from "./db.ts";
import type { RowData } from "./settings-types.ts";

export async function loadCategoryRows(): Promise<RowData[]> {
  const list = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return list.map((category) => ({
    id: category.id,
    values: {
      name: category.name,
      color: category.color,
      sortOrder: String(category.sortOrder),
    },
  }));
}

export async function loadUnitRows(): Promise<RowData[]> {
  const list = await prisma.unit.findMany({ orderBy: { sortOrder: "asc" } });
  return list.map((unit) => ({
    id: unit.id,
    values: {
      code: unit.code,
      name: unit.name,
      dimension: unit.dimension,
      factorToBase: String(unit.factorToBase),
      decimals: String(unit.decimals),
      sortOrder: String(unit.sortOrder),
      isActive: unit.isActive,
    },
  }));
}

export async function loadCakeSizeRows(): Promise<RowData[]> {
  const list = await prisma.cakeSize.findMany({ orderBy: { diameterCm: "asc" } });
  return list.map((size) => ({
    id: size.id,
    values: {
      diameterCm: String(size.diameterCm),
      slices: String(size.slices),
      note: size.note ?? "",
      isActive: size.isActive,
    },
  }));
}

export async function loadIngredientRows(): Promise<RowData[]> {
  const list = await prisma.ingredientMaster.findMany({ orderBy: { name: "asc" } });
  return list.map((item) => ({
    id: item.id,
    values: {
      name: item.name,
      defaultUnitId: item.defaultUnitId ?? "",
      allergenNote: item.allergenNote ?? "",
      pricePerBaseUnit:
        item.pricePerBaseUnit === null ? "" : String(item.pricePerBaseUnit),
      supplierNote: item.supplierNote ?? "",
      isActive: item.isActive,
    },
  }));
}

export async function loadAkcioFigyeloData(): Promise<RowData[]> {
  const list = await (prisma as any).akcioFigyelo.findMany({
    orderBy: { store: 'asc' },
    select: {
      id: true,
      name: true,
      store: true,
      keywords: true,
      isActive: true
    }
  });
  return list.map((akcio: {
    id: string;
    name: string;
    store: string;
    keywords: string[];
    isActive: boolean;
  }) => {
    const keywords = (akcio.keywords || []).join(', ');
      
    return {
      id: akcio.id,
      values: {
        name: akcio.name,
        store: akcio.store,
        keywords,
        isActive: akcio.isActive,
      },
    };
  });
}

export async function loadSettingRows(): Promise<RowData[]> {
  const list = await prisma.appSetting.findMany({
    orderBy: [{ group: "asc" }, { key: "asc" }],
  });
  return list.map((setting) => ({
    id: setting.key,
    values: {
      label: setting.label ?? setting.key,
      value: setting.value,
    },
  }));
}

/** Új akciófigyelő kategória hozzáadása */
export async function addAkcioKategoria(
  name: string,
  store: string,
  keywords: string[],
  userId: string
) {
  return await prisma.akcioFigyelo.create({
    data: {
      name,
      store,
      keywords,
      userId,
    },
  });
}

/** A mértékegység-választóhoz (pl. hozzávaló alapértelmezett egysége). */
export async function loadUnitChoices() {
  const units = await prisma.unit.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, code: true, name: true },
  });
  return units.map((unit) => ({ id: unit.id, code: unit.code, name: unit.name }));
}
