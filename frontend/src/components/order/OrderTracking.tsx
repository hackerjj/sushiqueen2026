import React from 'react';
import type { OrderStatus } from '../../types';

interface OrderTrackingProps {
  status: OrderStatus;
}

const STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: 'pending', label: 'Pendiente', icon: '📋' },
  { key: 'confirmed', label: 'Confirmado', icon: '✅' },
  { key: 'preparing', label: 'Preparando', icon: '👨‍🍳' },
  { key: 'ready', label: 'Listo', icon: '📦' },
  { key: 'delivered', label: 'Entregado', icon: '🎉' },
];

const OrderTracking: React.FC<OrderTrackingProps> = ({ status }) => {
  const currentIndex = STEPS.findIndex((s) => s.key === status);

  if (status === 'cancelled') {
    return (
      <div className="text-center py-6">
        <span className="text-4xl">❌</span>
        <p className="text-sushi-primary font-semibold mt-2">Pedido cancelado</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                    isCompleted
                      ? 'bg-sushi-primary text-white shadow-md shadow-sushi-primary/25'
                      : 'bg-gray-100 text-gray-400'
                  } ${isCurrent ? 'ring-4 ring-sushi-primary/20 scale-110' : ''}`}
                >
                  {step.icon}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    isCompleted ? 'text-sushi-secondary' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mb-6 ${
                    index < currentIndex ? 'bg-sushi-primary' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTracking;
