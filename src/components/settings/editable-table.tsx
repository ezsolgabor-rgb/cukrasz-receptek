"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

export type ColumnType = "text" | "number" | "select" | "color" | "checkbox";

export type ColumnDef = {
  key: string;
  label: string;
  type: ColumnType;
  /** Fix szélesség (pl. „5rem”); ha nincs, a mező kitölti a helyet. */
  width?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Csak megjelenítés, nem szerkeszthető (pl. beállítás neve). */
  readOnly?: boolean;
};

export type RowValues = Record<string, string | boolean>;

export type RowData = { id: string | null; values: RowValues };

export type TableSaveResult = {
  ok: boolean;
  errors: string[];
  rows: RowData[];
};

type TableRow = RowData & { key: string; removed: boolean };

function toTableRows(data: RowData[]): TableRow[] {
  return data.map((row, index) => ({
    id: row.id,
    values: row.values,
    key: row.id ?? `sor-${index}`,
    removed: false,
  }));
}

const inputClass =
  "w-full rounded-lg border border-sage-300 bg-white px-2.5 py-1.5 text-sm text-ink-900 outline-none transition-colors focus:border-forest-400 disabled:bg-sage-100";

/**
 * Szerkeszthető lista a beállításokhoz.
 * A mentés a teljes listát egyszerre küldi el, és a szerver visszaadja a
 * tényleges állapotot – abból dolgozunk tovább, így nem duplázódnak a sorok.
 */
export function EditableTable({
  columns,
  initialRows,
  blankRow,
  onSave,
  canAdd = true,
  canRemove = true,
  addLabel = "+ új sor",
  hint,
  deleteHint,
}: {
  columns: ColumnDef[];
  initialRows: RowData[];
  blankRow: RowValues;
  onSave: (rows: { id: string | null; removed: boolean; values: RowValues }[]) => Promise<TableSaveResult>;
  canAdd?: boolean;
  canRemove?: boolean;
  addLabel?: string;
  hint?: string;
  deleteHint?: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<TableRow[]>(() => toTableRows(initialRows));
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const counter = useRef(0);

  const updateValue = (key: string, field: string, value: string | boolean) =>
    setRows((list) =>
      list.map((row) =>
        row.key === key ? { ...row, values: { ...row.values, [field]: value } } : row,
      ),
    );

  const addRow = () =>
    setRows((list) => [
      ...list,
      { id: null, values: { ...blankRow }, key: `uj-${counter.current++}`, removed: false },
    ]);

  const toggleRemove = (key: string) =>
    setRows((list) =>
      list.map((row) =>
        row.key === key ? { ...row, removed: !row.removed } : row,
      ),
    );

  const dropRow = (key: string) =>
    setRows((list) => list.filter((row) => row.key !== key));

  const save = () => {
    setSaved(false);
    startTransition(async () => {
      const result = await onSave(
        rows.map((row) => ({ id: row.id, removed: row.removed, values: row.values })),
      );
      setErrors(result.errors);
      setRows(toTableRows(result.rows));
      if (result.ok) {
        setSaved(true);
        router.refresh();
      }
    });
  };

  return (
    <div>
      {errors.length > 0 && (
        <div className="mb-4 rounded-xl border border-plum-500/25 bg-plum-500/5 p-4">
          <p className="font-display text-lg text-plum-500">Nem sikerült mindent elmenteni</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-700">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {hint && <p className="mb-3 text-sm text-ink-400">{hint}</p>}

      <div className="space-y-2">
        {rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-sage-300 p-6 text-center text-sm text-ink-400">
            Nincs egyetlen sor sem.
          </p>
        )}

        {rows.map((row) => (
          <div
            key={row.key}
            className="flex flex-wrap items-end gap-2 rounded-xl border border-sage-200 bg-white p-2.5"
            style={{ opacity: row.removed ? 0.45 : 1 }}
          >
            {columns.map((column) => {
              const cell =
                column.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    className="mt-1.5 h-4 w-4 accent-[#4c6b44]"
                    checked={row.values[column.key] === true || row.values[column.key] === "true"}
                    onChange={(event) =>
                      updateValue(row.key, column.key, event.target.checked)
                    }
                    aria-label={column.label}
                  />
                ) : column.type === "select" ? (
                  <select
                    className={inputClass}
                    value={String(row.values[column.key] ?? "")}
                    onChange={(event) =>
                      updateValue(row.key, column.key, event.target.value)
                    }
                    aria-label={column.label}
                  >
                    {(column.options ?? []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : column.type === "color" ? (
                  <input
                    type="color"
                    className="h-8 w-full cursor-pointer rounded-lg border border-sage-300 bg-white"
                    value={String(row.values[column.key] ?? "#7a8570")}
                    onChange={(event) =>
                      updateValue(row.key, column.key, event.target.value)
                    }
                    aria-label={column.label}
                  />
                ) : column.readOnly ? (
                  <p className="px-1 py-1.5 text-sm text-ink-500">
                    {String(row.values[column.key] ?? "")}
                  </p>
                ) : (
                  <input
                    className={inputClass}
                    type="text"
                    inputMode={column.type === "number" ? "decimal" : undefined}
                    value={String(row.values[column.key] ?? "")}
                    placeholder={column.placeholder}
                    onChange={(event) =>
                      updateValue(row.key, column.key, event.target.value)
                    }
                    aria-label={column.label}
                  />
                );

              return (
                <label
                  key={column.key}
                  className={
                    column.type === "checkbox"
                      ? "w-auto"
                      : column.readOnly
                        ? "min-w-[8rem] flex-1"
                        : "min-w-[7rem] flex-1"
                  }
                  style={column.width ? { width: column.width, flex: "0 0 auto" } : undefined}
                >
                  <span className="mb-0.5 block text-[0.6rem] font-semibold uppercase tracking-wider text-ink-300">
                    {column.label}
                  </span>
                  {cell}
                </label>
              );
            })}

            {canRemove && (
              <button
                type="button"
                onClick={() =>
                  row.id === null ? dropRow(row.key) : toggleRemove(row.key)
                }
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                  row.removed
                    ? "text-forest-600 hover:bg-forest-600/10"
                    : "text-plum-500 hover:bg-plum-500/10"
                }`}
                title={row.removed ? "Törlés visszavonása" : "Sor törlése"}
              >
                {row.removed ? "vissza" : "törlés"}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {canAdd && (
          <button type="button" onClick={addRow} className="btn btn-ghost">
            {addLabel}
          </button>
        )}

        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="btn btn-primary disabled:opacity-60"
        >
          {isPending ? "Mentés…" : "Mentés"}
        </button>

        {saved && <span className="text-sm font-semibold text-forest-600">Elmentve ✓</span>}
      </div>

      {deleteHint && <p className="mt-3 text-xs text-ink-400">{deleteHint}</p>}
    </div>
  );
}
