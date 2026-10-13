"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import type { Recipe } from "@/lib/recipe-types";
import { Checkbox } from "./ui/checkbox";
import { type Recipe } from "@/lib/recipe-types";

type ShoppingListItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  stores: {
    lidl?: {
      productName: string;
      packageSize: string;
      approxPrice: number;
    };
    aldi?: {
      productName: string;
      packageSize: string;
      approxPrice: number;
    };
  };
};

export function ShoppingListGenerator({ recipes }: { recipes: Recipe[] }) {
  const [store, setStore] = useState<"lidl" | "aldi" | "mixed">("lidl");
  const storeData = store === "mixed" ? undefined : item.stores[store];
  const [items, setItems] = useState<ShoppingListItem[]>([]);

  useEffect(() => {
    // TODO: Implementálni a tényleges listageneráló logikát
    const mockItems: ShoppingListItem[] = [
      {
        id: "1",
        name: "Liszt",
        quantity: 500,
        unit: "g",
        stores: {
          lidl: {
            productName: "Naturis finomliszt",
            packageSize: "1 kg",
            approxPrice: 450,
          },
        },
      },
    ];
    setItems(mockItems);
  }, [recipes, store]);

  return (
    <div className="animate-fade">
      <div className="flex gap-4 mb-6">
        <Button
          variant={store === "lidl" ? "default" : "outline"}
          onClick={() => setStore("lidl")}
        >
          LIDL lista
        </Button>
        <Button
          variant={store === "aldi" ? "default" : "outline"}
          onClick={() => setStore("aldi")}
        >
          ALDI lista
        </Button>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-4 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm"
          >
            <Checkbox className="h-5 w-5" />
            <div className="flex-1">
              <p className="font-medium text-ink-900 dark:text-slate-100">
                {item.name}
              </p>
              <p className="text-sm text-ink-500 dark:text-slate-400">
                {item.stores[store]?.productName || "Generált termék"} ·{" "}
                {item.stores[store]?.packageSize || ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-ink-700 dark:text-slate-200">
                {item.quantity} {item.unit}
              </p>
              {item.stores[store]?.approxPrice && (
                <p className="text-sm font-medium text-forest-600 dark:text-forest-400">
                  ~{item.stores[store]?.approxPrice.toLocaleString("hu-HU")} Ft
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
