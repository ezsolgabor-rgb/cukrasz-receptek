"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveRecipe } from "@/app/receptek/actions";

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function RecipeForm({ categories = [], units = [], initial, mode }: any) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState(initial?.name || "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId || categories[0]?.id || null);
  const [baseYieldQty, setBaseYieldQty] = useState<number>(initial?.baseYieldQty || 4);
  const [baseYieldUnitId, setBaseYieldUnitId] = useState(initial?.baseYieldUnitId || units[0]?.id || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [prepMinutes, setPrepMinutes] = useState<number | "">(initial?.prepMinutes ?? "");
  const [bakeMinutes, setBakeMinutes] = useState<number | "">(initial?.bakeMinutes ?? "");
  const [bakeTemperatureC, setBakeTemperatureC] = useState<number | "">(initial?.bakeTemperatureC ?? "");
  const [difficulty, setDifficulty] = useState<number>(initial?.difficulty || 3);
  const [isFavorite, setIsFavorite] = useState<boolean>(initial?.isFavorite || false);

  const [photos, setPhotos] = useState<any[]>(() => {
    if (initial?.photos && initial.photos.length > 0) {
      return initial.photos.map((p: any) => ({
        id: p.id,
        fileName: p.fileName,
        caption: p.caption || "",
        isCover: p.isCover || false,
      }));
    }
    return [];
  });

  const [ingredients, setIngredients] = useState<any[]>(() => {
    if (initial?.ingredients && initial.ingredients.length > 0) {
      return initial.ingredients.map((i: any) => {
        const foundUnit = units.find((u: any) => u.id === i.unitId);
        return {
          id: i.id,
          qty: i.quantity || 1,
          unitName: foundUnit ? (foundUnit.code || foundUnit.name) : (i.note || "g"),
          name: i.name || "",
        };
      });
    }
    return [
      { qty: 1, unitName: "g", name: "" },
      { qty: 1, unitName: "g", name: "" },
      { qty: 1, unitName: "g", name: "" },
    ];
  });

  const [steps, setSteps] = useState<any[]>(() => {
    if (initial?.steps && initial.steps.length > 0) {
      return initial.steps.map((s: any) => ({
        id: s.id,
        text: typeof s === "string" ? s : s.text,
      }));
    }
    return [{ text: "" }];
  });

  const initialYieldQty = initial?.baseYieldQty || 4;

  function addIngredientRow() {
    setIngredients([...ingredients, { qty: 1, unitName: "g", name: "" }]);
  }

  function removeIngredientRow(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function addStepRow() {
    setSteps([...steps, { text: "" }]);
  }

  function removeStepRow(index: number) {
    setSteps(steps.filter((_, i) => i !== index));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setPhotos((prev) => [
            ...prev,
            {
              fileName: data.fileName || data.filename || file.name,
              caption: "",
              isCover: prev.length === 0,
            },
          ]);
        } else {
          setPhotos((prev) => [
            ...prev,
            {
              fileName: file.name,
              caption: "",
              isCover: prev.length === 0,
            },
          ]);
        }
      } catch (err) {
        console.error("Kép feltöltési hiba:", err);
      }
    }
  }

  function removePhoto(index: number) {
    const newPhotos = photos.filter((_, i) => i !== index);
    if (photos[index]?.isCover && newPhotos.length > 0) {
      newPhotos[0].isCover = true;
    }
    setPhotos(newPhotos);
  }

  function setCoverPhoto(index: number) {
    setPhotos(
      photos.map((p, i) => ({
        ...p,
        isCover: i === index,
      }))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    const mappedIngredients = ingredients
      .filter((i) => i.name && i.name.trim() !== "")
      .map((item) => {
        const scaledQty = Number((Number(item.qty) * (baseYieldQty / (initialYieldQty || 1))).toFixed(2));
        const matchedUnit = units.find(
          (u: any) =>
            u.code?.toLowerCase() === item.unitName.trim().toLowerCase() ||
            u.name?.toLowerCase() === item.unitName.trim().toLowerCase()
        );

        return {
          ...(item.id ? { id: item.id } : {}),
          groupName: null,
          name: item.name.trim(),
          quantity: scaledQty,
          unitId: matchedUnit ? matchedUnit.id : (units[0]?.id || null),
          note: !matchedUnit && item.unitName.trim() ? item.unitName.trim() : null,
          scalable: true,
          componentRecipeId: null,
        };
      });

    const payload = {
      ...(initial?.id ? { id: initial.id } : {}),
      name: name.trim(),
      categoryId: categoryId || null,
      description: description.trim() || null,
      baseYieldQty: Number(baseYieldQty),
      baseYieldUnitId: baseYieldUnitId || units[0]?.id || null,
      yieldNote: null,
      prepMinutes: prepMinutes !== "" ? Number(prepMinutes) : null,
      bakeMinutes: bakeMinutes !== "" ? Number(bakeMinutes) : null,
      bakeTemperatureC: bakeTemperatureC !== "" ? Number(bakeTemperatureC) : null,
      difficulty: Number(difficulty),
      source: null,
      notes: null,
      isFavorite,
      usualYieldQty: null,
      usualYieldNote: null,
      tagNames: [],
      ingredients: mappedIngredients,
      steps: steps
        .filter((s) => s.text && s.text.trim() !== "")
        .map((s, index) => ({
          ...(s.id ? { id: s.id } : {}),
          stepIndex: index + 1,
          text: s.text.trim(),
          durationMinutes: null,
          temperatureC: null,
          note: null,
          photoFileName: null,
        })),
      photos: photos.map((p) => ({
        ...(p.id ? { id: p.id } : {}),
        fileName: p.fileName,
        caption: p.caption || null,
        isCover: Boolean(p.isCover),
      })),
    };

    try {
      const result = await saveRecipe(payload);

      if (!result?.ok) {
        console.error("Mentési hibák:", result?.errors);
        alert("Mentési hiba: " + (result?.errors?.join(", ") || "A megadott adatok érvénytelenek."));
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sage-200 dark:border-slate-800 shadow-sm">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink-700 dark:text-slate-300">Recept címe *</label>
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

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-ink-700 dark:text-slate-300">Alapadag</label>
            <input
              type="number"
              step="any"
              value={baseYieldQty}
              onChange={(e) => setBaseYieldQty(parseFloat(e.target.value) || 1)}
              className="mt-1 w-full rounded-xl border border-sage-300 bg-white px-4 py-2.5 text-sm text-ink-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-ink-700 dark:text-slate-300">Mértékegység</label>
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

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink-700 dark:text-slate-300">Rövid leírás / megjegyzés</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Egy rövid összefoglaló a receptről..."
            className="mt-1 w-full rounded-xl border border-sage-300 bg-white p-3 text-sm text-ink-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sage-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-display text-xl text-ink-900 dark:text-slate-100">📷 Fotók a receptről</h2>
            <p className="text-xs text-ink-500 mt-1">Tölts fel képeket az elkészült ételről!</p>
          </div>
          <label className="cursor-pointer rounded-xl bg-forest-600 px-4 py-2 text-xs font-semibold text-white hover:bg-forest-700 transition">
            + Kép feltöltése
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative group rounded-xl overflow-hidden border border-sage-200 dark:border-slate-700 p-2 bg-sage-50 dark:bg-slate-800">
                <div className="text-xs truncate font-semibold text-ink-700 dark:text-slate-200 mb-1">
                  {photo.fileName}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <button
                    type="button"
                    onClick={() => setCoverPhoto(index)}
                    className={`text-xs px-2 py-1 rounded-md font-semibold ${
                      photo.isCover
                        ? "bg-forest-600 text-white"
                        : "bg-sage-200 dark:bg-slate-700 text-ink-700 dark:text-slate-300"
                    }`}
                  >
                    {photo.isCover ? "★ Borító" : "Legyen borító"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="ml-auto text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sage-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-display text-xl text-ink-900 dark:text-slate-100">Hozzávalók</h2>
            <p className="text-xs text-ink-500 mt-1">Írd be a mennyiséget, mértékegységet és a nevet:</p>
          </div>
          <button
            type="button"
            onClick={addIngredientRow}
            className="rounded-xl bg-forest-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-forest-700 transition"
          >
            + Új hozzávaló
          </button>
        </div>

        <datalist id="unit-options">
          {units.map((u: any) => (
            <option key={u.id} value={u.code || u.name} />
          ))}
          <option value="g" />
          <option value="kg" />
          <option value="ml" />
          <option value="dl" />
          <option value="l" />
          <option value="ek" />
          <option value="tk" />
          <option value="gerezd" />
          <option value="ág" />
          <option value="db" />
        </datalist>

        <div className="space-y-3">
          {ingredients.map((item, index) => {
            return (
              <div key={index} className="flex gap-2 items-center bg-sage-50 dark:bg-slate-800 p-3 rounded-xl">
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

                <input
                  type="text"
                  list="unit-options"
                  value={item.unitName}
                  onChange={(e) => {
                    const updated = [...ingredients];
                    updated[index].unitName = e.target.value;
                    setIngredients(updated);
                  }}
                  placeholder="Mértékegység"
                  className="w-32 rounded-lg border border-sage-300 bg-white px-3 py-1.5 text-sm text-ink-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                />

                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => {
                    const updated = [...ingredients];
                    updated[index].name = e.target.value;
                    setIngredients(updated);
                  }}
                  placeholder="Hozzávaló neve"
                  className="flex-1 rounded-lg border border-sage-300 bg-white px-3 py-1.5 text-sm text-ink-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                />

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

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sage-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-display text-xl text-ink-900 dark:text-slate-100">Elkészítési lépések</h2>
            <p className="text-xs text-ink-500 mt-1">Add meg a lépéseket soronként:</p>
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
          {steps.map((step, index) => (
            <div key={index} className="flex gap-2 items-start bg-sage-50 dark:bg-slate-800 p-3 rounded-xl">
              <span className="text-sm font-bold text-ink-500 pt-2">{index + 1}.</span>
              <textarea
                rows={2}
                value={step.text}
                onChange={(e) => {
                  const updated = [...steps];
                  updated[index].text = e.target.value;
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