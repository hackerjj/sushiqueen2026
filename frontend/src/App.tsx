import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { usePageTracking } from './hooks/useAnalytics';
import ErrorBoundary from './components/ErrorBoundary';
import AuthGuard from './components/AuthGuard';

// Lazy-loaded public pages
const Home = lazy(() => import('./pages/Home'));
const Menu = lazy(() => import('./pages/Menu'));
const Order = lazy(() => import('./pages/Order'));
const Promotions = lazy(() => import('./pages/Promotions'));
const Campaign = lazy(() => import('./pages/Campaign'));

const NotFound = lazy(() => import('./pages/NotFound'));

// Admin pages (lazy)
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const MenuManager = lazy(() => import('./pages/admin/MenuManager'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const Customers = lazy(() => import('./pages/admin/Customers'));
const AdminPromotions = lazy(() => import('./pages/admin/Promotions'));
const Insights = lazy(() => import('./pages/admin/Insights'));
const POS = lazy(() => import('./pages/admin/POS'));
const Kitchen = lazy(() => import('./pages/admin/Kitchen'));
const Delivery = lazy(() => import('./pages/admin/Delivery'));
const CashRegister = lazy(() => import('./pages/admin/CashRegister'));
const Inventory = lazy(() => import('./pages/admin/Inventory'));
const Suppliers = lazy(() => import('./pages/admin/Suppliers'));
const Tables = lazy(() => import('./pages/admin/Tables'));
const Recipes = lazy(() => import('./pages/admin/Recipes'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const Expenses = lazy(() => import('./pages/admin/Expenses'));

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
    <ErrorBoundary>
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
          <Route path="/admin" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/admin/pos" element={<AuthGuard><POS /></AuthGuard>} />
          <Route path="/admin/kitchen" element={<AuthGuard><Kitchen /></AuthGuard>} />
          <Route path="/admin/delivery" element={<AuthGuard><Delivery /></AuthGuard>} />
          <Route path="/admin/cash-register" element={<AuthGuard><CashRegister /></AuthGuard>} />
          <Route path="/admin/menu" element={<AuthGuard><MenuManager /></AuthGuard>} />
          <Route path="/admin/orders" element={<AuthGuard><AdminOrders /></AuthGuard>} />
          <Route path="/admin/customers" element={<AuthGuard><Customers /></AuthGuard>} />
          <Route path="/admin/promotions" element={<AuthGuard><AdminPromotions /></AuthGuard>} />
          <Route path="/admin/insights" element={<AuthGuard><Insights /></AuthGuard>} />
          <Route path="/admin/inventory" element={<AuthGuard><Inventory /></AuthGuard>} />
          <Route path="/admin/suppliers" element={<AuthGuard><Suppliers /></AuthGuard>} />
          <Route path="/admin/tables" element={<AuthGuard><Tables /></AuthGuard>} />
          <Route path="/admin/recipes" element={<AuthGuard><Recipes /></AuthGuard>} />
          <Route path="/admin/reports" element={<AuthGuard><Reports /></AuthGuard>} />
          <Route path="/admin/expenses" element={<AuthGuard><Expenses /></AuthGuard>} />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
