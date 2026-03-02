// ============================================
// Sushi Queen - Analytics Service
// Facebook Pixel + Google Analytics 4 + GTM
// ============================================

import type { CartItem, Order } from '../types';

// ─── Environment Variables ───────────────────────────────────────

const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID || '';
const GA_ID = import.meta.env.VITE_GA_ID || '';
const GTM_ID = import.meta.env.VITE_GTM_ID || '';
const GOOGLE_ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID || '';
const GOOGLE_ADS_CONVERSION_LABEL = import.meta.env.VITE_GOOGLE_ADS_CONVERSION_LABEL || '';

// ─── Type Declarations ───────────────────────────────────────────

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
    gtag: (...args: unknown[]) => void;
    dataLayer: Record<string, unknown>[];
  }
}

// ─── UTM Parameter Handling (Task 57) ────────────────────────────

interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export function captureUTMParams(): UTMParams {
  const params = new URLSearchParams(window.location.search);
  const utm: UTMParams = {};

  const keys: (keyof UTMParams)[] = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  keys.forEach((key) => {
    const value = params.get(key);
    if (value) utm[key] = value;
  });

  if (Object.keys(utm).length > 0) {
    sessionStorage.setItem('sq_utm', JSON.stringify(utm));
  }

  return utm;
}

export function getStoredUTM(): UTMParams {
  try {
    const stored = sessionStorage.getItem('sq_utm');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// ─── Facebook Pixel ──────────────────────────────────────────────

function initFacebookPixel(): void {
  if (!FB_PIXEL_ID) return;

  /* eslint-disable */
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq('init', FB_PIXEL_ID);
}

function fbTrack(event: string, data?: Record<string, unknown>): void {
  if (!FB_PIXEL_ID || typeof window.fbq !== 'function') return;
  if (data) {
    window.fbq('track', event, data);
  } else {
    window.fbq('track', event);
  }
}

// ─── Google Analytics 4 ──────────────────────────────────────────

function initGA4(): void {
  if (!GA_ID) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer.push(Object.assign({}, ...args.map((a, i) => ({ [i]: a }))));
  };
  // Proper gtag implementation
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments as unknown as Record<string, unknown>);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });

  // Configure Google Ads if present
  if (GOOGLE_ADS_ID) {
    window.gtag('config', GOOGLE_ADS_ID);
  }
}

// ─── Google Tag Manager ──────────────────────────────────────────

function initGTM(): void {
  if (!GTM_ID) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(script);
}

function gtagEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params || {});
}

// ─── Initialization ──────────────────────────────────────────────

export function initAnalytics(): void {
  initFacebookPixel();
  initGA4();
  initGTM();
  captureUTMParams();
}

// ─── Page View Tracking ──────────────────────────────────────────

export function trackPageView(path: string, title?: string): void {
  // Facebook Pixel
  fbTrack('PageView');

  // GA4
  gtagEvent('page_view', {
    page_path: path,
    page_title: title || document.title,
  });
}

// ─── Event: ViewContent (Menu page) ──────────────────────────────

export function trackViewContent(contentName?: string, contentCategory?: string): void {
  const utm = getStoredUTM();

  // Facebook Pixel
  fbTrack('ViewContent', {
    content_name: contentName || 'Menu',
    content_category: contentCategory || 'menu',
    content_type: 'product_group',
  });

  // GA4
  gtagEvent('view_item_list', {
    item_list_name: contentName || 'Menu',
    item_list_id: contentCategory || 'menu',
    ...utm,
  });
}

// ─── Event: AddToCart ────────────────────────────────────────────

export function trackAddToCart(item: CartItem): void {
  const value = item.price * item.quantity;
  const utm = getStoredUTM();

  // Facebook Pixel
  fbTrack('AddToCart', {
    content_name: item.name,
    content_ids: [item.menu_item_id],
    content_type: 'product',
    value,
    currency: 'ARS',
  });

  // GA4
  gtagEvent('add_to_cart', {
    currency: 'ARS',
    value,
    items: [
      {
        item_id: item.menu_item_id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      },
    ],
    ...utm,
  });
}

// ─── Event: InitiateCheckout ─────────────────────────────────────

export function trackInitiateCheckout(items: CartItem[], total: number): void {
  const utm = getStoredUTM();

  // Facebook Pixel
  fbTrack('InitiateCheckout', {
    content_ids: items.map((i) => i.menu_item_id),
    contents: items.map((i) => ({
      id: i.menu_item_id,
      quantity: i.quantity,
    })),
    num_items: items.reduce((sum, i) => sum + i.quantity, 0),
    value: total,
    currency: 'ARS',
  });

  // GA4
  gtagEvent('begin_checkout', {
    currency: 'ARS',
    value: total,
    items: items.map((i) => ({
      item_id: i.menu_item_id,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
    ...utm,
  });
}

// ─── Event: Lead (order form submit) ─────────────────────────────

export function trackLead(value: number): void {
  const utm = getStoredUTM();

  // Facebook Pixel
  fbTrack('Lead', {
    value,
    currency: 'ARS',
  });

  // GA4
  gtagEvent('generate_lead', {
    currency: 'ARS',
    value,
    ...utm,
  });
}

// ─── Event: Purchase (order confirmation) ────────────────────────

export function trackPurchase(order: Order): void {
  const utm = getStoredUTM();

  // Facebook Pixel
  fbTrack('Purchase', {
    content_ids: order.items.map((i) => i.menu_item_id),
    contents: order.items.map((i) => ({
      id: i.menu_item_id,
      quantity: i.quantity,
    })),
    content_type: 'product',
    num_items: order.items.reduce((sum, i) => sum + i.quantity, 0),
    value: order.total,
    currency: 'ARS',
  });

  // GA4
  gtagEvent('purchase', {
    transaction_id: order._id,
    value: order.total,
    tax: order.tax,
    currency: 'ARS',
    items: order.items.map((i) => ({
      item_id: i.menu_item_id,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
    ...utm,
  });

  // Google Ads conversion (Task 57)
  if (GOOGLE_ADS_ID && GOOGLE_ADS_CONVERSION_LABEL) {
    gtagEvent('conversion', {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_CONVERSION_LABEL}`,
      value: order.total,
      currency: 'ARS',
      transaction_id: order._id,
    });
  }
}

// ─── Event: Campaign Visit (Task 56) ────────────────────────────

export function trackCampaignVisit(params: UTMParams): void {
  fbTrack('ViewContent', {
    content_name: 'Campaign Landing',
    content_category: params.utm_campaign || 'campaign',
  });

  gtagEvent('campaign_visit', {
    campaign_source: params.utm_source,
    campaign_medium: params.utm_medium,
    campaign_name: params.utm_campaign,
  });
}

export default {
  initAnalytics,
  trackPageView,
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
  trackLead,
  trackPurchase,
  trackCampaignVisit,
  captureUTMParams,
  getStoredUTM,
};
