import React, { useState } from 'react';

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

interface OrderFormProps {
  onSubmit: (info: CustomerInfo) => void;
  loading: boolean;
}

const OrderForm: React.FC<OrderFormProps> = ({ onSubmit, loading }) => {
  const [form, setForm] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});

  const validate = (): boolean => {
    const newErrors: Partial<CustomerInfo> = {};
    if (!form.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!form.phone.trim()) newErrors.phone = 'El teléfono es requerido';
    if (!form.address.trim()) newErrors.address = 'La dirección es requerida';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(form);
    }
  };

  const handleChange = (field: keyof CustomerInfo, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="text-lg font-bold text-sushi-secondary">Datos de entrega</h3>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nombre *
        </label>
        <input
          id="name"
          type="text"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className={`w-full px-4 py-3 rounded-lg border ${errors.name ? 'border-sushi-primary' : 'border-gray-300'} focus:ring-2 focus:ring-sushi-primary/20 focus:border-sushi-primary outline-none transition-colors`}
          placeholder="Tu nombre completo"
        />
        {errors.name && <p className="text-sushi-primary text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Teléfono *
        </label>
        <input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          className={`w-full px-4 py-3 rounded-lg border ${errors.phone ? 'border-sushi-primary' : 'border-gray-300'} focus:ring-2 focus:ring-sushi-primary/20 focus:border-sushi-primary outline-none transition-colors`}
          placeholder="+54 9 11 1234-5678"
        />
        {errors.phone && <p className="text-sushi-primary text-xs mt-1">{errors.phone}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-gray-400">(opcional)</span>
        </label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-sushi-primary' : 'border-gray-300'} focus:ring-2 focus:ring-sushi-primary/20 focus:border-sushi-primary outline-none transition-colors`}
          placeholder="tu@email.com"
        />
        {errors.email && <p className="text-sushi-primary text-xs mt-1">{errors.email}</p>}
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Dirección de entrega *
        </label>
        <input
          id="address"
          type="text"
          value={form.address}
          onChange={(e) => handleChange('address', e.target.value)}
          className={`w-full px-4 py-3 rounded-lg border ${errors.address ? 'border-sushi-primary' : 'border-gray-300'} focus:ring-2 focus:ring-sushi-primary/20 focus:border-sushi-primary outline-none transition-colors`}
          placeholder="Calle, número, piso, depto"
        />
        {errors.address && <p className="text-sushi-primary text-xs mt-1">{errors.address}</p>}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notas <span className="text-gray-400">(opcional)</span>
        </label>
        <textarea
          id="notes"
          value={form.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sushi-primary/20 focus:border-sushi-primary outline-none transition-colors resize-none"
          placeholder="Indicaciones especiales, timbre, etc."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Procesando...
          </>
        ) : (
          'Confirmar Pedido'
        )}
      </button>
    </form>
  );
};

export default OrderForm;
