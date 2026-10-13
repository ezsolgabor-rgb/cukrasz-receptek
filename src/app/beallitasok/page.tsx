import { SettingsTabs } from "@/components/settings/settings-tabs";
import { SiteHeader } from "@/components/site-header";
import {
  loadCakeSizeRows,
  loadCategoryRows,
  loadIngredientRows,
  loadSettingRows,
  loadUnitChoices,
  loadUnitRows,
} from "@/lib/settings-data";

export const dynamic = "force-dynamic";

export const metadata = { title: "Beállítások – Klau recepttár" };

export default async function SettingsPage() {
  const [categories, units, cakeSizes, ingredients, settings, unitChoices] =
    await Promise.all([
      loadCategoryRows(),
      loadUnitRows(),
      loadCakeSizeRows(),
      loadIngredientRows(),
      loadSettingRows(),
      loadUnitChoices(),
    ]);

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="font-display text-3xl text-ink-900">Beállítások</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-500">
          Innen mindent kód írása nélkül szabályozhatsz. A módosítások mentés
          után azonnal életbe lépnek a recepteken és a nyitólapon is.
        </p>

        <div className="mt-6">
          <SettingsTabs
            categories={categories}
            units={units}
            cakeSizes={cakeSizes}
            ingredients={ingredients}
            settings={settings}
            unitChoices={unitChoices}
          />
        </div>
      </main>
    </div>
  );
}
