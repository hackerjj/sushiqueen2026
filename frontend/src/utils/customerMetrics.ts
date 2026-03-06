import type { Order } from '../types';

/**
 * Compute customer metrics (total orders and total spent) from a list of orders.
 *
 * @param customerId The customer ID to compute metrics for
 * @param orders Array of orders to filter and aggregate
 * @returns Object with total_orders and total_spent
 */
export function computeCustomerMetrics(
  customerId: string,
  orders: Order[]
): { total_orders: number; total_spent: number } {
  const customerOrders = orders.filter(o => o.customer_id === customerId);
  return {
    total_orders: customerOrders.length,
    total_spent: customerOrders.reduce((sum, o) => sum + o.total, 0),
  };
}

/**
 * Compute the predominant order type for a customer based on their order history.
 * Maps order types/sources to: local, delivery, app.
 *   - type 'delivery' → delivery
 *   - source web/whatsapp/facebook (non-pos) → app
 *   - everything else (dine_in, takeout, counter, express) → local
 *
 * @param orders Array of objects with type and source fields
 * @returns 'local' | 'delivery' | 'app' | null
 */
export function computePredominantOrderType(
  orders: Array<{ type?: string; source?: string }>
): 'local' | 'delivery' | 'app' | null {
  if (!orders || orders.length === 0) return null;

  const counts: Record<string, number> = { local: 0, delivery: 0, app: 0 };

  for (const order of orders) {
    if (order.type === 'delivery') {
      counts.delivery++;
    } else if (
      order.source &&
      ['web', 'whatsapp', 'facebook'].includes(order.source)
    ) {
      counts.app++;
    } else {
      counts.local++;
    }
  }

  const total = counts.local + counts.delivery + counts.app;
  if (total === 0) return null;

  // Return the type with the highest count
  if (counts.delivery >= counts.local && counts.delivery >= counts.app) return 'delivery';
  if (counts.app >= counts.local && counts.app >= counts.delivery) return 'app';
  return 'local';
}
