import { describe, it, expect } from 'vitest';
import { calculateCashPayment } from './paymentUtils';

describe('calculateCashPayment', () => {
  it('calculates correct change when customer overpays', () => {
    const result = calculateCashPayment(100, 150, false);
    expect(result.method).toBe('cash');
    expect(result.cash_received).toBe(150);
    expect(result.change_amount).toBe(50);
    expect(result.no_change).toBe(false);
    expect(result.borrowed_amount).toBeUndefined();
    expect(result.borrowed_from).toBeUndefined();
  });

  it('returns zero change when customer pays exact amount', () => {
    const result = calculateCashPayment(200, 200, false);
    expect(result.change_amount).toBe(0);
  });

  it('returns zero change when customer underpays', () => {
    const result = calculateCashPayment(300, 100, false);
    expect(result.change_amount).toBe(0);
  });

  it('includes borrowed fields when noChange is true', () => {
    const result = calculateCashPayment(250, 300, true, 50, 'Juan');
    expect(result.no_change).toBe(true);
    expect(result.borrowed_amount).toBe(50);
    expect(result.borrowed_from).toBe('Juan');
    expect(result.change_amount).toBe(50);
  });

  it('omits borrowed fields when noChange is false even if provided', () => {
    const result = calculateCashPayment(100, 200, false, 50, 'Maria');
    expect(result.borrowed_amount).toBeUndefined();
    expect(result.borrowed_from).toBeUndefined();
  });

  it('handles zero cashReceived', () => {
    const result = calculateCashPayment(100, 0, false);
    expect(result.cash_received).toBe(0);
    expect(result.change_amount).toBe(0);
  });
});
