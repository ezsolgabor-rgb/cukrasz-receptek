import { ShoppingList } from "@/components/shopping-list";
import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/db";
import { loadRecipePicker } from "@/lib/recipe-calc-data";

export const dynamic = "force-dynamic";

export const metadata = { title: "Bevásárlólista – Klau recepttár" };

export default async function ShoppingListPage() {
  const [recipes, currencySetting] = await Promise.all([
    loadRecipePicker(),
    prisma.appSetting.findUnique({ where: { key: "currency" } }),
  ]);

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="font-display text-3xl text-ink-900">Bevásárlólista</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
          Válogasd össze, mit fogsz sütni – a lista mennyiség szerint összevonja
          a hozzávalókat, és vásárlásra kerekíti. Az alaprecepteket (krémek,
          piskóták) is kibontja az összetevőire.
        </p>

        <div className="mt-6">
          <ShoppingList
            recipes={recipes}
            currency={currencySetting?.value ?? "Ft"}
          />
        </div>
      </main>
    </div>
  );
}
