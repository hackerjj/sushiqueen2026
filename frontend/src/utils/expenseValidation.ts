import type { ExpenseCategory } from '../types';

const VALID_CATEGORIES: ExpenseCategory[] = ['ingredientes', 'servicios', 'personal', 'alquiler', 'marketing', 'otros'];

export interface ExpenseInput {
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface ExpenseValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateExpense(input: ExpenseInput): ExpenseValidationResult {
  const errors: string[] = [];

  if (!input.description || input.description.length > 255) {
    errors.push('description must be 1-255 characters');
  }

  if (typeof input.amount !== 'number' || isNaN(input.amount) || input.amount <= 0) {
    errors.push('amount must be numeric and > 0');
  }

  if (!VALID_CATEGORIES.includes(input.category as ExpenseCategory)) {
    errors.push('category must be one of: ingredientes, servicios, personal, alquiler, marketing, otros');
  }

  if (!input.date || isNaN(Date.parse(input.date))) {
    errors.push('date must be a valid ISO date');
  }

  return { valid: errors.length === 0, errors };
}
