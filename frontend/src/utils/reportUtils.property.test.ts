import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { sortProductsForReport, ReportProduct } from './reportUtils';

/**
 * **Validates: Requirement 15.4**
 *
 * Property 16: Ordenamiento de productos en reportes
 *
 * Para cualquier reporte de productos, la lista de "más vendidos" debe estar
 * ordenada por cantidad descendente, y la lista de "menos vendidos" debe estar
 * ordenada por cantidad ascendente.
 */

/** Generator for a single ReportProduct */
const reportProductArb: fc.Arbitrary<ReportProduct> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  quantity: fc.integer({ min: 0, max: 100_000 }),
  revenue: fc.double({ min: 0, max: 1_000_000, noNaN: true }),
});

/** Generator for an array of ReportProducts */
const productsArb = fc.array(reportProductArb, { minLength: 0, maxLength: 50 });

describe('Property 16: Ordenamiento de productos en reportes', () => {
  it('topProducts is sorted by quantity descending', () => {
    fc.assert(
      fc.property(productsArb, (products) => {
        const { topProducts } = sortProductsForReport(products);
        for (let i = 1; i < topProducts.length; i++) {
          expect(topProducts[i - 1].quantity).toBeGreaterThanOrEqual(topProducts[i].quantity);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('lowProducts is sorted by quantity ascending', () => {
    fc.assert(
      fc.property(productsArb, (products) => {
        const { lowProducts } = sortProductsForReport(products);
        for (let i = 1; i < lowProducts.length; i++) {
          expect(lowProducts[i - 1].quantity).toBeLessThanOrEqual(lowProducts[i].quantity);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('both lists contain the same elements as the input', () => {
    fc.assert(
      fc.property(productsArb, (products) => {
        const { topProducts, lowProducts } = sortProductsForReport(products);

        const sortByName = (a: ReportProduct, b: ReportProduct) =>
          a.name.localeCompare(b.name) || a.quantity - b.quantity || a.revenue - b.revenue;

        const inputSorted = [...products].sort(sortByName);
        const topSorted = [...topProducts].sort(sortByName);
        const lowSorted = [...lowProducts].sort(sortByName);

        expect(topSorted).toEqual(inputSorted);
        expect(lowSorted).toEqual(inputSorted);
      }),
      { numRuns: 200 },
    );
  });

  it('both lists have the same length as the input', () => {
    fc.assert(
      fc.property(productsArb, (products) => {
        const { topProducts, lowProducts } = sortProductsForReport(products);
        expect(topProducts).toHaveLength(products.length);
        expect(lowProducts).toHaveLength(products.length);
      }),
      { numRuns: 200 },
    );
  });
});
