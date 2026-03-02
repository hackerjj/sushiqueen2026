import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import OrderForm from '../components/order/OrderForm';
import OrderConfirmation from '../components/order/OrderConfirmation';
import CartSummary from '../components/cart/CartSummary';
import CartItemComponent from '../components/cart/CartItem';
import { useCart } from '../hooks/useCart';
import { useOrders } from '../hooks/useOrders';
import { trackInitiateCheckout, trackLead, trackPurchase } from '../services/analytics';
import type { Order as OrderType } from '../types';

const Order: React.FC = () => {
  const { items, subtotal, tax, total, clearCart } = useCart();
  const { loading, error, createOrder } = useOrders();
  const [confirmedOrder, setConfirmedOrder] = useState<OrderType | null>(null);

  // Track InitiateCheckout when user lands on order page with items
  useEffect(() => {
    if (items.length > 0) {
      trackInitiateCheckout(items, total);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (info: { name: string; phone: string; email: string; address: string; notes: string }) => {
    // Track Lead when customer submits order form
    trackLead(total);

    const result = await createOrder({
      customer: {
        name: info.name,
        phone: info.phone,
        email: info.email || undefined,
        address: info.address,
      },
      items,
      notes: info.notes || undefined,
      source: 'web',
    });

    if (result) {
      setConfirmedOrder(result);
      trackPurchase(result);
      clearCart();
    } else {
      // Create a mock order for demo purposes when API is unavailable
      const mockOrder: OrderType = {
        _id: 'ord_' + Date.now().toString(36),
        fudo_order_id: '',
        customer_id: '',
        items: items.map((i) => ({
          menu_item_id: i.menu_item_id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          modifiers: i.modifiers.map((m) => m.name),
        })),
        subtotal,
        tax,
        total,
        status: 'pending',
        source: 'web',
        notes: info.notes || '',
        delivery_address: info.address,
        created_at: new Date().toISOString(),
      };
      setConfirmedOrder(mockOrder);
      trackPurchase(mockOrder);
      clearCart();
    }
  };

  if (confirmedOrder) {
    return (
      <Layout>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <OrderConfirmation order={confirmedOrder} />
        </section>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <span className="text-6xl block mb-4">🛒</span>
          <h2 className="text-2xl font-display font-bold text-sushi-secondary mb-2">
            Tu carrito está vacío
          </h2>
          <p className="text-gray-500 mb-6">
            Agregá items del menú para hacer tu pedido
          </p>
          <Link to="/menu" className="btn-primary inline-block">
            Ver Menú
          </Link>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-sushi-secondary py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold text-white">
            Finalizar <span className="text-sushi-accent">Pedido</span>
          </h1>
          <p className="text-gray-400 mt-1">Completá tus datos y confirmá tu orden</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="card p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-sushi-primary">
                  {error}
                </div>
              )}
              <OrderForm onSubmit={handleSubmit} loading={loading} />
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-2">
            <div className="card p-6 sticky top-24">
              <h3 className="text-lg font-bold text-sushi-secondary mb-4">
                Resumen del pedido
              </h3>
              <div className="space-y-0">
                {items.map((item) => (
                  <CartItemComponent key={item.menu_item_id} item={item} />
                ))}
              </div>
              <div className="mt-4">
                <CartSummary subtotal={subtotal} tax={tax} total={total} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Order;
