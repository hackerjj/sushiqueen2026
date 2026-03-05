import React from 'react';
import type { MenuItem } from '../../types';
import MenuCard from './MenuCard';

interface MenuGridProps {
  items: MenuItem[];
  loading?: boolean;
}

const MenuGrid: React.FC<MenuGridProps> = ({ items, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="aspect-[4/3] bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="flex justify-between items-center pt-3">
                <div className="h-6 bg-gray-200 rounded w-20" />
                <div className="h-9 bg-gray-200 rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-5xl mb-4 block">🍣</span>
        <p className="text-gray-500 text-lg">No se encontraron items</p>
        <p className="text-gray-400 text-sm mt-1">Probá con otra categoría o búsqueda</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <MenuCard key={item._id} item={item} />
      ))}
    </div>
  );
};

export default MenuGrid;
