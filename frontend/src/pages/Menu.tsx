import React, { useState, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import CategoryFilter from '../components/menu/CategoryFilter';
import MenuGrid from '../components/menu/MenuGrid';
import { useMenu } from '../hooks/useMenu';

const Menu: React.FC = () => {
  const { items, loading } = useMenu();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  // Get unique categories from loaded items
  const availableCategories = useMemo(
    () => [...new Set(items.map((item) => item.category))],
    [items]
  );

  const filteredItems = useMemo(() => {
    let result = items;
    if (category !== 'all') {
      result = result.filter((item) => item.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, category, search]);

  return (
    <Layout>
      {/* Header */}
      <section className="bg-sushi-secondary py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Nuestro <span className="text-sushi-accent">Menú</span>
          </h1>
          <p className="text-gray-400 mt-2">
            Descubrí todos nuestros platos preparados con ingredientes frescos
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto mt-6">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar platos..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sushi-accent/50 focus:border-sushi-accent transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <CategoryFilter selected={category} onSelect={setCategory} availableCategories={availableCategories} />
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-4">
            {filteredItems.length} {filteredItems.length === 1 ? 'resultado' : 'resultados'}
            {category !== 'all' && ` en ${category}`}
            {search && ` para "${search}"`}
          </p>
        )}

        {/* Grid */}
        <MenuGrid items={filteredItems} loading={loading} />
      </section>
    </Layout>
  );
};

export default Menu;
