export interface ReportProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export function sortProductsForReport(products: ReportProduct[]): {
  topProducts: ReportProduct[];
  lowProducts: ReportProduct[];
} {
  const sorted = [...products].sort((a, b) => b.quantity - a.quantity);
  return {
    topProducts: sorted,
    lowProducts: [...sorted].reverse(),
  };
}
