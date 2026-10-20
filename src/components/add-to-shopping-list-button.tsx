"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  recipeId: string;
  recipeName: string;
  defaultQty?: number;
};

export function AddToShoppingListButton({
  recipeId,
  recipeName,
  defaultQty = 1,
}: Props) {
  const [added, setAdded] = useState(false);
  const router = useRouter();

  function handleAdd() {
    const STORAGE_KEY = "klau_shopping_list_v1"; // vagy a használt localStorage kulcs
    try {
      const existingRaw = localStorage.getItem(STORAGE_KEY);
      let items: Array<{ recipeId: string; targetQty: number }> = existingRaw
        ? JSON.parse(existingRaw)
        : [];

      const existingIndex = items.findIndex((i) => i.recipeId === recipeId);
      if (existingIndex >= 0) {
        items[existingIndex].targetQty += defaultQty;
      } else {
        items.push({ recipeId, targetQty: defaultQty });
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setAdded(true);

      setTimeout(() => setAdded(false), 3000);
    } catch (e) {
      console.error("Hiba a bevásárlólistához adáskor:", e);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleAdd}
        className="inline-flex items-center gap-1.5 rounded-xl border border-sage-300 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 shadow-sm hover:bg-sage-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 transition"
      >
        🛒 {added ? "Hozzáadva a listához!" : "Bevásárlólistához adom"}
      </button>

      {added && (
        <button
          type="button"
          onClick={() => router.push("/bevasarlolista")}
          className="text-xs text-forest-600 underline dark:text-forest-400"
        >
          Ugrás a listához →
        </button>
      )}
    </div>
  );
}