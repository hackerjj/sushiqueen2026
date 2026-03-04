import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import PromoSection from '../components/promo/PromoSection';
import api from '../services/api';
import type { Promotion, ApiResponse } from '../types';

const MOCK_PROMOTIONS: Promotion[] = [
  {
    _id: 'p1',
    title: '15% OFF Primera Compra',
    description: '15% de descuento en tu primer pedido por la web.',
    discount_type: 'percentage',
    discount_value: 15,
    applicable_items: [],
    image_url: '/images/menu/Makis Especiales/maki-queen.jpeg',
    starts_at: '2026-01-01T00:00:00Z',
    expires_at: '2026-06-30T23:59:59Z',
    active: true,
    code: 'BIENVENIDO15',
    usage_count: 0,
    max_usage: 1000,
  },
  {
    _id: 'p2',
    title: 'Paquete Queen -$30',
    description: '$30 de descuento en cualquier Paquete. Solo por WhatsApp.',
    discount_type: 'fixed',
    discount_value: 30,
    applicable_items: [],
    image_url: '/images/Promo1-Camarones-215.jpg',
    starts_at: '2026-01-01T00:00:00Z',
    expires_at: '2026-04-30T23:59:59Z',
    active: true,
    code: 'QUEENDESC',
    usage_count: 0,
    max_usage: 200,
  },
  {
    _id: 'p3',
    title: '2x1 en Makis',
    description: 'Lleva 2 makis y paga solo 1. Válido de lunes a miércoles.',
    discount_type: 'bogo',
    discount_value: 0,
    applicable_items: [],
    image_url: '/images/menu/Makis/maki-empanizado-manchego.jpeg',
    starts_at: '2026-01-01T00:00:00Z',
    expires_at: '2026-06-30T23:59:59Z',
    active: true,
    code: 'MAKI2X1',
    usage_count: 0,
    max_usage: 500,
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
