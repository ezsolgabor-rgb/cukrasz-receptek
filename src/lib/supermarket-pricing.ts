import { PrismaClient } from "@prisma/client";
import { ShoppingListItem } from "../components/shopping-list-generator";

const prisma = new PrismaClient();

type PriceComparison = {
  supermarketId: string;
  supermarketName: string;
  totalPrice: number;
  items: {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    price: number;
    isOnPromotion: boolean;
  }[];
};

/**
 * Kiszámolja a bevásárlólista teljes költségét az egyes szupermarketek árai alapján
 * @param items Bevásárlólista tételek
 * @returns Árak összehasonlítása szupermarketek között
 */
export async function comparePrices(
  items: ShoppingListItem[]
): Promise<PriceComparison[]> {
  const ingredientIds = items.map((item) => item.id);
  const today = new Date();

  // Összes ár és akció lekérése
  const [prices, promotions] = await Promise.all([
    prisma.ingredientPrice.findMany({
      where: {
        ingredientId: { in: ingredientIds },
        validFrom: { lte: today },
        OR: [{ validTo: null }, { validTo: { gte: today } }],
      },
      include: { supermarket: true },
    }),
    prisma.promotion.findMany({
      where: {
        ingredientId: { in: ingredientIds },
        validFrom: { lte: today },
        validTo: { gte: today },
      },
      include: { supermarket: true },
    }),
  ]);

  // Csoportosítás szupermarket szerint
  const supermarketMap = new Map<string, PriceComparison>();
  
  for (const item of items) {
    for (const price of prices.filter(p => p.ingredientId === item.id)) {
      // Akció ár ellenőrzése
      const promotion = promotions.find(
        (p) =>
          p.supermarketId === price.supermarketId &&
          p.ingredientId === item.id
      );
      
      const finalPrice = promotion?.discountPrice ?? price.pricePerBaseUnit;
      const totalPrice = (item.quantity * finalPrice) || 0;

      // Szupermarket összesítés frissítése
      const existing = supermarketMap.get(price.supermarketId) || {
        supermarketId: price.supermarketId,
        supermarketName: price.supermarket.name,
        totalPrice: 0,
        items: [],
      };

      existing.totalPrice += totalPrice;
      existing.items.push({
        ingredientId: item.id,
        ingredientName: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price: totalPrice,
        isOnPromotion: !!promotion,
      });

      supermarketMap.set(price.supermarketId, existing);
    }
  }

  // Rendezés összes ár szerint
  return Array.from(supermarketMap.values()).sort(
    (a, b) => a.totalPrice - b.totalPrice
  );
}

/**
 * Legolcsóbb bolt kiválasztása
 * @param comparisons Ár összehasonlítások
 * @returns Legolcsóbb bolt adatai
 */
export function getCheapestSupermarket(
  comparisons: PriceComparison[]
): PriceComparison | null {
  return comparisons.length > 0 ? comparisons[0] : null;
}
