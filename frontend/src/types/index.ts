// ============================================
// MealLi POS - TypeScript Interfaces
// ============================================

// --- Menu ---

export interface Modifier {
  name: string;
  price: number;
}

export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  modifiers: Modifier[];
  available: boolean;
  sort_order: number;
  prices?: { default: number; delivery?: number; app?: number };
  available_hours?: { start?: string; end?: string };
  cost?: number;
  recipe_id?: string;
  created_at: string;
  updated_at: string;
  // Fudo specific fields
  subcategory?: string;
  code?: string;
  stock?: number | null;
  stock_control?: boolean;
  has_modifiers?: boolean;
  allow_sell_alone?: boolean;
  favorite?: boolean;
  supplier?: string;
  margin?: number;
  position?: number;
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
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export type OrderSource = 'web' | 'whatsapp' | 'facebook' | 'phone' | 'pos';
export type OrderType = 'dine_in' | 'takeout' | 'delivery';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'pending';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface OrderItem {
  menu_item_id: string;
  name: string;
  quantity: number;
  price: number;
  modifiers: string[];
  notes?: string;
  line_total?: number;
}

export interface Order {
  _id: string;
  order_number: string;
  customer_id: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  source: OrderSource;
  type: OrderType;
  notes: string;
  delivery_address: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  tip: number;
  prepared_items: number[];
  cash_register_id?: string;
  table_id?: string;
  assigned_to?: string;
  estimated_time?: number;
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
  type?: OrderType;
  table_id?: string;
  payment_method?: PaymentMethod;
}

// --- Customers ---

export type CustomerTier = 'new' | 'regular' | 'gold' | 'vip';
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
  predominant_order_type?: 'local' | 'delivery' | 'app' | null;
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

// --- Cash Register ---

export type CashMovementType = 'sale' | 'expense' | 'withdrawal' | 'deposit' | 'tip';

export interface CashMovement {
  type: CashMovementType;
  amount: number;
  description: string;
  order_id?: string;
  payment_method: PaymentMethod;
  created_at: string;
}

export interface CashRegister {
  _id: string;
  name: string;
  opened_by: string;
  opened_at: string;
  closed_at?: string;
  initial_amount: number;
  expected_amount: number;
  actual_amount?: number;
  status: 'open' | 'closed';
  movements: CashMovement[];
  summary: {
    total_sales: number;
    total_cash: number;
    total_card: number;
    total_transfer: number;
    total_tips: number;
    total_expenses: number;
    total_withdrawals: number;
  };
}

// --- Expenses ---

export type ExpenseCategory = 'ingredientes' | 'servicios' | 'personal' | 'alquiler' | 'marketing' | 'otros';

export interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  payment_method: PaymentMethod;
  receipt_url?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
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
  top_items_note?: string | null;
  fudo_revenue?: { total: number; count: number };
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
