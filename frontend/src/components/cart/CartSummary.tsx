import React from 'react';

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
        <span>${subtotal.toLocaleString('es-AR')}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>IVA (21%)</span>
        <span>${tax.toLocaleString('es-AR')}</span>
      </div>
      <div className="flex justify-between text-lg font-bold text-sushi-secondary pt-2 border-t border-gray-100">
        <span>Total</span>
        <span>${total.toLocaleString('es-AR')}</span>
      </div>
    </div>
  );
};

export default CartSummary;
