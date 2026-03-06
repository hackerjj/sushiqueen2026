import type { Expense, ExpenseCategory } from '../types';

export function summarizeExpensesByCategory(
  expenses: Expense[]
): Record<ExpenseCategory, number> {
  const summary: Record<string, number> = {
    ingredientes: 0,
    servicios: 0,
    personal: 0,
    alquiler: 0,
    marketing: 0,
    otros: 0,
  };
  for (const expense of expenses) {
    if (summary[expense.category] !== undefined) {
      summary[expense.category] += expense.amount;
    }
  }
  return summary as Record<ExpenseCategory, number>;
}
