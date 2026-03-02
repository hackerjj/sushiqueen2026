import React from 'react';
import { formatMXN } from '../../utils/format';

interface CartSummaryProps {
  subtotal: number;
  tax: number;
  total: number;
}

const CartSummary: React.FC<CartSummaryProps> = ({ subtotal, tax, total }) => {
  return (
    <div className="border-t border-gray-200 pt-4 space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Subtotal</span>
        <span>{formatMXN(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>IVA (16%)</span>
        <span>{formatMXN(tax)}</span>
      </div>
      <div className="flex justify-between text-lg font-bold text-sushi-secondary pt-2 border-t border-gray-100">
        <span>Total</span>
        <span>{formatMXN(total)}</span>
      </div>
    </div>
  );
};

export default CartSummary;
