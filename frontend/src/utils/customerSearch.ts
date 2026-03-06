import type { Customer } from '../types';

/**
 * Searches customers by partial match on name or phone.
 * @param customers - Array of customers to search through
 * @param term - Search term to match against name or phone
 * @returns Customers whose name or phone partially matches the search term (case-insensitive for name)
 */
export function searchCustomers(customers: Customer[], term: string): Customer[] {
  if (!term || term.length < 1) return [];
  const lowerTerm = term.toLowerCase();
  return customers.filter(
    (c) => c.name.toLowerCase().includes(lowerTerm) || c.phone.includes(term)
  );
}
