import type { Order, OrderStatus } from '../types';

/** Statuses visible in the Kitchen Display System */
const KDS_VISIBLE_STATUSES: OrderStatus[] = ['confirmed', 'preparing'];

/**
 * Filters and sorts orders for the Kitchen Display System (KDS).
 * - Returns only orders with status "confirmed" or "preparing"
 * - Sorts by `created_at` ascending (oldest first)
 */
export function filterKitchenOrders(orders: Order[]): Order[] {
  return orders
    .filter((order) => KDS_VISIBLE_STATUSES.includes(order.status))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}
