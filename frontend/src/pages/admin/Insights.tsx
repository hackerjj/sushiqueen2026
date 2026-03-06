import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

interface InsightsResponse {
  period: string;
  start_date: string;
  end_date: string;
  visits: { total: number; source: string };
  conversions: { total_orders: number; completed: number; cancelled: number; completion_rate: number };
  revenue: { total: number; subtotal: number; tax: number; order_count: number };
  revenue_by_source: { source: string; revenue: number; orders: number }[];
  customer_acquisition: { total_new: number; by_source: { source: string; new_customers: number }[] };
  orders_by_status: Record<string, number>;
  avg_order_value: number;
  top_items: { name: string; count: number; revenue: number }[];
}

interface Review {
  author: string;
  rating: number;
  text: string;
  time: string;
  relative_time: string;
}

interface ReviewsData {
  place_name: string;
  overall_rating: number;
  total_reviews: number;
  source: string;
  reviews: Review[];
}

interface DailySale {
  date: string;
  label: string;
  sales: number;
  orders: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface ChannelSale {
  channel: string;
  total: number;
  orders: number;
}

interface SalesTrendsData {
  daily_sales: DailySale[];
  top_products: TopProduct[];
  sales_by_channel: ChannelSale[];
  summary: {
    total_sales_month: number;
    total_orders_month: number;
    avg_ticket: number;
  };
}

const PERIODS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
];

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <span key={star} className={`text-sm ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ))}
  </div>
);

const channelLabels: Record<string, string> = {
  tables: '🪑 Mesas',
  counter: '🏪 Mostrador',
  delivery: '🛵 Delivery',
  express: '⚡ Express',
  web: '🌐 Web',
  whatsapp: '💬 WhatsApp',
};

const Insights: React.FC = () => {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewsData | null>(null);
  const [salesTrends, setSalesTrends] = useState<SalesTrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [insightsRes, reviewsRes, trendsRes] = await Promise.allSettled([
        api.get(`/admin/insights?period=${period}`),
        api.get('/admin/insights/reviews'),
        api.get('/admin/insights/sales-trends'),
      ]);

      if (insightsRes.status === 'fulfilled') {
        setData(insightsRes.value.data.data);
      }
      if (reviewsRes.status === 'fulfilled') {
        setReviews(reviewsRes.value.data.data);
      }
      if (trendsRes.status === 'fulfilled') {
        setSalesTrends(trendsRes.value.data.data);
      }

      if (insightsRes.status === 'rejected' && reviewsRes.status === 'rejected' && trendsRes.status === 'rejected') {
        setError('Error al cargar insights');
      }
    } catch {
      setError('Error al cargar insights');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const sourceEmoji: Record<string, string> = {
    web: '🌐',
    whatsapp: '💬',
    facebook: '📘',
  };

  // Simple bar chart using divs
  const maxDailySale = salesTrends
    ? Math.max(...salesTrends.daily_sales.map((d) => d.sales), 1)
    : 1;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-sushi-secondary">
            📊 Insights & Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-1">Reviews, métricas de rendimiento y tendencias de ventas</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p.value
                  ? 'bg-sushi-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          {error} — mostrando datos disponibles
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sushi-primary" />
        </div>
      ) : (
        <>
          {/* Google Maps Reviews Section */}
          {reviews && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-sushi-secondary mb-4">
                ⭐ Google Maps Reviews
              </h2>
              <div className="card p-6 mb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-sushi-secondary">{reviews.place_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold text-yellow-500">{reviews.overall_rating}</span>
                      <StarRating rating={Math.round(reviews.overall_rating)} />
                      <span className="text-sm text-gray-500">({reviews.total_reviews} reviews)</span>
                    </div>
                  </div>
                  {reviews.source === 'placeholder' && (
                    <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                      Datos de ejemplo — Configura Google Maps API
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviews.reviews.map((review, idx) => (
                  <div key={idx} className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sushi-secondary">{review.author}</span>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-3">{review.text}</p>
                    <p className="text-xs text-gray-400">{review.relative_time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sales Trends Section */}
          {salesTrends && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-sushi-secondary mb-4">
                📈 Tendencias de Ventas
              </h2>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="card p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Ventas del Mes</p>
                  <p className="text-2xl font-bold text-sushi-primary mt-1">
                    {formatCurrency(salesTrends.summary.total_sales_month)}
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Órdenes del Mes</p>
                  <p className="text-2xl font-bold text-sushi-secondary mt-1">
                    {salesTrends.summary.total_orders_month}
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Ticket Promedio</p>
                  <p className="text-2xl font-bold text-sushi-secondary mt-1">
                    {formatCurrency(salesTrends.summary.avg_ticket)}
                  </p>
                </div>
              </div>

              {/* Daily Sales Chart (simple bar chart) */}
              <div className="card p-6 mb-6">
                <h3 className="font-semibold text-sushi-secondary mb-4">Ventas Diarias (últimos 30 días)</h3>
                <div className="flex items-end gap-1 h-40 overflow-x-auto">
                  {salesTrends.daily_sales.map((day) => {
                    const height = maxDailySale > 0 ? (day.sales / maxDailySale) * 100 : 0;
                    return (
                      <div key={day.date} className="flex flex-col items-center flex-shrink-0 group" style={{ minWidth: '20px' }}>
                        <div className="relative w-full">
                          <div
                            className="bg-sushi-primary rounded-t hover:bg-sushi-accent transition-colors w-full"
                            style={{ height: `${Math.max(height, 2)}%`, minHeight: '2px' }}
                            title={`${day.label}: ${formatCurrency(day.sales)} (${day.orders} órdenes)`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>{salesTrends.daily_sales[0]?.label}</span>
                  <span>{salesTrends.daily_sales[salesTrends.daily_sales.length - 1]?.label}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="card p-6">
                  <h3 className="font-semibold text-sushi-secondary mb-4">🏆 Top Productos del Mes</h3>
                  {salesTrends.top_products.length > 0 ? (
                    <div className="space-y-3">
                      {salesTrends.top_products.map((product, idx) => (
                        <div key={product.name} className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-300 w-6">{idx + 1}</span>
                          <div className="flex-1">
                            <p className="font-medium text-sushi-secondary">{product.name}</p>
                            <p className="text-xs text-gray-500">
                              {product.quantity} vendidos · {formatCurrency(product.revenue)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Sin datos de productos este mes</p>
                  )}
                </div>

                {/* Sales by Channel */}
                <div className="card p-6">
                  <h3 className="font-semibold text-sushi-secondary mb-4">📊 Ventas por Canal</h3>
                  {salesTrends.sales_by_channel.length > 0 ? (
                    <div className="space-y-3">
                      {salesTrends.sales_by_channel.map((ch) => {
                        const pct =
                          salesTrends.summary.total_sales_month > 0
                            ? Math.round((ch.total / salesTrends.summary.total_sales_month) * 100)
                            : 0;
                        return (
                          <div key={ch.channel}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">
                                {channelLabels[ch.channel] || ch.channel}
                              </span>
                              <span className="font-medium">
                                {formatCurrency(ch.total)} ({ch.orders} pedidos)
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className="bg-sushi-primary h-2 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Sin datos de canales este mes</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Original Analytics Section */}
          {data && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-sushi-secondary mb-4">
                📋 Analytics Generales
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="card p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Visitas</p>
                  <p className="text-2xl font-bold text-sushi-secondary mt-1">{data.visits.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">{data.visits.source}</p>
                </div>
                <div className="card p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Pedidos</p>
                  <p className="text-2xl font-bold text-sushi-secondary mt-1">{data.conversions.total_orders}</p>
                  <p className="text-xs text-green-500 mt-1">{data.conversions.completion_rate}% completados</p>
                </div>
                <div className="card p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Revenue</p>
                  <p className="text-2xl font-bold text-sushi-primary mt-1">{formatCurrency(data.revenue.total)}</p>
                  <p className="text-xs text-gray-400 mt-1">{data.revenue.order_count} órdenes</p>
                </div>
                <div className="card p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Ticket Promedio</p>
                  <p className="text-2xl font-bold text-sushi-secondary mt-1">{formatCurrency(data.avg_order_value)}</p>
                  <p className="text-xs text-gray-400 mt-1">por pedido</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="card p-6">
                  <h3 className="font-semibold text-sushi-secondary mb-4">Revenue por Canal</h3>
                  <div className="space-y-3">
                    {data.revenue_by_source.map((s) => {
                      const pct = data.revenue.total > 0 ? Math.round((s.revenue / data.revenue.total) * 100) : 0;
                      return (
                        <div key={s.source}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{sourceEmoji[s.source] || '📊'} {s.source}</span>
                            <span className="font-medium">{formatCurrency(s.revenue)} ({s.orders} pedidos)</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-sushi-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="font-semibold text-sushi-secondary mb-4">Nuevos Clientes ({data.customer_acquisition.total_new})</h3>
                  <div className="space-y-3">
                    {data.customer_acquisition.by_source.map((s) => {
                      const pct = data.customer_acquisition.total_new > 0 ? Math.round((s.new_customers / data.customer_acquisition.total_new) * 100) : 0;
                      return (
                        <div key={s.source}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{sourceEmoji[s.source] || '📊'} {s.source}</span>
                            <span className="font-medium">{s.new_customers} clientes</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-sushi-accent h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-semibold text-sushi-secondary mb-4">🏆 Top Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-gray-500 font-medium">#</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Producto</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Cantidad</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_items.map((item, i) => (
                        <tr key={item.name} className="border-b border-gray-50">
                          <td className="py-3 text-gray-400">{i + 1}</td>
                          <td className="py-3 font-medium text-sushi-secondary">{item.name}</td>
                          <td className="py-3 text-right text-gray-600">{item.count}</td>
                          <td className="py-3 text-right font-medium text-sushi-primary">{formatCurrency(item.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Insights;
