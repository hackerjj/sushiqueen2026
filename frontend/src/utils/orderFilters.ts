import type { Order } from '../types';

/**
 * Filters out orders with status 'cancelled' from an array of orders.
 * Used to ensure cancelled orders are excluded from sales calculations
 * in dashboard and revenue modules.
 */
export function filterNonCancelledOrders(orders: Order[]): Order[] {
  return orders.filter((order) => order.status !== 'cancelled');
}

/**
 * Calculates the total sales amount from non-cancelled orders.
 * Sums the `total` field of all orders that are not cancelled.
 */
export function calculateSalesTotal(orders: Order[]): number {
  return filterNonCancelledOrders(orders).reduce(
    (sum, order) => sum + order.total,
    0,
  );
}
