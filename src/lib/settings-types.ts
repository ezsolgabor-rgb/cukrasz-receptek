// A beállítások sorainak közös típusai (kliens és szerver is használja).

export type RowValues = Record<string, string | boolean>;

export type RowData = {
  id: string | null;
  values: RowValues;
};

export type RowPayload = RowData & { removed: boolean };

export type SaveResult = {
  ok: boolean;
  errors: string[];
  /** A mentés utáni tényleges állapot – a felület ezt jeleníti meg. */
  rows: RowData[];
};
