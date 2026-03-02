import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { usePageTracking } from './hooks/useAnalytics';

// Lazy-loaded public pages
const Home = lazy(() => import('./pages/Home'));
const Menu = lazy(() => import('./pages/Menu'));
const Order = lazy(() => import('./pages/Order'));
const Promotions = lazy(() => import('./pages/Promotions'));
const Campaign = lazy(() => import('./pages/Campaign'));

// Admin pages (lazy)
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const MenuManager = lazy(() => import('./pages/admin/MenuManager'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const Customers = lazy(() => import('./pages/admin/Customers'));
const AdminPromotions = lazy(() => import('./pages/admin/Promotions'));
const Insights = lazy(() => import('./pages/admin/Insights'));

const Loading: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-sushi-bg">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sushi-primary mx-auto"></div>
      <p className="text-gray-500 mt-4 text-sm">Cargando...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  // Track page views on every route change (Task 53/54)
  usePageTracking();

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public Routes (Layout is inside each page) */}
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/order" element={<Order />} />
        <Route path="/promotions" element={<Promotions />} />
        <Route path="/campaign" element={<Campaign />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/menu" element={<MenuManager />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/customers" element={<Customers />} />
        <Route path="/admin/promotions" element={<AdminPromotions />} />
        <Route path="/admin/insights" element={<Insights />} />
      </Routes>
    </Suspense>
  );
};

export default App;
