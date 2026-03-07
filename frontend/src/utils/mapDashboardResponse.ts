import type { DashboardKPIs } from '../types';

/**
 * Maps the backend dashboard response to the DashboardKPIs type.
 * Handles null fields, missing fields, and legacy response formats.
 */
export function mapDashboardResponse(raw: any): DashboardKPIs {
  return {
    sales_today: raw?.sales_today ?? raw?.today?.revenue ?? 0,
    sales_week: raw?.sales_week ?? raw?.week?.revenue ?? 0,
    sales_month: raw?.sales_month ?? raw?.month?.revenue ?? 0,
    orders_today: raw?.orders_today ?? raw?.today?.orders ?? 0,
    orders_week: raw?.orders_week ?? raw?.week?.orders ?? 0,
    new_customers_week: raw?.new_customers_week ?? raw?.total_customers ?? 0,
    top_items: (Array.isArray(raw?.top_items) ? raw.top_items : []).map((i: any) => ({
      name: i.name || i._id || '',
      count: i.count || i.quantity || 0,
    })),
    top_items_note: raw?.top_items_note ?? null,
    fudo_revenue: raw?.fudo_revenue ?? { total: 0, count: 0 },
    last_day_label: raw?.last_day_label ?? null,
    sales_by_category: Array.isArray(raw?.sales_by_category) ? raw.sales_by_category : [],
  };
}
