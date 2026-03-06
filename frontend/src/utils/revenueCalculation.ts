import type { Order, Expense } from '../types';

/**
 * Calculate revenue from pre-computed totals.
 * revenue = total_sales - total_expenses
 */
export function calculateRevenue(totalSales: number, totalExpenses: number): number {
  return totalSales - totalExpenses;
}

/**
 * Calculate revenue from raw order and expense data.
 * Excludes cancelled orders from the sales total.
 */
export function calculateRevenueFromData(
  orders: Order[],
  expenses: Expense[],
): {
  total_sales: number;
  total_expenses: number;
  revenue: number;
} {
  const total_sales = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  const total_expenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  return {
    total_sales,
    total_expenses,
    revenue: total_sales - total_expenses,
  };
}

export interface DailyEntry {
  date: string;
  sales: number;
  expenses: number;
}

export interface DailyBreakdownResult {
  breakdown: { date: string; sales: number; expenses: number; revenue: number }[];
  totalRevenue: number;
}

/**
 * Calculate daily breakdown of revenue from an array of daily entries.
 * Each day's revenue = sales - expenses.
 * totalRevenue = sum of all daily revenues.
 */
export function calculateDailyBreakdown(entries: DailyEntry[]): DailyBreakdownResult {
  const breakdown = entries.map((entry) => ({
    date: entry.date,
    sales: entry.sales,
    expenses: entry.expenses,
    revenue: entry.sales - entry.expenses,
  }));

  const totalRevenue = breakdown.reduce((sum, day) => sum + day.revenue, 0);

  return { breakdown, totalRevenue };
}

