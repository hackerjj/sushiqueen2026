import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateCsvRow, validateCsvRows } from './csvValidation';

/**
 * **Validates: Requirements 10.2, 10.3**
 *
 * Property 12: Validación de filas CSV en importación
 *
 * Para cualquier archivo CSV importado, las filas sin campo "name" o con "price"
 * no numérico deben ser rechazadas con un error que incluya el número de línea,
 * mientras las filas válidas se procesan correctamente.
 */

/** Generator for a valid CSV row (non-empty name, numeric price > 0) */
const validRowArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  price: fc.double({ min: 0.01, max: 100000, noNaN: true }).map(String),
  description: fc.string({ minLength: 0, maxLength: 100 }),
  category: fc.constantFrom('Rolls', 'Sushi', 'Drinks', 'Desserts', 'General'),
  available: fc.constantFrom('0', '1'),
});

/** Generator for a row missing the name field */
const missingNameRowArb = fc.oneof(
  fc.record({
    price: fc.double({ min: 0.01, max: 100000, noNaN: true }).map(String),
    description: fc.string({ minLength: 0, maxLength: 100 }),
  }).map((r) => ({ ...r, name: '' })),
  fc.record({
    price: fc.double({ min: 0.01, max: 100000, noNaN: true }).map(String),
    description: fc.string({ minLength: 0, maxLength: 100 }),
  }).map((r) => ({ ...r, name: '   ' })),
);

/** Generator for a row with non-numeric price */
const invalidPriceRowArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  price: fc.constantFrom('abc', '', 'NaN', 'not-a-number', '$10', '0', '-5', '-0.01'),
  description: fc.string({ minLength: 0, maxLength: 100 }),
});

/** Generator for a positive row number */
const rowNumberArb = fc.integer({ min: 1, max: 10000 });

describe('Property: Validación de filas CSV en importación', () => {
  it('rows without name are always rejected with error mentioning the row number', () => {
    fc.assert(
      fc.property(missingNameRowArb, rowNumberArb, (row, rowNum) => {
        const result = validateCsvRow(row, rowNum);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error).toContain(`Row ${rowNum}`);
        expect(result.data).toBeUndefined();
      }),
      { numRuns: 200 },
    );
  });

  it('rows with non-numeric or non-positive price are always rejected', () => {
    fc.assert(
      fc.property(invalidPriceRowArb, rowNumberArb, (row, rowNum) => {
        const result = validateCsvRow(row, rowNum);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error).toContain(`Row ${rowNum}`);
        expect(result.data).toBeUndefined();
      }),
      { numRuns: 200 },
    );
  });

  it('rows with valid name and numeric price > 0 are always accepted', () => {
    fc.assert(
      fc.property(validRowArb, rowNumberArb, (row, rowNum) => {
        const result = validateCsvRow(row, rowNum);
        expect(result.valid).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.name).toBe(row.name.trim());
        expect(result.data!.price).toBe(parseFloat(row.price));
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 200 },
    );
  });

  it('error messages always include the row number', () => {
    fc.assert(
      fc.property(
        fc.oneof(missingNameRowArb, invalidPriceRowArb),
        rowNumberArb,
        (row, rowNum) => {
          const result = validateCsvRow(row, rowNum);
          expect(result.valid).toBe(false);
          expect(result.error).toMatch(new RegExp(`Row ${rowNum}`));
        },
      ),
      { numRuns: 200 },
    );
  });

  it('validRows.length + errors.length always equals total rows', () => {
    const mixedRowArb = fc.oneof(validRowArb, missingNameRowArb, invalidPriceRowArb);
    fc.assert(
      fc.property(fc.array(mixedRowArb, { minLength: 0, maxLength: 30 }), (rows) => {
        const { validRows, errors } = validateCsvRows(rows);
        expect(validRows.length + errors.length).toBe(rows.length);
      }),
      { numRuns: 200 },
    );
  });
});
