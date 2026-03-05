import React from 'react';

const CATEGORIES = [
  { id: 'all', label: 'Todos', emoji: '🍱' },
  { id: 'Especialidades', label: 'Especialidades', emoji: '⭐' },
  { id: 'Sopas y Ramen', label: 'Sopas y Ramen', emoji: '🍜' },
  { id: 'Entradas', label: 'Entradas', emoji: '🍢' },
  { id: 'Kushiages', label: 'Kushiages', emoji: '🍢' },
  { id: 'Makis', label: 'Makis', emoji: '🍣' },
  { id: 'Makis Especiales', label: 'Makis Especiales', emoji: '👑' },
  { id: 'Yakimeshi', label: 'Yakimeshi', emoji: '🍚' },
  { id: 'Yakisoba', label: 'Yakisoba', emoji: '🍝' },
  { id: 'Teppanyaki', label: 'Teppanyaki', emoji: '🔥' },
  { id: 'Tempuras', label: 'Tempuras', emoji: '🍤' },
  { id: 'Paquetes', label: 'Paquetes', emoji: '📦' },
  { id: 'Pastas', label: 'Pastas', emoji: '🍝' },
  { id: 'Pastas Queen', label: 'Pastas Queen', emoji: '🍝' },
  { id: 'Postres', label: 'Postres', emoji: '🍰' },
  { id: 'Bebidas', label: 'Bebidas', emoji: '🥤' },
  { id: 'Salsas', label: 'Salsas', emoji: '🫙' },
];

interface CategoryFilterProps {
  selected: string;
  onSelect: (category: string) => void;
  availableCategories?: string[];
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ selected, onSelect, availableCategories }) => {
  // If we know which categories have items, only show those + "all"
  const visibleCategories = availableCategories
    ? CATEGORIES.filter((cat) => cat.id === 'all' || availableCategories.includes(cat.id))
    : CATEGORIES;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
      {visibleCategories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            selected === cat.id
              ? 'bg-sushi-primary text-white shadow-md shadow-sushi-primary/25'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <span>{cat.emoji}</span>
          {cat.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
