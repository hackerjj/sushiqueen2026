import React from 'react';
import type { Promotion } from '../../types';

interface PromoSectionProps {
  promotions: Promotion[];
  loading?: boolean;
}

const PromoSection: React.FC<PromoSectionProps> = ({ promotions, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="aspect-video bg-gray-200" />
            <div className="p-5 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-5xl mb-4 block">🎉</span>
        <p className="text-gray-500 text-lg">No hay promociones activas en este momento</p>
        <p className="text-gray-400 text-sm mt-1">¡Volvé pronto para nuevas ofertas!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {promotions.map((promo) => {
        const expiresDate = new Date(promo.expires_at);
        const isExpiringSoon =
          expiresDate.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

        return (
          <div key={promo._id} className="card group overflow-hidden">
            <div className="relative aspect-video overflow-hidden">
              <img
                src={promo.image_url || '/images/promo-1.jpg'}
                alt={promo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute top-3 right-3">
                <span className="bg-sushi-accent text-sushi-secondary text-xs font-bold px-3 py-1 rounded-full">
                  {promo.discount_type === 'percentage'
                    ? `${promo.discount_value}% OFF`
                    : promo.discount_type === 'fixed'
                    ? `$${promo.discount_value} OFF`
                    : '2x1'}
                </span>
              </div>
              {isExpiringSoon && (
                <div className="absolute top-3 left-3">
                  <span className="bg-sushi-primary text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                    ¡Últimos días!
                  </span>
                </div>
              )}
            </div>

            <div className="p-5">
              <h3 className="font-display text-lg font-bold text-sushi-secondary">
                {promo.title}
              </h3>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{promo.description}</p>

              {promo.code && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Código:</span>
                  <code className="bg-sushi-accent/10 text-sushi-accent font-mono font-bold text-sm px-3 py-1 rounded-lg border border-sushi-accent/20">
                    {promo.code}
                  </code>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                <span>
                  Válido hasta {expiresDate.toLocaleDateString('es-AR')}
                </span>
                {promo.max_usage > 0 && (
                  <span>
                    {promo.max_usage - promo.usage_count} restantes
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PromoSection;
