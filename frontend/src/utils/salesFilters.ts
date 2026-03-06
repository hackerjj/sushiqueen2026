import type { Order } from '../types';

/**
 * Filters orders by a specific customer ID.
 * Returns only orders where `customer_id` matches the given ID.
 */
export function filterOrdersByCustomer(orders: Order[], customerId: string): Order[] {
  return orders.filter((o) => o.customer_id === customerId);
}

/**
 * Calculates the total amount for a specific customer's orders.
 * Sums the `total` field of all orders belonging to the given customer.
 */
export function calculateCustomerTotal(orders: Order[], customerId: string): number {
  return filterOrdersByCustomer(orders, customerId).reduce((sum, o) => sum + o.total, 0);
}
