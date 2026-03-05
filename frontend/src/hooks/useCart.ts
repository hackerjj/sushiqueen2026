import { useCartStore } from '../store/cartStore';
import { trackAddToCart } from '../services/analytics';
import type { MenuItem } from '../types';

export function useCart() {
  const { items, addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount } =
    useCartStore();

  const addMenuItem = (menuItem: MenuItem, quantity = 1) => {
    const cartItem = {
      menu_item_id: menuItem._id,
      name: menuItem.name,
      quantity,
      price: menuItem.price,
      modifiers: [],
    };
    addItem(cartItem);
    trackAddToCart(cartItem);
  };

  const subtotal = getTotal();
  const tax = 0;  // IVA already included in prices
  const total = subtotal;
  const itemCount = getItemCount();

  return {
    items,
    addItem,
    addMenuItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    tax,
    total,
    itemCount,
  };
}
