import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import PromoSection from '../components/promo/PromoSection';
import api from '../services/api';
import type { Promotion, ApiResponse } from '../types';

const MOCK_PROMOTIONS: Promotion[] = [
  {
    _id: 'p1',
    title: '2x1 en Rolls Clásicos',
    description: 'Todos los martes y jueves, llevá 2 rolls clásicos por el precio de 1. Incluye Philadelphia, California y Kappa.',
    discount_type: 'bogo',
    discount_value: 0,
    applicable_items: [],
    image_url: '/images/promo-1.jpg',
    starts_at: '2024-01-01T00:00:00Z',
    expires_at: '2025-12-31T23:59:59Z',
    active: true,
    code: 'ROLL2X1',
    usage_count: 234,
    max_usage: 500,
  },
  {
    _id: 'p2',
    title: '20% OFF Primer Pedido',
    description: 'Registrate en nuestra web y obtené un 20% de descuento en tu primera orden. Válido para todos los items del menú.',
    discount_type: 'percentage',
    discount_value: 20,
    applicable_items: [],
    image_url: '/images/promo-2.jpg',
    starts_at: '2024-01-01T00:00:00Z',
    expires_at: '2025-12-31T23:59:59Z',
    active: true,
    code: 'BIENVENIDO20',
    usage_count: 89,
    max_usage: 1000,
  },
  {
    _id: 'p3',
    title: 'Combo Noche Especial',
    description: 'De lunes a miércoles después de las 20hs: 30 piezas + 2 bebidas con $1500 de descuento.',
    discount_type: 'fixed',
    discount_value: 1500,
    applicable_items: [],
    image_url: '/images/sushi-roll-1.jpg',
    starts_at: '2024-01-01T00:00:00Z',
    expires_at: '2025-06-30T23:59:59Z',
    active: true,
    code: 'NOCHE1500',
    usage_count: 156,
    max_usage: 300,
  },
  {
    _id: 'p4',
    title: 'Happy Hour Bebidas',
    description: 'De 18 a 20hs todas las bebidas al 50%. Combiná con tu sushi favorito.',
    discount_type: 'percentage',
    discount_value: 50,
    applicable_items: [],
    image_url: '/images/about-sushi.jpg',
    starts_at: '2024-01-01T00:00:00Z',
    expires_at: '2025-12-31T23:59:59Z',
    active: true,
    code: 'HAPPY50',
    usage_count: 412,
    max_usage: 0,
  },
  {
    _id: 'p5',
    title: 'Sábado de Sashimi',
    description: 'Todos los sábados, 15% OFF en toda la línea de sashimi. Salmón, atún y langostino premium.',
    discount_type: 'percentage',
    discount_value: 15,
    applicable_items: [],
    image_url: '/images/sushi-roll-2.jpg',
    starts_at: '2024-01-01T00:00:00Z',
    expires_at: '2025-12-31T23:59:59Z',
    active: true,
    code: 'SABSASHIMI',
    usage_count: 78,
    max_usage: 200,
  },
];

const Promotions: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const { data } = await api.get<ApiResponse<Promotion[]>>('/promotions', {
          params: { active: true },
        });
        setPromotions(data.data);
      } catch {
        setPromotions(MOCK_PROMOTIONS);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  return (
    <Layout>
      <section className="bg-sushi-secondary py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Promociones <span className="text-sushi-accent">Activas</span>
          </h1>
          <p className="text-gray-400 mt-2">
            Aprovechá nuestras ofertas especiales y ahorrá en tu próximo pedido
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PromoSection promotions={promotions} loading={loading} />
      </section>

      {/* WhatsApp CTA */}
      <section className="bg-gradient-to-r from-sushi-primary to-red-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-2xl font-bold text-white mb-3">
            ¿Tenés un código de descuento?
          </h2>
          <p className="text-red-100 mb-6 max-w-md mx-auto">
            Aplicalo al momento de hacer tu pedido online o mencionalo por WhatsApp.
          </p>
          <a
            href="https://wa.me/5491112345678?text=Hola!%20Quiero%20usar%20mi%20código%20de%20descuento"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-sushi-primary px-8 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors"
          >
            Consultar por WhatsApp
          </a>
        </div>
      </section>
    </Layout>
  );
};

export default Promotions;
