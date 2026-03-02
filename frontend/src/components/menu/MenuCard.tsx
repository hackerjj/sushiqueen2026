import React, { useState } from 'react';
import type { MenuItem } from '../../types';
import { useCart } from '../../hooks/useCart';

interface MenuCardProps {
  item: MenuItem;
}

const MenuCard: React.FC<MenuCardProps> = ({ item }) => {
  const { addMenuItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addMenuItem(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="card group flex flex-col">
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {!item.available && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-semibold text-sm bg-sushi-primary px-3 py-1 rounded-full">
              No disponible
            </span>
          </div>
        )}
        <span className="absolute top-3 left-3 bg-sushi-secondary/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
          {item.category}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-display text-lg font-semibold text-sushi-secondary">{item.name}</h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2 flex-1">{item.description}</p>

        {/* Modifiers */}
        {item.modifiers.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.modifiers.map((mod) => (
              <span
                key={mod.name}
                className="text-xs bg-sushi-accent/10 text-sushi-accent px-2 py-0.5 rounded-full"
              >
                + {mod.name} ${mod.price}
              </span>
            ))}
          </div>
        )}

        {/* Price + Add */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span className="text-xl font-bold text-sushi-primary">
            ${item.price.toLocaleString('es-AR')}
          </span>
          <button
            onClick={handleAdd}
            disabled={!item.available}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              added
                ? 'bg-green-500 text-white scale-95'
                : item.available
                ? 'bg-sushi-primary text-white hover:bg-red-700 active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {added ? '✓ Agregado' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
