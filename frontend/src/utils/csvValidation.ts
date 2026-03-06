export interface CsvRowValidation {
  valid: boolean;
  data?: { name: string; price: number; description?: string; category?: string; available?: boolean };
  error?: string;
}

export function validateCsvRow(row: Record<string, string>, rowNumber: number): CsvRowValidation {
  if (!row.name || row.name.trim() === '') {
    return { valid: false, error: `Row ${rowNumber}: missing name` };
  }
  const price = parseFloat(row.price);
  if (isNaN(price) || price <= 0) {
    return { valid: false, error: `Row ${rowNumber}: invalid price` };
  }
  return {
    valid: true,
    data: {
      name: row.name.trim(),
      price,
      description: row.description || '',
      category: row.category || 'General',
      available: row.available !== '0',
    },
  };
}

export function validateCsvRows(rows: Record<string, string>[]): { validRows: CsvRowValidation[]; errors: string[] } {
  const validRows: CsvRowValidation[] = [];
  const errors: string[] = [];
  rows.forEach((row, index) => {
    const result = validateCsvRow(row, index + 2); // +2 because row 1 is headers
    if (result.valid) validRows.push(result);
    else errors.push(result.error!);
  });
  return { validRows, errors };
}
