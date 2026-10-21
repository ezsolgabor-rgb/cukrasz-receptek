"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveRecipe } from "@/app/receptek/actions";

export function RecipeForm({ categories = [], units = [], initial, mode }: any) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Recept alapadatok
  const [name, setName] = useState(initial?.name || "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId || categories[0]?.id || null);
  const [baseYieldQty, setBaseYieldQty] = useState<number>(initial?.baseYieldQty || 4);
  const [baseYieldUnitId, setBaseYieldUnitId] = useState(initial?.baseYieldUnitId || units[0]?.id || "");
  
  // Hozzávalók listája (ahol a mértékegység már szabadon írható vagy választható)
  const [ingredients, setIngredients] = useState<any[]>(
    initial?.ingredients?.length > 0
      ? initial.ingredients.map((i: any) => ({
          qty: i.quantity || 1,
          unitName: units.find((u: any) => u.id === i.unitId)?.code || units[0]?.code || "g",
          name: i.name || "",
        }))
      : [
          { qty: 1, unitName: "g", name: "" },
          { qty: 1, unitName: "g", name: "" },
          { qty: 1, unitName: "g", name: "" },
        ]
  );

  // Elkészítési lépések
  const [steps, setSteps] = useState<string[]>(
    initial?.steps?.length > 0 ? initial.steps.map((s: any) => s.text) : [""]
  );

  const initialYieldQty = initial?.baseYieldQty || 4;

  function addIngredientRow() {
    setIngredients([...ingredients, { qty: 1, unitName: units[0]?.code || "g", name: "" }]);
  }

  function removeIngredientRow(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function addStepRow() {
    setSteps([...steps, ""]);
  }

  function removeStepRow(index: number) {
    setSteps(steps.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    // Itt leképezzük a szabadon beírt unitName-et a létező unitId-ra, 
    // vagy ha egyedi (pl. gerezd, ág), akkor a nevébe/megjegyzésbe ágyazzuk, hogy a Zod séma ne dobjon hibát.
    const mappedIngredients = ingredients
      .filter((i) => i.name.trim() !== "")
      .map((item) => {
        const scaledQty = Number((Number(item.qty) * (baseYieldQty / (initialYieldQty || 1))).toFixed(2));
        const matchedUnit = units.find((u: any) => u.code.toLowerCase() === item.unitName.toLowerCase() || u.name.toLowerCase() === item.unitName.toLowerCase());

        return {
          groupName: null,
          name: matchedUnit ? item.name.trim() : `${item.unitName} ${item.name}`.trim(), // Ha egyedi (pl. gerezd), bekerül a névbe
          quantity: scaledQty,
          unitId: matchedUnit ? matchedUnit.id : (units[0]?.id || null), // Ha egyedi, az alapértelmezett unitId-t kapja, de a szöveg megmarad a névben
          note: null,
          scalable: true,
          componentRecipeId: null,
        };
      });

    const payload = {
      ...(initial?.id ? { id: initial.id } : {}),
      name: name.trim(),
      categoryId: categoryId || null,
      description: null,
      baseYieldQty: Number(baseYieldQty),
      baseYieldUnitId,
      yieldNote: null,
      prepMinutes: null,
      bakeMinutes: null,
      bakeTemperatureC: null,
      difficulty: 3,
      source: null,
      notes: null,
      isFavorite: false,
      usualYieldQty: null,
      usualYieldNote: null,
      tagNames: [],
      ingredients: mappedIngredients,
      steps: steps
        .filter((s) => s.trim() !== "")
        .map((stepText) => ({
          text: stepText.trim(),
          durationMinutes: null,
          temperatureC: null,
          note: null,
          photoFileName: null,
        })),
    };

    try {
      const result = await saveRecipe(payload);

      if (!result.ok) {
        console.error("Mentési hibák:", result.errors);
        alert("Mentési hiba: " + (result.errors?.join(", ") || "Ismeretlen hiba"));
        return;
      }

      router.push(`/receptek/${result.slug}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Hiba történt a recept mentése során. Kérlek próbáld újra!");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Recept alapadatok */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sage-200 dark:border-slate-800 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-slate-300">Recept címe</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pl. Vargányás rizottó"
            className="mt-1 w-full rounded-xl border border-sage-300 bg-white px-4 py-2.5 text-sm text-ink-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-slate-300">Kategória</label>
          <select
            value={categoryId || ""}
            onChange={(e) => setCategoryId(e.target.value || null)}
            className="mt-1 w-full rounded-xl border border-sage-300 bg-white px-4 py-2.5 text-sm text-ink-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          >
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-slate-300">Alapadag / Mennyiség</label>
          <input
            type="number"
            step="any"
            value={baseYieldQty}
            onChange={(e) => setBaseYieldQty(parseFloat(e.target.value) || 1)}
            className="mt-1 w-full rounded-xl border border-sage-300 bg-white px-4 py-2.5 text-sm text-ink-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-slate-300">Adag mértékegysége</label>
          <select
            value={baseYieldUnitId}
            onChange={(e) => setBaseYieldUnitId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-sage-300 bg-white px-4 py-2.5 text-sm text-ink-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          >
            {units.map((u: any) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hozzávalók táblázatos / soronkénti nézete */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sage-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-display text-xl text-ink-900 dark:text-slate-100">Hozzávalók</h2>
            <p className="text-xs text-ink-500 mt-1">Válassz mértékegységet a listából, vagy írd be szabadon (pl. gerezd, ág):</p>
          </div>
          <button
            type="button"
            onClick={addIngredientRow}
            className="rounded-xl bg-forest-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-forest-700 transition"
          >
            + Új hozzávaló
          </button>
        </div>

        {/* Datalist a választható mértékegységekhez */}
        <datalist id="available-units">
          {units.map((u: any) => (
            <option key={u.id} value={u.code} />
          ))}
          <option value="gerezd" />
          <option value="ág" />
          <option value="ízlés szerint" />
          <option value="fej" />
          <option value="ek" />
          <option value="tk" />
        </datalist>

        <div className="space-y-3">
          {ingredients.map((item, index) => {
            const scaledQty = Number((Number(item.qty) * (baseYieldQty / (initialYieldQty || 1))).toFixed(2));
            return (
              <div key={index} className="flex gap-2 items-center bg-sage-50 dark:bg-slate-800 p-3 rounded-xl">
                {/* Mennyiség */}
                <input
                  type="number"
                  step="any"
                  value={item.qty}
                  onChange={(e) => {
                    const updated = [...ingredients];
                    updated[index].qty = e.target.value;
                    setIngredients(updated);
                  }}
                  placeholder="Mennyiség"
                  className="w-24 rounded-lg border border-sage-300 bg-white px-3 py-1.5 text-sm text-ink-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                />

                {/* Szabadon írható / választható mértékegység mező */}
                <input
                  type="text"
                  list="available-units"
                  value={item.unitName}
                  onChange={(e) => {
                    const updated = [...ingredients];
                    updated[index].unitName = e.target.value;
                    setIngredients(updated);
                  }}
                  placeholder="Mértékegység (pl. g, gerezd)"
                  className="w-32 rounded-lg border border-sage-300 bg-white px-3 py-1.5 text-sm text-ink-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                />

                {/* Hozzávaló neve */}
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => {
                    const updated = [...ingredients];
                    updated[index].name = e.target.value;
                    setIngredients(updated);
                  }}
                  placeholder="Hozzávaló neve (pl. fokhagyma)"
                  className="flex-1 rounded-lg border border-sage-300 bg-white px-3 py-1.5 text-sm text-ink-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                />

                {/* Élő skálázott érték jelzése */}
                <span className="text-xs text-forest-700 dark:text-emerald-400 font-mono w-20 text-right hidden sm:inline">
                  (= {scaledQty})
                </span>

                {/* Törlés gomb */}
                <button
                  type="button"
                  onClick={() => removeIngredientRow(index)}
                  className="text-red-500 hover:text-red-700 px-2 py-1 font-bold"
                  title="Sor törlése"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Elkészítési lépések */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sage-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-display text-xl text-ink-900 dark:text-slate-100">Elkészítési lépések</h2>
            <p className="text-xs text-ink-500 mt-1">Add meg a recept lépéseit soronként:</p>
          </div>
          <button
            type="button"
            onClick={addStepRow}
            className="rounded-xl bg-forest-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-forest-700 transition"
          >
            + Új lépés
          </button>
        </div>

        <div className="space-y-3">
          {steps.map((stepText, index) => (
            <div key={index} className="flex gap-2 items-start bg-sage-50 dark:bg-slate-800 p-3 rounded-xl">
              <span className="text-sm font-bold text-ink-500 pt-2">{index + 1}.</span>
              <textarea
                rows={2}
                value={stepText}
                onChange={(e) => {
                  const updated = [...steps];
                  updated[index] = e.target.value;
                  setSteps(updated);
                }}
                placeholder="Írd ide a lépés leírását..."
                className="flex-1 rounded-lg border border-sage-300 bg-white p-2.5 text-sm text-ink-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => removeStepRow(index)}
                className="text-red-500 hover:text-red-700 px-2 py-1 font-bold pt-2"
                title="Lépés törlése"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Mentés gomb */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-forest-700 px-6 py-3 text-base font-bold text-white shadow-md hover:bg-forest-800 transition disabled:opacity-50"
        >
          {isSaving ? "Mentés folyamatban..." : "Recept mentése a könyvbe 📖"}
        </button>
      </div>
    </form>
  );
}