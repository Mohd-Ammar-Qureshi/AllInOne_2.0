import { Models } from 'appwrite';

export const PRODUCT_STATUSES = ['active', 'draft', 'out_of_stock'] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: 'Active',
  draft: 'Draft',
  out_of_stock: 'Out of Stock',
};

/** A product listed by an agency (seller). Table: medical_products. */
export type Product = Models.Row & {
  sellerId: string;
  name: string;
  description?: string | null;
  price: number;
  unit?: string | null;
  stock: number;
  imageUrl?: string | null;
  status: ProductStatus;
};

export type CreateProductInput = {
  sellerId: string;
  name: string;
  description?: string;
  price: number;
  unit?: string;
  stock: number;
  imageUrl?: string;
  status?: ProductStatus;
};

export type UpdateProductInput = Partial<
  Omit<CreateProductInput, 'sellerId'>
>;