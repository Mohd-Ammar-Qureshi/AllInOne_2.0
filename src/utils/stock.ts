import { ProductStatus } from '../types/product';

/** At or below this many units a product is shown as "Only N left". */
export const LOW_STOCK_THRESHOLD = 5;

export type StockTone = 'ok' | 'low' | 'out';

export type StockStatus = { tone: StockTone; label: string };

/** One place that decides how stock is worded, so every screen says the same. */
export const getStockStatus = (
  stock: number,
  status?: ProductStatus,
): StockStatus => {
  if (status === 'out_of_stock' || stock <= 0) {
    return { tone: 'out', label: 'Out of stock' };
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return { tone: 'low', label: `Only ${stock} left` };
  }
  return { tone: 'ok', label: `${stock} in stock` };
};
