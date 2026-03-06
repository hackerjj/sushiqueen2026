import React, { useState } from 'react';
import { calculateCashPayment } from '../../utils/paymentUtils';
import type { PaymentDetails } from '../../utils/paymentUtils';

export interface PaymentModalProps {
  total: number;
  onConfirm: (details: PaymentDetails) => void;
  onCancel: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ total, onConfirm, onCancel }) => {
  const [method, setMethod] = useState<PaymentDetails['method'] | null>(null);
  const [cashReceived, setCashReceived] = useState('');
  const [noChange, setNoChange] = useState(false);
  const [borrowedAmount, setBorrowedAmount] = useState('');
  const [borrowedFrom, setBorrowedFrom] = useState('');

  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const changeAmount = Math.max(0, cashReceivedNum - total);
  const fmt = (n: number) => n.toLocaleString('es-MX', { minimumFractionDigits: 0 });

  const canConfirm = (): boolean => {
    if (!method) return false;
    if (method === 'cash') return cashReceivedNum >= total;
    return true; // credit_card and debit_card just need method selected
  };

  const handleConfirm = () => {
    if (!method || !canConfirm()) return;

    if (method === 'cash') {
      const details = calculateCashPayment(
        total,
        cashReceivedNum,
        noChange,
        noChange ? (parseFloat(borrowedAmount) || undefined) : undefined,
        noChange ? (borrowedFrom.trim() || undefined) : undefined,
      );
      onConfirm(details);
    } else {
      onConfirm({ method });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Método de pago</h2>
          <p className="text-sm text-gray-500 mt-1">Total: <span className="font-bold text-gray-900">${fmt(total)}</span></p>
        </div>

        {/* Payment method selection */}
        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: 'credit_card' as const, label: 'Tarjeta de crédito', icon: '💳' },
              { id: 'debit_card' as const, label: 'Tarjeta de débito', icon: '💳' },
              { id: 'cash' as const, label: 'Efectivo', icon: '💵' },
            ]).map(opt => (
              <button
                key={opt.id}
                onClick={() => { setMethod(opt.id); setNoChange(false); }}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  method === opt.id
                    ? 'border-sushi-primary bg-sushi-primary/5 text-sushi-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="text-xs text-center leading-tight">{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Cash-specific fields */}
          {method === 'cash' && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">¿Con cuánto paga?</label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg font-bold focus:ring-2 focus:ring-sushi-primary outline-none"
                  autoFocus
                />
              </div>

              {cashReceivedNum > 0 && (
                <div className="bg-gray-50 rounded-lg px-4 py-3 text-center">
                  <span className="text-sm text-gray-600">Cambio: </span>
                  <span className={`text-lg font-bold ${changeAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${fmt(changeAmount)}
                  </span>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noChange}
                  onChange={(e) => setNoChange(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-sushi-primary focus:ring-sushi-primary"
                />
                <span className="text-sm text-gray-700">No tengo cambio</span>
              </label>

              {noChange && (
                <div className="space-y-2 pl-6 border-l-2 border-orange-300">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">¿Cuánto pediste prestado?</label>
                    <input
                      type="number"
                      value={borrowedAmount}
                      onChange={(e) => setBorrowedAmount(e.target.value)}
                      placeholder="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-sushi-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">¿A quién?</label>
                    <input
                      type="text"
                      value={borrowedFrom}
                      onChange={(e) => setBorrowedFrom(e.target.value)}
                      placeholder="Nombre de la persona"
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-sushi-primary outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm()}
            className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
          >
            ✓ Confirmar pago
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
