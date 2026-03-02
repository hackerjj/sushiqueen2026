import React from 'react';
import type { CartItem as CartItemType } from '../../types';
import { useCartStore } from '../../store/cartStore';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeItem } = useCartStore();
  const modifiersTotal = item.modifiers.reduce((sum, m) => sum + m.price, 0);
  const lineTotal = (item.price + modifiersTotal) * item.quantity;

  return (
    <div className="flex items-start gap-3 py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sushi-secondary text-sm truncate">{item.name}</h4>
        {item.modifiers.length > 0 && (
          <p className="text-xs text-gray-400 mt-0.5">
            {item.modifiers.map((m) => m.name).join(', ')}
          </p>
        )}
        {item.notes && (
          <p className="text-xs text-gray-400 italic mt-0.5">{item.notes}</p>
        )}
        <p className="text-sm font-semibold text-sushi-primary mt-1">
          ${lineTotal.toLocaleString('es-AR')}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 transition-colors"
          aria-label="Reducir cantidad"
        >
          −
        </button>
        <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 transition-colors"
          aria-label="Aumentar cantidad"
        >
          +
        </button>
      </div>

      <button
        onClick={() => removeItem(item.menu_item_id)}
        className="text-gray-300 hover:text-sushi-primary transition-colors p-1"
        aria-label="Eliminar item"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};

export default CartItem;
