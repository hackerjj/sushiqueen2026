import React from 'react';
import { Link } from 'react-router-dom';
import type { Order } from '../../types';
import OrderTracking from './OrderTracking';

interface OrderConfirmationProps {
  order: Order;
}

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({ order }) => {
  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="mb-6">
        <span className="text-6xl">🎉</span>
      </div>

      <h2 className="text-2xl font-display font-bold text-sushi-secondary mb-2">
        ¡Pedido confirmado!
      </h2>
      <p className="text-gray-500 mb-6">
        Tu pedido fue recibido y está siendo procesado.
      </p>

      <div className="card p-6 text-left space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Número de pedido</span>
          <span className="font-mono font-bold text-sushi-secondary">
            #{order._id.slice(-8).toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Total</span>
          <span className="font-bold text-sushi-primary text-lg">
            ${order.total.toLocaleString('es-AR')}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Tiempo estimado</span>
          <span className="font-medium text-sushi-secondary">30-45 min</span>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Estado del pedido</h4>
          <OrderTracking status={order.status} />
        </div>

        {order.items.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
            <ul className="space-y-1">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-gray-500">
                    ${(item.price * item.quantity).toLocaleString('es-AR')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/menu" className="flex-1 btn-secondary text-center">
          Seguir pidiendo
        </Link>
        <Link to="/" className="flex-1 py-3 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors text-center">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
