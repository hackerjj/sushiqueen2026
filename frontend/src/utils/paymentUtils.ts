/**
 * Payment utility functions for POS
 */

export interface PaymentDetails {
  method: 'credit_card' | 'debit_card' | 'cash';
  cash_received?: number;
  change_amount?: number;
  no_change?: boolean;
  borrowed_amount?: number;
  borrowed_from?: string;
}

/**
 * Calculates cash payment details including change.
 *
 * Preconditions: total > 0, cashReceived >= 0
 * Postconditions: change_amount >= 0; if noChange is false then borrowed_* fields are undefined
 *
 * @param total - Order total amount
 * @param cashReceived - Amount of cash received from customer
 * @param noChange - Whether the cashier has no change to give
 * @param borrowedAmount - Amount borrowed (only relevant when noChange is true)
 * @param borrowedFrom - Person who lent the money (only relevant when noChange is true)
 */
export function calculateCashPayment(
  total: number,
  cashReceived: number,
  noChange: boolean,
  borrowedAmount?: number,
  borrowedFrom?: string,
): PaymentDetails {
  return {
    method: 'cash',
    cash_received: cashReceived,
    change_amount: Math.max(0, cashReceived - total),
    no_change: noChange,
    borrowed_amount: noChange ? borrowedAmount : undefined,
    borrowed_from: noChange ? borrowedFrom : undefined,
  };
}
