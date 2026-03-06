import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateCsvRows } from './csvValidation';
import { CsvImportRow, simulateCsvImport } from './csvImportSimulator';

/**
 * **Validates: Requirements 10.6**
 *
 * Property 14: Conteo de operaciones en importación CSV
 *
 * Para cualquier importación CSV, la suma de `created + updated + errors.length`
 * debe ser igual al número total de filas de datos en el CSV (excluyendo la fila de headers).
 */

/** Generator for a valid CSV row (non-empty name, numeric price > 0) */
const validCsvRowArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  price: fc.double({ min: 0.01, max: 100000, noNaN: true }).map(String),
  description: fc.string({ minLength: 0, maxLength: 100 }),
  category: fc.constantFrom('Rolls', 'Sushi', 'Drinks', 'Desserts', 'General'),
  available: fc.constantFrom('0', '1'),
});

/** Generator for an invalid CSV row (missing name or bad price) */
const invalidCsvRowArb = fc.oneof(
  fc.record({
    name: fc.constant(''),
    price: fc.double({ min: 0.01, max: 100000, noNaN: true }).map(String),
    description: fc.string({ minLength: 0, maxLength: 100 }),
    category: fc.constant('General'),
    available: fc.constant('1'),
  }),
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
    price: fc.constantFrom('abc', '', 'NaN', '0', '-5'),
    description: fc.string({ minLength: 0, maxLength: 100 }),
    category: fc.constant('General'),
    available: fc.constant('1'),
  }),
);

/** Generator for a valid import row with _id (for updates) */
const importRowWithIdArb = fc.record({
  _id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  price: fc.double({ min: 0.01, max: 100000, noNaN: true }),
  description: fc.string({ minLength: 0, maxLength: 100 }),
  category: fc.constantFrom('Rolls', 'Sushi', 'Drinks', 'Desserts', 'General'),
  available: fc.boolean(),
});

/** Generator for a valid import row without _id (for creates) */
const importRowWithoutIdArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  price: fc.double({ min: 0.01, max: 100000, noNaN: true }),
  description: fc.string({ minLength: 0, maxLength: 100 }),
  category: fc.constantFrom('Rolls', 'Sushi', 'Drinks', 'Desserts', 'General'),
  available: fc.boolean(),
});

/** Build existing items map from array */
function buildExistingMap(items: CsvImportRow[]): Map<string, CsvImportRow> {
  const map = new Map<string, CsvImportRow>();
  for (const item of items) {
    if (item._id) map.set(item._id, item);
  }
  return map;
}

describe('Property 14: Conteo de operaciones en importación CSV', () => {
  it('validateCsvRows: validRows.length + errors.length === total rows', () => {
    const mixedRowArb = fc.oneof(validCsvRowArb, invalidCsvRowArb);
    fc.assert(
      fc.property(fc.array(mixedRowArb, { minLength: 0, maxLength: 30 }), (rows) => {
        const { validRows, errors } = validateCsvRows(rows);
        expect(validRows.length + errors.length).toBe(rows.length);
      }),
      { numRuns: 200 },
    );
  });

  it('simulateCsvImport: created + updated === rows.length for any valid import rows', () => {
    fc.assert(
      fc.property(
        fc.array(importRowWithIdArb, { minLength: 0, maxLength: 10 }),
        fc.array(
          fc.oneof(importRowWithIdArb, importRowWithoutIdArb as fc.Arbitrary<CsvImportRow>),
          { minLength: 0, maxLength: 20 },
        ),
        (existingItems, importRows) => {
          const existing = buildExistingMap(existingItems);
          const result = simulateCsvImport(importRows, existing);
          expect(result.created + result.updated).toBe(importRows.length);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('combined pipeline: created + updated + validation_errors === total CSV rows', () => {
    const mixedCsvRowArb = fc.oneof(validCsvRowArb, invalidCsvRowArb);
    fc.assert(
      fc.property(
        fc.array(importRowWithIdArb, { minLength: 0, maxLength: 10 }),
        fc.array(mixedCsvRowArb, { minLength: 0, maxLength: 20 }),
        (existingItems, csvRows) => {
          // Step 1: Validate CSV rows
          const { validRows, errors } = validateCsvRows(csvRows);

          // Step 2: Convert valid rows to import rows
          const importRows: CsvImportRow[] = validRows.map((vr) => ({
            name: vr.data!.name,
            price: vr.data!.price,
            description: vr.data!.description,
            category: vr.data!.category,
            available: vr.data!.available,
          }));

          // Step 3: Simulate import
          const existing = buildExistingMap(existingItems);
          const result = simulateCsvImport(importRows, existing);

          // Property: created + updated + validation_errors === total CSV rows
          expect(result.created + result.updated + errors.length).toBe(csvRows.length);
        },
      ),
      { numRuns: 200 },
    );
  });
});
