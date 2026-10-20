"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveRecipe } from "@/app/receptek/actions";

export function RecipeForm({ categories = [], units = [], initial, mode }: any) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Recept alapadatok
  const [name, setName] = useState(initial?.name || "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId || categories[0]?.id || "");
  const [baseYieldQty, setBaseYieldQty] = useState<number>(initial?.baseYieldQty || 4);
  const [baseYieldUnitId, setBaseYieldUnitId] = useState(initial?.baseYieldUnitId || units[0]?.id || "");
  
  // Nyers bemásolt szövegek
  const [rawIngredients, setRawIngredients] = useState("");
  const [rawSteps, setRawSteps] = useState("");

  // Felismert elemek
  const [parsedIngredients, setParsedIngredients] = useState<any[]>([]);
  const [parsedSteps, setParsedSteps] = useState<string[]>([]);

  // Kezdeti viszonyítási alap a skálázáshoz
  const initialYieldQty = initial?.baseYieldQty || 4;

  // Hozzávaló felismerő logika
  function parseIngredients(text: string) {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    return lines.map((line) => {
      const match = line.match(/^([\d.,\/]+)\s*([a-zA-ZáéíóöőúűüÁÉÍÓÖŐÚŰÜ.]+)?\s+(.+)$/);
      if (match) {
        const qty = parseFloat(match[1].replace(",", ".")) || 1;
        const unitStr = (match[2] || "").toLowerCase();
        const ingredientName = match[3];

        const foundUnit = units.find((u: any) => 
          u.code.toLowerCase() === unitStr || u.name.toLowerCase() === unitStr
        );

        return { 
          qty, 
          unitId: foundUnit ? foundUnit.id : (units[0]?.id || null),
          name: ingredientName, 
          raw: line 
        };
      } else {
        return { 
          qty: 1, 
          unitId: null, 
          name: line, 
          raw: line 
        };
      }
    });
  }

  function handleIngredientsChange(text: string) {
    setRawIngredients(text);
    setParsedIngredients(parseIngredients(text));
  }

  function handleStepsChange(text: string) {
    setRawSteps(text);
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    setParsedSteps(lines);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    const finalIngredients = parsedIngredients.length > 0 ? parsedIngredients : parseIngredients(rawIngredients);
    const finalSteps = parsedSteps.length > 0 ? parsedSteps : rawSteps.split("\n").map(l => l.trim()).filter(Boolean);

    const payload = {
      ...(initial?.id ? { id: initial.id } : {}), // Csak szerkesztéskor küldünk id-t
      name,
      categoryId,
      baseYieldQty: Number(baseYieldQty),
      baseYieldUnitId,
      ingredients: finalIngredients.map((item) => ({
        name: item.name,
        quantity: item.qty * (baseYieldQty / (initialYieldQty || 1)),
        unitId: item.unitId,
        scalable: true,
        note: null,
        groupName: null,
        componentRecipeId: null,
      })),
      steps: finalSteps.map((stepText) => ({
        text: stepText,
        durationMinutes: null,
        temperatureC: null,
        note: null,
        photoFileName: null,
      })),
      tagNames: [],
      description: null,
      yieldNote: null,
      prepMinutes: null,
      bakeMinutes: null,
      bakeTemperatureC: null,
      difficulty: "medium",
      source: null,
      notes: null,
      isFavorite: false,
      usualYieldQty: null,
      usualYieldNote: null,
    };

    try {
      const result = await saveRecipe(payload);

      if (!result.ok) {
        console.error("Mentési hibák:", result.errors);
        alert("Mentési hiba: " + (result.errors?.[0] || "Ismeretlen hiba"));
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
            placeholder="Pl. Házi krémes"
            className="mt-1 w-full rounded-xl border border-sage-300 bg-white px-4 py-2.5 text-sm text-ink-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-slate-300">Kategória</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
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
          <label className="block text-sm font-medium text-ink-700 dark:text-slate-300">Mértékegység (pl. adag, szelet)</label>
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

      {/* 1. Szövegdoboz: Hozzávalók */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sage-200 dark:border-slate-800 shadow-sm">
        <h2 className="font-display text-xl text-ink-900 dark:text-slate-100">Hozzávalók bemásolása</h2>
        <p className="text-xs text-ink-500 mt-1">Másold be ide a hozzávalókat soronként (pl. 500 g liszt, 2 dl tej):</p>
        
        <textarea
          rows={6}
          value={rawIngredients}
          onChange={(e) => handleIngredientsChange(e.target.value)}
          placeholder={"500 g liszt\n2 dl tej\n100 g cukor"}
          className="mt-3 w-full rounded-xl border border-sage-300 bg-white p-4 text-sm text-ink-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 font-mono"
        />

        {parsedIngredients.length > 0 && (
          <div className="mt-4 border-t border-sage-200 dark:border-slate-800 pt-4">
            <h3 className="text-sm font-semibold text-ink-800 dark:text-slate-200">
              Felismert hozzávalók ({parsedIngredients.length} db) – skálázott mennyiségek:
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-ink-600 dark:text-slate-400 font-mono">
              {parsedIngredients.map((item, idx) => {
                const scaledQty = Number((item.qty * (baseYieldQty / (initialYieldQty || 1))).toFixed(2));
                return (
                  <li key={idx} className="bg-sage-50 dark:bg-slate-800 p-2 rounded-lg flex justify-between">
                    <span>{item.name}</span>
                    <span className="font-bold text-forest-700 dark:text-emerald-400">
                      {scaledQty}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* 2. Szövegdoboz: Elkészítési lépések */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sage-200 dark:border-slate-800 shadow-sm">
        <h2 className="font-display text-xl text-ink-900 dark:text-slate-100">Elkészítési lépések bemásolása</h2>
        <p className="text-xs text-ink-500 mt-1">Másold be ide a recept leírását vagy lépéseit:</p>
        
        <textarea
          rows={6}
          value={rawSteps}
          onChange={(e) => handleStepsChange(e.target.value)}
          placeholder={"1. A lisztet elkeverjük a margarinnal.\n2. Hozzáadjuk a tejet és simára gyúrjuk.\n3. 180 fokon 25 percig sütjük."}
          className="mt-3 w-full rounded-xl border border-sage-300 bg-white p-4 text-sm text-ink-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
        />

        {parsedSteps.length > 0 && (
          <div className="mt-4 border-t border-sage-200 dark:border-slate-800 pt-4">
            <h3 className="text-sm font-semibold text-ink-800 dark:text-slate-200">
              Felismert lépések száma: {parsedSteps.length} db
            </h3>
          </div>
        )}
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