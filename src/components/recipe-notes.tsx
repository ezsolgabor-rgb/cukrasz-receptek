"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addRecipeNote, deleteRecipeNote } from "@/app/receptek/note-actions";
import type { RecipeNoteData } from "@/lib/recipe-detail";

const KINDS: { value: string; label: string; className: string }[] = [
  { value: "tapasztalat", label: "Tapasztalat", className: "border-sage-300 bg-white text-ink-700" },
  { value: "sikerult", label: "Sikerült", className: "border-forest-300 bg-forest-600/10 text-forest-700" },
  { value: "felresikerult", label: "Nem sikerült", className: "border-plum-500/30 bg-plum-500/5 text-plum-500" },
  { value: "otlet", label: "Ötlet", className: "border-caramel-300 bg-caramel-200/40 text-ink-900" },
];

function kindOf(value: string) {
  return KINDS.find((kind) => kind.value === value) ?? KINDS[0];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Próbák naplója: dátumozott bejegyzések arról, mi hogy sikerült.
 * Így a tapasztalat nem vész el a következő sütésig.
 */
export function RecipeNotes({
  recipeId,
  notes,
}: {
  recipeId: string;
  notes: RecipeNoteData[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [kind, setKind] = useState("tapasztalat");
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!text.trim()) {
      setErrors(["Írj valamit a bejegyzésbe."]);
      return;
    }
    setErrors([]);
    startTransition(async () => {
      const result = await addRecipeNote(recipeId, text, kind);
      if (result.ok) {
        setText("");
        router.refresh();
      } else {
        setErrors(result.errors);
      }
    });
  };

  const remove = (noteId: string) => {
    if (!window.confirm("Törlöd ezt a bejegyzést?")) return;
    startTransition(async () => {
      await deleteRecipeNote(noteId);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-sage-200 bg-white p-4 print:hidden">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Pl. „3. alkalom: 2 lappal kevesebb zselatin, így szépen szeletelhető.”"
          className="min-h-20 w-full rounded-lg border border-sage-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-ink-300 focus:border-forest-400"
        />

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            className="rounded-lg border border-sage-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-forest-400"
            aria-label="Bejegyzés fajtája"
          >
            {KINDS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="btn btn-primary !py-1.5 text-sm disabled:opacity-60"
          >
            {isPending ? "Mentés…" : "Bejegyzés hozzáadása"}
          </button>

          {errors.length > 0 && (
            <p className="text-sm text-plum-500">{errors.join(" ")}</p>
          )}
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-sage-300 p-6 text-center text-sm text-ink-400">
          Még nincs bejegyzés. Ide írhatod, hogyan sikerült a legutóbbi sütés, mit
          változtattál, min kell még igazítani.
        </p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => {
            const kindInfo = kindOf(note.kind);
            return (
              <li key={note.id} className="card p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`chip border ${kindInfo.className}`}>
                    {kindInfo.label}
                  </span>
                  <span className="text-xs text-ink-400">
                    {formatDate(note.noteDate)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(note.id)}
                    disabled={isPending}
                    className="ml-auto text-xs font-semibold text-ink-300 hover:text-plum-500 disabled:opacity-50 print:hidden"
                  >
                    törlés
                  </button>
                </div>
                <p className="prose-recipe mt-2 text-ink-700">{note.text}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
