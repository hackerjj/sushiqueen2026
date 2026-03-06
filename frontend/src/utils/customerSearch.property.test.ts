import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { searchCustomers } from './customerSearch';
import type { Customer } from '../types';

/**
 * **Validates: Requirement 7.2**
 *
 * Property 10: Búsqueda parcial de clientes
 *
 * Para cualquier término de búsqueda y base de datos de clientes, todos los
 * resultados retornados deben coincidir parcialmente con el término por nombre
 * o teléfono.
 */

/** Generator for a valid Customer object */
const customerArb = fc.record({
  _id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  phone: fc.stringMatching(/^[0-9]{7,15}$/),
  email: fc.emailAddress(),
  address: fc.string({ minLength: 0, maxLength: 100 }),
  source: fc.constantFrom('web' as const, 'whatsapp' as const, 'facebook' as const),
  tier: fc.constantFrom('new' as const, 'regular' as const, 'gold' as const, 'vip' as const),
  total_orders: fc.nat({ max: 1000 }),
  total_spent: fc.double({ min: 0, max: 100000, noNaN: true }),
  preferences: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
  ai_profile: fc.record({
    favorite_items: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
    order_frequency: fc.string({ minLength: 1, maxLength: 20 }),
    avg_order_value: fc.double({ min: 0, max: 10000, noNaN: true }),
    last_recommendations: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
  }),
  created_at: fc.integer({ min: 1577836800000, max: 1893456000000 }).map((ts) => new Date(ts).toISOString()),
}) as fc.Arbitrary<Customer>;

/** Generator for a non-empty search term */
const searchTermArb = fc.string({ minLength: 1, maxLength: 20 });

describe('Property: Búsqueda parcial de clientes', () => {
  it('every result matches partially by name or phone', () => {
    fc.assert(
      fc.property(
        fc.array(customerArb, { minLength: 0, maxLength: 20 }),
        searchTermArb,
        (customers, term) => {
          const results = searchCustomers(customers, term);
          const lowerTerm = term.toLowerCase();
          for (const customer of results) {
            const nameMatch = customer.name.toLowerCase().includes(lowerTerm);
            const phoneMatch = customer.phone.includes(term);
            expect(nameMatch || phoneMatch).toBe(true);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('results are always a subset of the input customers', () => {
    fc.assert(
      fc.property(
        fc.array(customerArb, { minLength: 0, maxLength: 20 }),
        searchTermArb,
        (customers, term) => {
          const results = searchCustomers(customers, term);
          expect(results.length).toBeLessThanOrEqual(customers.length);
          for (const result of results) {
            expect(customers).toContain(result);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('empty search term returns empty results', () => {
    fc.assert(
      fc.property(
        fc.array(customerArb, { minLength: 0, maxLength: 20 }),
        (customers) => {
          expect(searchCustomers(customers, '')).toEqual([]);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('if a customer name contains the search term, they appear in results', () => {
    fc.assert(
      fc.property(
        fc.array(customerArb, { minLength: 1, maxLength: 20 }),
        (customers) => {
          // Pick a random customer and extract a substring from their name as the search term
          const target = customers[0];
          if (target.name.length === 0) return; // skip if name is empty
          const start = 0;
          const end = Math.max(1, Math.ceil(target.name.length / 2));
          const term = target.name.slice(start, end);
          if (term.length === 0) return;

          const results = searchCustomers(customers, term);
          const found = results.some((c) => c._id === target._id);
          expect(found).toBe(true);
        },
      ),
      { numRuns: 200 },
    );
  });
});
