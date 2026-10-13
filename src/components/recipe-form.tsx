"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";

import { deleteRecipe, saveRecipe } from "@/app/receptek/actions";
import type {
  CategoryOption,
  ComponentChoice,
  RecipeFormValues,
  UnitOption,
} from "@/lib/recipe-form-types";
import { DIMENSION_LABELS } from "@/lib/recipe-form-types";

type ItemDraft = {
  key: string;
  name: string;
  quantity: string;
  unitId: string;
  note: string;
  scalable: boolean;
  /** Ha ki van töltve, ez a sor egy másik recept (alaprecept). */
  componentRecipeId: string;
};

type GroupDraft = { key: string; name: string; items: ItemDraft[] };

type StepDraft = {
  key: string;
  text: string;
  duration: string;
  temperature: string;
  note: string;
  photoFileName: string | null;
};

/** „250” | „0,5” | „1.5” -> szám, üres -> null */
function parseNum(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

const numToText = (value: number | null | undefined): string =>
  value === null || value === undefined ? "" : String(value);

function emptyItem(key: string): ItemDraft {
  return {
    key,
    name: "",
    quantity: "",
    unitId: "",
    note: "",
    scalable: true,
    componentRecipeId: "",
  };
}

function emptyStep(key: string): StepDraft {
  return {
    key,
    text: "",
    duration: "",
    temperature: "",
    note: "",
    photoFileName: null,
  };
}

/** A mentett hozzávaló-sorokból csoportblokkokat készítünk. */
function toGroups(values: RecipeFormValues, keyPrefix: string): GroupDraft[] {
  const groups: GroupDraft[] = [];
  let current: GroupDraft | null = null;

  values.ingredients.forEach((line, index) => {
    const groupName = line.groupName ?? "";
    if (!current || current.name !== groupName) {
      current = { key: `${keyPrefix}g${groups.length}`, name: groupName, items: [] };
      groups.push(current);
    }
    current.items.push({
      key: `${keyPrefix}i${index}`,
      name: line.name,
      quantity: numToText(line.quantity),
      unitId: line.unitId ?? "",
      note: line.note ?? "",
      scalable: line.scalable,
      componentRecipeId: line.componentRecipeId ?? "",
    });
  });

  if (groups.length === 0) {
    groups.push({ key: `${keyPrefix}g0`, name: "", items: [emptyItem(`${keyPrefix}i0`)] });
  }
  return groups;
}

function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-300">{hint}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-sage-300 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-forest-400";

export function RecipeForm({
  mode,
  initial,
  cancelHref,
  units,
  categories,
  groupSuggestions,
  componentChoices,
}: {
  mode: "create" | "edit";
  initial: RecipeFormValues;
  /** Hova lépjen vissza a „Mégse” – új receptnél a lista, módosításnál a receptlap. */
  cancelHref: string;
  units: UnitOption[];
  categories: CategoryOption[];
  groupSuggestions: string[];
  /** Beépíthető alapreceptek (krémek, piskóták, tészták). */
  componentChoices: ComponentChoice[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<string[]>([]);

  const keyPrefix = mode === "edit" ? "e" : "n";
  const counter = useRef(0);
  const nextKey = (prefix: string) => `${prefix}x${counter.current++}`;

  // --- Alapadatok --------------------------------------------------------
  const [name, setName] = useState(initial.name);
  const [categoryId, setCategoryId] = useState(initial.categoryId ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [isFavorite, setIsFavorite] = useState(initial.isFavorite);

  // --- Adag --------------------------------------------------------------
  const [baseYieldQty, setBaseYieldQty] = useState(numToText(initial.baseYieldQty));
  const [baseYieldUnitId, setBaseYieldUnitId] = useState(initial.baseYieldUnitId);
  const [yieldNote, setYieldNote] = useState(initial.yieldNote ?? "");
  const [usualYieldQty, setUsualYieldQty] = useState(numToText(initial.usualYieldQty));
  const [usualYieldNote, setUsualYieldNote] = useState(initial.usualYieldNote ?? "");

  // --- Idők / nehézség ---------------------------------------------------
  const [prepMinutes, setPrepMinutes] = useState(numToText(initial.prepMinutes));
  const [bakeMinutes, setBakeMinutes] = useState(numToText(initial.bakeMinutes));
  const [bakeTemperatureC, setBakeTemperatureC] = useState(
    numToText(initial.bakeTemperatureC),
  );
  const [difficulty, setDifficulty] = useState(numToText(initial.difficulty));

  // --- Szövegek ----------------------------------------------------------
  const [source, setSource] = useState(initial.source ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [tagText, setTagText] = useState(initial.tagNames.join(", "));

  // --- Hozzávalók és lépések --------------------------------------------
  const [groups, setGroups] = useState<GroupDraft[]>(() =>
    toGroups(initial, keyPrefix),
  );
  const [steps, setSteps] = useState<StepDraft[]>(() =>
    initial.steps.length > 0
      ? initial.steps.map((s, i) => ({
          key: `${keyPrefix}s${i}`,
          text: s.text,
          duration: numToText(s.durationMinutes),
          temperature: numToText(s.temperatureC),
          note: s.note ?? "",
          photoFileName: s.photoFileName ?? null,
        }))
      : [emptyStep(`${keyPrefix}s0`)],
  );

  const unitsByDimension = useMemo(() => {
    const map = new Map<string, UnitOption[]>();
    for (const unit of units) {
      const list = map.get(unit.dimension);
      if (list) list.push(unit);
      else map.set(unit.dimension, [unit]);
    }
    return [...map.entries()];
  }, [units]);

  const selectedYieldUnit = units.find((u) => u.id === baseYieldUnitId);
  const isSliceBase = selectedYieldUnit?.code === "szelet";

  // --- Hozzávaló-sor műveletek ------------------------------------------
  const updateItem = (groupKey: string, itemKey: string, patch: Partial<ItemDraft>) =>
    setGroups((gs) =>
      gs.map((g) =>
        g.key !== groupKey
          ? g
          : {
              ...g,
              items: g.items.map((i) => (i.key === itemKey ? { ...i, ...patch } : i)),
            },
      ),
    );

  const addItem = (groupKey: string) =>
    setGroups((gs) =>
      gs.map((g) =>
        g.key === groupKey
          ? { ...g, items: [...g.items, emptyItem(nextKey("i"))] }
          : g,
      ),
    );

  const removeItem = (groupKey: string, itemKey: string) =>
    setGroups((gs) =>
      gs.map((g) =>
        g.key !== groupKey
          ? g
          : { ...g, items: g.items.filter((i) => i.key !== itemKey) },
      ),
    );

  const addGroup = () =>
    setGroups((gs) => [
      ...gs,
      { key: nextKey("g"), name: "", items: [emptyItem(nextKey("i"))] },
    ]);

  const removeGroup = (groupKey: string) =>
    setGroups((gs) => {
      const next = gs.filter((g) => g.key !== groupKey);
      return next.length > 0 ? next : [{ key: nextKey("g"), name: "", items: [emptyItem(nextKey("i"))] }];
    });

  // --- Lépés műveletek ---------------------------------------------------
  const updateStep = (key: string, patch: Partial<StepDraft>) =>
    setSteps((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  const moveStep = (index: number, direction: -1 | 1) =>
    setSteps((list) => {
      const target = index + direction;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });

  // --- Mentés ------------------------------------------------------------
  const buildPayload = () => ({
    id: initial.id,
    name: name.trim(),
    categoryId: categoryId || null,
    description: description.trim() || null,
    baseYieldQty: parseNum(baseYieldQty) ?? 0,
    baseYieldUnitId,
    yieldNote: yieldNote.trim() || null,
    prepMinutes: parseNum(prepMinutes),
    bakeMinutes: parseNum(bakeMinutes),
    bakeTemperatureC: parseNum(bakeTemperatureC),
    difficulty: parseNum(difficulty),
    source: source.trim() || null,
    notes: notes.trim() || null,
    isFavorite,
    usualYieldQty: parseNum(usualYieldQty),
    usualYieldNote: usualYieldNote.trim() || null,
    tagNames: tagText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    ingredients: groups.flatMap((g) =>
      g.items
        .filter((i) => i.name.trim() !== "" || i.componentRecipeId)
        .map((i) => {
          const choice = componentChoices.find((c) => c.id === i.componentRecipeId);
          const isComponent = Boolean(i.componentRecipeId);
          return {
            groupName: g.name.trim() || null,
            name: isComponent
              ? (choice?.name ?? i.name.trim())
              : i.name.trim(),
            quantity: parseNum(i.quantity),
            unitId: isComponent ? null : i.unitId || null,
            note: i.note.trim() || null,
            scalable: i.scalable,
            componentRecipeId: i.componentRecipeId || null,
          };
        })
        .filter((i) => i.name !== ""),
    ),
    steps: steps
      .filter((s) => s.text.trim() !== "")
      .map((s) => ({
        text: s.text.trim(),
        durationMinutes: parseNum(s.duration),
        temperatureC: parseNum(s.temperature),
        note: s.note.trim() || null,
        photoFileName: s.photoFileName,
      })),
  });

  const handleSubmit = () => {
    const payload = buildPayload();
    const problems: string[] = [];

    if (!payload.name) problems.push("Add meg a recept nevét.");
    if (!payload.baseYieldQty || payload.baseYieldQty <= 0) {
      problems.push("Az alapadag legyen nagyobb nullánál.");
    }
    if (!payload.baseYieldUnitId) problems.push("Válaszd ki az adag mértékegységét.");
    if (payload.ingredients.length === 0) {
      problems.push("Adj meg legalább egy hozzávalót.");
    }
    if (payload.steps.length === 0) {
      problems.push("Adj meg legalább egy elkészítési lépést.");
    }

    if (problems.length > 0) {
      setErrors(problems);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setErrors([]);
    startTransition(async () => {
      const result = await saveRecipe(payload);
      if (result.ok) {
        router.push(`/receptek/${result.slug}`);
        router.refresh();
      } else {
        setErrors(result.errors);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  const handleDelete = () => {
    if (!initial.id) return;
    const confirmed = window.confirm(
      `Biztosan törlöd a(z) „${name}” receptet? Ez nem visszavonható.`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteRecipe(initial.id!);
      if (result.ok) {
        router.push("/");
        router.refresh();
      } else {
        setErrors(result.errors);
      }
    });
  };

  return (
    <div className="pb-28">
      {/* Hibaösszegzés – mindig látható, a mentősáv fölött is megismételve */}
      {errors.length > 0 && (
        <div className="mb-5 rounded-xl border border-plum-500/25 bg-plum-500/5 p-4">
          <p className="font-display text-lg text-plum-500">
            Nem sikerült elmenteni
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-700">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* --- Alapadatok --------------------------------------------------- */}
      <section className="card p-5">
        <h2 className="font-display text-xl text-ink-900">Alapadatok</h2>
        <hr className="rule-dashed my-4" />

        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          <Field label="Recept neve" className="md:col-span-2">
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pl. Klasszikus krémes"
              autoFocus={mode === "create"}
            />
          </Field>

          <Field label="Kategória">
            <select
              className={inputClass}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">– nincs kategória –</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Címkék" hint="Vesszővel elválasztva: karácsonyi, vegán">
            <input
              className={inputClass}
              value={tagText}
              onChange={(e) => setTagText(e.target.value)}
              placeholder="ünnepi, gyors"
            />
          </Field>

          <Field label="Leírás" className="md:col-span-2">
            <textarea
              className={`${inputClass} min-h-20`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rövid jellemzés néhány mondatban"
            />
          </Field>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#4c6b44]"
            checked={isFavorite}
            onChange={(e) => setIsFavorite(e.target.checked)}
          />
          Kedvenc recept (a lista elejére kerül)
        </label>
      </section>

      {/* --- Adag --------------------------------------------------------- */}
      <section className="card mt-4 p-5">
        <h2 className="font-display text-xl text-ink-900">Alapadag</h2>
        <p className="mt-1 text-sm text-ink-400">
          Amit a recept elkészítésekor kihoz. Ebből számolunk minden mást.
        </p>
        <hr className="rule-dashed my-4" />

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Mennyiség">
            <input
              className={inputClass}
              value={baseYieldQty}
              onChange={(e) => setBaseYieldQty(e.target.value)}
              inputMode="decimal"
              placeholder="12"
            />
          </Field>

          <Field label="Mértékegység">
            <select
              className={inputClass}
              value={baseYieldUnitId}
              onChange={(e) => setBaseYieldUnitId(e.target.value)}
            >
              {unitsByDimension.map(([dimension, list]) => (
                <optgroup
                  key={dimension}
                  label={DIMENSION_LABELS[dimension] ?? dimension}
                >
                  {list.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.code} – {unit.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>

          <Field label="Pontosítás" hint="Pl. 18 cm-es forma">
            <input
              className={inputClass}
              value={yieldNote}
              onChange={(e) => setYieldNote(e.target.value)}
              placeholder="1 tepsi 30×40 cm"
            />
          </Field>
        </div>

        {isSliceBase && (
          <p className="mt-3 rounded-lg border border-forest-200 bg-forest-600/5 px-3 py-2 text-sm text-forest-700">
            Tortánál az adag a <strong>szeletszám</strong> – így a receptlapon
            szeletre tudsz kalkulálni, ahogy rendelitek.
          </p>
        )}
      </section>

      {/* --- Idők, hőfok, nehézség --------------------------------------- */}
      <section className="card mt-4 p-5">
        <h2 className="font-display text-xl text-ink-900">Idő és hőfok</h2>
        <hr className="rule-dashed my-4" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Előkészítés (perc)">
            <input
              className={inputClass}
              value={prepMinutes}
              onChange={(e) => setPrepMinutes(e.target.value)}
              inputMode="numeric"
              placeholder="40"
            />
          </Field>
          <Field label="Sütés (perc)">
            <input
              className={inputClass}
              value={bakeMinutes}
              onChange={(e) => setBakeMinutes(e.target.value)}
              inputMode="numeric"
              placeholder="18"
            />
          </Field>
          <Field label="Sütési hőfok (°C)">
            <input
              className={inputClass}
              value={bakeTemperatureC}
              onChange={(e) => setBakeTemperatureC(e.target.value)}
              inputMode="numeric"
              placeholder="180"
            />
          </Field>
          <Field label="Nehézség">
            <select
              className={inputClass}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="">– nincs megadva –</option>
              {[1, 2, 3, 4, 5].map((level) => (
                <option key={level} value={level}>
                  {level} / 5
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* --- Hozzávalók --------------------------------------------------- */}
      <section className="card mt-4 p-5">
        <h2 className="font-display text-xl text-ink-900">Hozzávalók</h2>
        <p className="mt-1 text-sm text-ink-400">
          A csoportokkal tudod szétválasztani a részeket (Tészta, Krém, Máz).
          Ha egy sor mennyiségét üresen hagyod, „ízlés szerint” lesz belőle.
        </p>
        <hr className="rule-dashed my-4" />

        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.key} className="rounded-xl border border-sage-200 p-3">
              <div className="mb-3 flex items-center gap-2">
                <input
                  className={`${inputClass} max-w-xs font-semibold`}
                  value={group.name}
                  list="group-suggestions"
                  onChange={(e) =>
                    setGroups((gs) =>
                      gs.map((g) =>
                        g.key === group.key ? { ...g, name: e.target.value } : g,
                      ),
                    )
                  }
                  placeholder="Rész neve (pl. Tészta) – üresen hagyható"
                />
                <button
                  type="button"
                  onClick={() => removeGroup(group.key)}
                  className="ml-auto text-xs font-semibold text-ink-300 hover:text-plum-500"
                >
                  csoport törlése
                </button>
              </div>

              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.key} className="flex flex-wrap items-center gap-2">
                    <input
                      className={`${inputClass} w-24`}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(group.key, item.key, { quantity: e.target.value })
                      }
                      inputMode="decimal"
                      placeholder="250"
                      aria-label="Mennyiség"
                    />
                    <select
                      className={`${inputClass} w-32`}
                      value={item.unitId}
                      onChange={(e) =>
                        updateItem(group.key, item.key, { unitId: e.target.value })
                      }
                      aria-label="Mértékegység"
                    >
                      <option value="">–</option>
                      {unitsByDimension.map(([dimension, list]) => (
                        <optgroup
                          key={dimension}
                          label={DIMENSION_LABELS[dimension] ?? dimension}
                        >
                          {list.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.code}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <input
                      className={`${inputClass} min-w-[10rem] flex-1`}
                      value={item.name}
                      onChange={(e) =>
                        updateItem(group.key, item.key, { name: e.target.value })
                      }
                      placeholder="hozzávaló neve"
                      aria-label="Hozzávaló"
                    />
                    <input
                      className={`${inputClass} min-w-[9rem] flex-1`}
                      value={item.note}
                      onChange={(e) =>
                        updateItem(group.key, item.key, { note: e.target.value })
                      }
                      placeholder="megjegyzés (átszitálva…)"
                      aria-label="Megjegyzés"
                    />

                    <label
                      className="flex items-center gap-1.5 text-xs text-ink-500"
                      title="Kikapcsolva az adagszámítás nem szorozza fel ezt a sort"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#4c6b44]"
                        checked={item.scalable}
                        onChange={(e) =>
                          updateItem(group.key, item.key, {
                            scalable: e.target.checked,
                          })
                        }
                      />
                      skálázható
                    </label>

                    <button
                      type="button"
                      onClick={() => removeItem(group.key, item.key)}
                      className="grid h-9 w-9 place-items-center rounded-lg text-ink-300 hover:bg-plum-500/10 hover:text-plum-500"
                      aria-label="Sor törlése"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addItem(group.key)}
                className="btn btn-ghost mt-3 !py-1.5 text-xs"
              >
                + hozzávaló
              </button>
            </div>
          ))}
        </div>

        <datalist id="group-suggestions">
          {groupSuggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>

        <button type="button" onClick={addGroup} className="btn btn-ghost mt-4">
          + új rész (csoport)
        </button>
      </section>

      {/* --- Lépések ------------------------------------------------------ */}
      <section className="card mt-4 p-5">
        <h2 className="font-display text-xl text-ink-900">Elkészítés</h2>
        <p className="mt-1 text-sm text-ink-400">
          Egy lépés = egy bekezdés. Az időt és a hőfokot külön mezőbe írd, mert
          a receptlapon így tudjuk kiemelni.
        </p>
        <hr className="rule-dashed my-4" />

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.key} className="flex gap-3">
              <span className="mt-2 grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-forest-600 font-display text-sm text-white">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <textarea
                  className={`${inputClass} min-h-16`}
                  value={step.text}
                  onChange={(e) => updateStep(step.key, { text: e.target.value })}
                  placeholder="Mit kell tenni ebben a lépésben?"
                />

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    className={`${inputClass} w-28`}
                    value={step.duration}
                    onChange={(e) => updateStep(step.key, { duration: e.target.value })}
                    inputMode="numeric"
                    placeholder="perc"
                    aria-label="Hány perc"
                  />
                  <input
                    className={`${inputClass} w-28`}
                    value={step.temperature}
                    onChange={(e) =>
                      updateStep(step.key, { temperature: e.target.value })
                    }
                    inputMode="numeric"
                    placeholder="°C"
                    aria-label="Hőfok"
                  />
                  <input
                    className={`${inputClass} min-w-[10rem] flex-1`}
                    value={step.note}
                    onChange={(e) => updateStep(step.key, { note: e.target.value })}
                    placeholder="tipp ehhez a lépéshez"
                    aria-label="Tipp"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => moveStep(index, -1)}
                  disabled={index === 0}
                  className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 hover:bg-sage-100 disabled:opacity-30"
                  aria-label="Feljebb"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(index, 1)}
                  disabled={index === steps.length - 1}
                  className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 hover:bg-sage-100 disabled:opacity-30"
                  aria-label="Lejjebb"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSteps((list) => list.filter((s) => s.key !== step.key))
                  }
                  className="grid h-7 w-7 place-items-center rounded-lg text-ink-300 hover:bg-plum-500/10 hover:text-plum-500"
                  aria-label="Lépés törlése"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSteps((list) => [...list, emptyStep(nextKey("s"))])}
          className="btn btn-ghost mt-4"
        >
          + lépés
        </button>
      </section>

      {/* --- Forrás, tippek ---------------------------------------------- */}
      <section className="card mt-4 p-5">
        <h2 className="font-display text-xl text-ink-900">Forrás és tippek</h2>
        <hr className="rule-dashed my-4" />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Honnan van a recept?" hint="Pl. nagymama füzete, 1978">
            <input
              className={inputClass}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="saját, 2021"
            />
          </Field>
          <Field label="Tippek, trükkök" className="md:col-span-2">
            <textarea
              className={`${inputClass} min-h-24`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ami a füzetben nincs benne, de számít…"
            />
          </Field>
        </div>
      </section>

      {/* --- Mentősáv ----------------------------------------------------- */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-sage-200 bg-sage-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-3">
          {errors.length > 0 && (
            <p className="text-sm font-semibold text-plum-500">
              {errors.length} hibát kell javítani a mentéshez.
            </p>
          )}

          <div className="ml-auto flex items-center gap-3">
            <Link href={cancelHref} className="btn btn-ghost">
              Mégse
            </Link>

            {mode === "edit" && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="text-sm font-semibold text-plum-500 hover:underline disabled:opacity-50"
              >
                Recept törlése
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="btn btn-primary disabled:opacity-60"
            >
              {isPending ? "Mentés…" : mode === "edit" ? "Módosítások mentése" : "Recept mentése"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
