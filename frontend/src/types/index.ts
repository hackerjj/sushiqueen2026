// ============================================
// Sushi Queen - TypeScript Interfaces
// ============================================

// --- Menu ---

export interface Modifier {
  name: string;
  price: number;
}

export interface MenuItem {
  _id: string;
  fudo_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  modifiers: Modifier[];
  available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// --- Cart ---

export interface CartItemModifier {
  name: string;
  price: number;
}

export interface CartItem {
  menu_item_id: string;
  name: string;
  quantity: number;
  price: number;
  modifiers: CartItemModifier[];
  notes?: string;
}

// --- Orders ---

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export type OrderSource = 'web' | 'whatsapp' | 'facebook';

export interface OrderItem {
  menu_item_id: string;
  name: string;
  quantity: number;
  price: number;
  modifiers: string[];
}

export interface Order {
  _id: string;
  fudo_order_id: string;
  customer_id: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  source: OrderSource;
  notes: string;
  delivery_address: string;
  created_at: string;
  confirmed_at?: string;
}

export interface CreateOrderPayload {
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
  };
  items: CartItem[];
  notes?: string;
  source: OrderSource;
}

// --- Customers ---

export type CustomerTier = 'new' | 'regular' | 'vip';
export type CustomerSource = 'web' | 'whatsapp' | 'facebook';

export interface AIProfile {
  favorite_items: string[];
  order_frequency: string;
  avg_order_value: number;
  last_recommendations: string[];
}

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  source: CustomerSource;
  tier: CustomerTier;
  total_orders: number;
  total_spent: number;
  preferences: string[];
  ai_profile: AIProfile;
  facebook_id?: string;
  whatsapp_id?: string;
  created_at: string;
  last_order_at?: string;
}

// --- Promotions ---

export type DiscountType = 'percentage' | 'fixed' | 'bogo';

export interface Promotion {
  _id: string;
  title: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  applicable_items: string[];
  image_url: string;
  starts_at: string;
  expires_at: string;
  active: boolean;
  code: string;
  usage_count: number;
  max_usage: number;
}

// --- Dashboard / Insights ---

export interface DashboardKPIs {
  sales_today: number;
  sales_week: number;
  sales_month: number;
  orders_today: number;
  orders_week: number;
  new_customers_week: number;
  top_items: { name: string; count: number }[];
}

export interface InsightData {
  visits: number;
  conversions: number;
  orders: number;
  revenue: number;
  sources: { source: string; count: number }[];
  period: string;
}

// --- Auth ---

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

// --- API ---

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
