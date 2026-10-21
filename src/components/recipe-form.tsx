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
  const [description, setDescription] = useState(initial?.description || "");
  const [prepMinutes, setPrepMinutes] = useState<number | "">(initial?.prepMinutes ?? "");
  const [bakeMinutes, setBakeMinutes] = useState<number | "">(initial?.bakeMinutes ?? "");
  const [bakeTemperatureC, setBakeTemperatureC] = useState<number | "">(initial?.bakeTemperatureC ?? "");
  const [difficulty, setDifficulty] = useState<number>(initial?.difficulty || 3);
  const [isFavorite, setIsFavorite] = useState<boolean>(initial?.isFavorite || false);

  // Kép feltöltés kezelése
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

  // Hozzávalók inicializálása
  const [ingredients, setIngredients] = useState<any[]>(() => {
    if (initial?.ingredients && initial.ingredients.length > 0) {
      return initial.ingredients.map((i: any) => {
        const foundUnit = units.find((u: any) => u.id === i.unitId);
        return {
          id: i.id || undefined,
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

  // Elkészítési lépések inicializálása
  const [steps, setSteps] = useState<any[]>(() => {
    if (initial?.steps && initial.steps.length > 0) {
      return initial.steps.map((s: any) => ({
        id: s.id || undefined,
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

  // Fájlfeltöltés kezelő (Kép hozzáadása)
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
          ...(s.id ? { id