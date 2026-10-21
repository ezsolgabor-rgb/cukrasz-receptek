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
  
  // Nyers bemásolt szövegek
  const [rawIngredients, setRawIngredients] = useState("");
  const [rawSteps, setRawSteps] = useState("");

  // Felismert elemek
  const [parsedIngredients, setParsedIngredients] = useState<any[]>([]);
  const [parsedSteps, setParsedSteps] = useState<string[]>([]);

  // Kezdeti viszonyítási alap a skálázáshoz
  const initialYieldQty = initial?.baseYieldQty || 4;

  // Finomhangolt hozzávaló értelmező
  function parseIngredients(text: string) {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    
    return lines.map((line) => {
      // Megpróbáljuk felosztani: [mennyiség] [mértékegység] [hozzávaló neve]
      // Pl: "15 g szárított vargánya", "2 ek olívaolaj", "1 fej salottahagyma", "3 gerezd fokhagyma", "só, bors"
      const match = line.match(/^([\d.,\/]+)\s*([a-zA-ZáéíóöőúűüÁÉÍÓÖŐÚŰÜ.]+)?\s*(.*)$/);
      
      if (match && match[1]) {
        const qty = parseFloat(match[1].replace(",", ".")) || 1;
        const possibleUnit = (match[2] || "").trim().toLowerCase();
        let ingredientName = (match[3] || "").trim();

        // Ha a match[2] nem egy ismert mértékegység, akkor az már a hozzávaló neve!
        const foundUnit = units.find((u: any) => 
          u.code?.toLowerCase() === possibleUnit || 
          u.name?.toLowerCase() === possibleUnit
        );

        if (foundUnit) {
          return {
            qty,
            unitId: foundUnit.id,
            unitName: foundUnit.code || foundUnit.name,
            name: ingredientName || possibleUnit,
            raw: line,
          };
        } else {
          // Ha nem találtunk mértékegységet, a lehetséges mértékegység szót visszatesszük a névhez
          const fullName = possibleUnit ? `${possibleUnit} ${ingredientName}`.trim() : ingredientName;
          return {
            qty,
            unitId: null, // Nincs mértékegység (pl. 1 fej, 2 db)
            unitName: "",
            name: fullName || line,
            raw: line,
          };
        }
      } else {
        // Ha nincs szám az elején (pl. "só, bors ízlés szerint")
        return { 
          qty: 1, 
          unitId: null, 
          unitName: "",
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
      id: initial?.id || null,
      name: name.trim(),
      categoryId: categoryId || null,
      description: null,
      baseYieldQty: Number(baseYieldQty),
      baseYieldUnitId: baseYieldUnitId,
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
      ingredients: finalIngredients.map((item) => ({
        groupName: null,
        name: item.name.trim(),
        quantity: Number((item.qty * (baseYieldQty / (initialYieldQty || 1))).toFixed(2)),
        unitId: item.unitId, // Pontos mértékegység ID vagy null
        note: null,
        scalable: true,
        componentRecipeId: null,
      })),
      steps: finalSteps.map((stepText) => ({
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
            placeholder="Pl. Házi krémes"
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
        <p className="text-xs text-ink-500 mt-1">
          Másold be ide a hozzávalókat soronként (pl. 500 g liszt, 2 dl tej, 1 fej hagymás):
        </p>
        
        <textarea
          rows={8}
          value={rawIngredients}
          onChange={(e) => handleIngredientsChange(e.target.value)}
          placeholder={"15 g szárított vargánya gomba\n300 ml forró víz\n1 fej salottahagyma\n2 gerezd fokhagyma\n2 ek olívaolaj\nsó, bors"}
          className="mt-3 w-full rounded-xl border border-sage-300 bg-white p-4 text-sm text-ink-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 font-mono"
        />

        {parsedIngredients.length > 0 && (
          <div className="mt-4 border-t border-sage-200 dark:border-slate-800 pt-4">
            <h3 className="text-sm font-semibold text-ink-800 dark:text-slate-200">
              Felismert hozzávalók előnézete ({parsedIngredients.length} db):
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-ink-600 dark:text-slate-400 font-mono">
              {parsedIngredients.map((item, idx) => {
                const scaledQty = Number((item.qty * (baseYieldQty / (initialYieldQty || 1))).toFixed(2));
                return (
                  <li key={idx} className="bg-sage-50 dark:bg-slate-800 p-2 rounded-lg flex justify-between">
                    <span>{item.name}</span>
                    <span className="font-bold text-forest-700 dark:text-emerald-400">
                      {scaledQty} {item.unitName}
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
          placeholder={"1. A vargányát forró vízbe áztatjuk.\n2. A salottahagymát finomra vágjuk..."}
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