import type { RecipeCardData } from "@/components/recipe-card";
import { prisma } from "@/lib/db";
import { normalizeForSearch } from "@/lib/search";

export type RecipeListFilters = {
  /** Keresőszöveg – ékezettől és kis/nagybetűtől függetlenül. */
  q?: string;
  categorySlug?: string;
  /** Kategória azonosítóval (akkor is működik, ha a slug közben megváltozott). */
  categoryId?: string;
  tagName?: string;
  favoriteOnly?: boolean;
  limit?: number;
  /** "name" = névsor (alapértelmezett), "recent" = legutóbb módosított elöl. */
  order?: "name" | "recent";
};

const cardInclude = {
  category: true,
  baseYieldUnit: true,
  tags: true,
  ingredients: {
    select: { name: true, ingredientMaster: { select: { allergenNote: true } } },
  },
  photos: { where: { isCover: true }, take: 1 },
  _count: { select: { steps: true } },
};

function loadRows(filters: RecipeListFilters) {
  return prisma.recipe.findMany({
    where: {
      isArchived: false,
      ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.tagName ? { tags: { some: { name: filters.tagName } } } : {}),
      ...(filters.favoriteOnly ? { isFavorite: true } : {}),
    },
    orderBy:
      filters.order === "recent"
        ? [{ updatedAt: "desc" }]
        : [{ isFavorite: "desc" }, { name: "asc" }],
    include: cardInclude,
  });
}

type RecipeRow = Awaited<ReturnType<typeof loadRows>>[number];

/** Minden, ami alapján keresni érdemes: név, leírás, forrás, címke, hozzávaló. */
function haystack(row: RecipeRow): string {
  return normalizeForSearch(
    [
      row.name,
      row.description ?? "",
      row.source ?? "",
      row.category?.name ?? "",
      ...row.tags.map((tag) => tag.name),
      ...row.ingredients.map((line) => line.name),
    ].join(" "),
  );
}

function toCard(row: RecipeRow): RecipeCardData {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    baseYieldQty: row.baseYieldQty,
    yieldNote: row.yieldNote,
    prepMinutes: row.prepMinutes,
    bakeMinutes: row.bakeMinutes,
    bakeTemperatureC: row.bakeTemperatureC,
    difficulty: row.difficulty,
    isFavorite: row.isFavorite,
    category: row.category
      ? {
          name: row.category.name,
          color: row.category.color,
          icon: row.category.icon,
        }
      : null,
    baseYieldUnit: row.baseYieldUnit
      ? {
          code: row.baseYieldUnit.code,
          name: row.baseYieldUnit.name,
        }
      : null,
    tags: row.tags.map((tag) => ({ id: tag.id, name: tag.name })),
    ingredients: row.ingredients.map((line) => ({
      name: line.name,
      allergenNote: line.ingredientMaster?.allergenNote ?? null,
    })),
    coverPhoto: row.photos[0]
      ? { fileName: row.photos[0].fileName, caption: row.photos[0].caption }
      : null,
    stepCount: row._count.steps,
  };
}

/**
 * Receptkártyák szűrve. A szöveges keresés a memóriában fut: így az
 * ékezetekre is jól működik, és 200 receptnél ez a leggyorsabb út.
 */
export async function listRecipeCards(
  filters: RecipeListFilters = {},
): Promise<RecipeCardData[]> {
  const rows = await loadRows(filters);

  const query = normalizeForSearch(filters.q ?? "");
  const matching = query ? rows.filter((row) => haystack(row).includes(query)) : rows;

  const limited = filters.limit ? matching.slice(0, filters.limit) : matching;
  return limited.map(toCard);
}

/** A kategóriák a nyitólaphoz: darabszám, előnézet és egy minta-fotó. */
export async function getCategorySummaries() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { recipes: true } },
      recipes: {
        where: { isArchived: false },
        orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
        select: {
          name: true,
          slug: true,
          photos: {
            where: { isCover: true },
            take: 1,
            select: { fileName: true },
          },
        },
      },
    },
  });

  return categories.map((category) => {
    const withPhoto = category.recipes.find((recipe) => recipe.photos.length > 0);
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      color: category.color,
      icon: category.icon,
      count: category._count.recipes,
      preview: category.recipes.slice(0, 4).map((recipe) => recipe.name),
      coverPhoto: withPhoto?.photos[0]?.fileName ?? null,
      firstSlug: category.recipes[0]?.slug ?? null,
    };
  });
}

/** Címkék darabszámmal – szűrőcsíkokhoz. */
export async function getTagSummaries(categorySlug?: string) {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      recipes: {
        where: { isArchived: false },
        select: { category: { select: { slug: true } } },
      },
    },
  });

  return tags
    .map((tag) => ({
      id: tag.id,
      name: tag.name,
      count: categorySlug
        ? tag.recipes.filter((recipe) => recipe.category?.slug === categorySlug).length
        : tag.recipes.length,
    }))
    .filter((tag) => tag.count > 0);
}

/** Egy kategória fejléchez. */
export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, color: true, icon: true },
  });
}