"use client";

import { useState } from "react";

import {
  saveAppSettings,
  saveCakeSizes,
  saveCategories,
  saveIngredientMasters,
  saveUnits,
} from "@/app/beallitasok/actions";
import { EditableTable, type ColumnDef } from "@/components/settings/editable-table";
import type { RowData } from "@/lib/settings-types";

const TABS = [
  { key: "kategoriak", label: "Kategóriák" },
  { key: "mertekegysegek", label: "Mértékegységek" },
  { key: "tortaformak", label: "Tortaformák" },
  { key: "hozzavalok", label: "Hozzávaló-törzs" },
  { key: "beallitasok", label: "Beállítások" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const DIMENSION_OPTIONS = [
  { value: "mass", label: "Tömeg" },
  { value: "volume", label: "Űrtartalom" },
  { value: "count", label: "Darabszám" },
  { value: "other", label: "Egyéb" },
];

export function SettingsTabs({
  categories,
  units,
  cakeSizes,
  ingredients,
  settings,
  unitChoices,
}: {
  categories: RowData[];
  units: RowData[];
  cakeSizes: RowData[];
  ingredients: RowData[];
  settings: RowData[];
  unitChoices: { id: string; code: string; name: string }[];
}) {
  const [active, setActive] = useState<TabKey>("kategoriak");

  const unitOptions = [
    { value: "", label: "– nincs –" },
    ...unitChoices.map((unit) => ({ value: unit.id, label: unit.code })),
  ];

  const categoryColumns: ColumnDef[] = [
    { key: "name", label: "Név", type: "text", placeholder: "Pl. Torták" },
    { key: "color", label: "Szín", type: "color", width: "4.5rem" },
    { key: "sortOrder", label: "Sorrend", type: "number", width: "5.5rem" },
  ];

  const unitColumns: ColumnDef[] = [
    { key: "code", label: "Jel", type: "text", width: "5rem", placeholder: "g" },
    { key: "name", label: "Megnevezés", type: "text", placeholder: "gramm" },
    {
      key: "dimension",
      label: "Fajta",
      type: "select",
      width: "9rem",
      options: DIMENSION_OPTIONS,
    },
    { key: "factorToBase", label: "Váltószám", type: "number", width: "6.5rem" },
    { key: "decimals", label: "Tizedes", type: "number", width: "5rem" },
    { key: "sortOrder", label: "Sorrend", type: "number", width: "5.5rem" },
    { key: "isActive", label: "Aktív", type: "checkbox" },
  ];

  const cakeSizeColumns: ColumnDef[] = [
    { key: "diameterCm", label: "Átmérő (cm)", type: "number", width: "7rem" },
    { key: "slices", label: "Szelet", type: "number", width: "6rem" },
    {
      key: "note",
      label: "Megjegyzés",
      type: "text",
      placeholder: "Pl. a leggyakoribb forma",
    },
    { key: "isActive", label: "Aktív", type: "checkbox" },
  ];

  const ingredientColumns: ColumnDef[] = [
    { key: "name", label: "Hozzávaló", type: "text", placeholder: "Finomliszt" },
    {
      key: "defaultUnitId",
      label: "Egység",
      type: "select",
      width: "7rem",
      options: unitOptions,
    },
    { key: "allergenNote", label: "Allergén", type: "text", placeholder: "glutén (búza)" },
    { key: "pricePerBaseUnit", label: "Ár / egység", type: "number", width: "7rem" },
    { key: "supplierNote", label: "Beszerzés", type: "text" },
    { key: "isActive", label: "Aktív", type: "checkbox" },
  ];

  const settingColumns: ColumnDef[] = [
    { key: "label", label: "Beállítás", type: "text", readOnly: true },
    { key: "value", label: "Érték", type: "text" },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2 print:hidden">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`chip border px-3.5 py-1.5 text-sm transition-colors ${
              active === tab.key
                ? "border-forest-600 bg-forest-600 text-white"
                : "border-sage-300 bg-white text-ink-700 hover:border-forest-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card mt-4 p-5">
        {active === "kategoriak" && (
          <EditableTable
            columns={categoryColumns}
            initialRows={categories}
            blankRow={{ name: "", color: "#c97b3c", sortOrder: "0" }}
            onSave={saveCategories}
            addLabel="+ új kategória"
            hint="A kategóriák a nyitólap „menüpontjai”. A színt a kártyák és a címkék használják."
            deleteHint="Olyan kategória nem törölhető, amiben még van recept – előbb sorold át őket."
          />
        )}

        {active === "mertekegysegek" && (
          <EditableTable
            columns={unitColumns}
            initialRows={units}
            blankRow={{
              code: "",
              name: "",
              dimension: "mass",
              factorToBase: "1",
              decimals: "0",
              sortOrder: "0",
              isActive: true,
            }}
            onSave={saveUnits}
            addLabel="+ új mértékegység"
            hint="A „Fajta” és a „Váltószám” adja az automatikus átváltást: pl. kg = Tömeg, váltószám 1000 (1 kg = 1000 g)."
            deleteHint="Használatban lévő egységet nem törölünk – inkább vedd ki az „Aktív” pipát."
          />
        )}

        {active === "tortaformak" && (
          <EditableTable
            columns={cakeSizeColumns}
            initialRows={cakeSizes}
            blankRow={{ diameterCm: "", slices: "", note: "", isActive: true }}
            onSave={saveCakeSizes}
            addLabel="+ új forma"
            hint="A torta receptlapján ezekből választasz: egy kattintás, és minden hozzávaló a kívánt szeletszámra áll."
          />
        )}

        {active === "hozzavalok" && (
          <EditableTable
            columns={ingredientColumns}
            initialRows={ingredients}
            blankRow={{
              name: "",
              defaultUnitId: "",
              allergenNote: "",
              pricePerBaseUnit: "",
              supplierNote: "",
              isActive: true,
            }}
            onSave={saveIngredientMasters}
            addLabel="+ új hozzávaló"
            hint="Ez az „anyagkészlet”. A receptben beírt hozzávaló ehhez automatikusan kapcsolódik, ha a neve egyezik – így az allergén magától felkerül a receptre."
          />
        )}

        {active === "beallitasok" && (
          <EditableTable
            columns={settingColumns}
            initialRows={settings}
            blankRow={{}}
            onSave={saveAppSettings}
            canAdd={false}
            canRemove={false}
            hint="Az alkalmazás alapértékei – itt például a műhely nevét is átírhatod."
          />
        )}
      </div>
    </div>
  );
}
