export interface CsvImportRow {
  _id?: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  available?: boolean;
}

export interface CsvImportResult {
  created: number;
  updated: number;
  menuItems: Map<string, CsvImportRow>;
}

export function simulateCsvImport(
  rows: CsvImportRow[],
  existingItems: Map<string, CsvImportRow>,
): CsvImportResult {
  const result = new Map(existingItems);
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    if (row._id && result.has(row._id)) {
      result.set(row._id, { ...row });
      updated++;
    } else {
      const newId = row._id || `new-${Date.now()}-${Math.random()}`;
      result.set(newId, { ...row, _id: newId });
      created++;
    }
  }

  return { created, updated, menuItems: result };
}
