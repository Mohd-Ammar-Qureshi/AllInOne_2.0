import { Models } from 'appwrite';

export const ORDER_STATUSES = [
  'pending',
  'accepted',
  'rejected',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/**
 * One order = one buyer (medical store) + one seller (agency).
 * Business rule: One Cart = One Seller = One Order, enforced by CartContext
 * before an order is ever created, and re-verified server-side in the
 * create-order Appwrite Function.
 * Table: orders.
 */
export type Order = Models.Row & {
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  notes?: string | null;
  deliverySnapshot?: string;
  /** Set by the customer after the seller marks the order shipped. */
  customerDeliveryAccepted?: boolean | null;
  /** Set by the seller after the customer has accepted delivery. */
  sellerDeliveryConfirmed?: boolean | null;
};

type DeliveryFields = Pick<
  Order,
  'status' | 'customerDeliveryAccepted' | 'sellerDeliveryConfirmed'
>;

/**
 * Where an order is in the two-sided delivery confirmation.
 * - not_shipped: nothing to confirm yet (pending / accepted)
 * - awaiting_customer: shipped, the customer has not accepted yet
 * - awaiting_seller: customer accepted, the seller has not confirmed yet
 * - completed: delivered (both confirmed)
 * - closed: cancelled or rejected; no delivery actions
 */
export type DeliveryStage =
  | 'not_shipped'
  | 'awaiting_customer'
  | 'awaiting_seller'
  | 'completed'
  | 'closed';

export const getDeliveryStage = (order: DeliveryFields): DeliveryStage => {
  switch (order.status) {
    case 'delivered':
      return 'completed';
    case 'cancelled':
    case 'rejected':
      return 'closed';
    case 'shipped':
      return order.customerDeliveryAccepted
        ? 'awaiting_seller'
        : 'awaiting_customer';
    default:
      return 'not_shipped';
  }
};

/** 'Shipped' becomes 'Delivery Accepted' once the customer has accepted. */
export const getOrderStatusLabel = (order: DeliveryFields): string =>
  order.status === 'shipped' && order.customerDeliveryAccepted
    ? 'Delivery Accepted'
    : ORDER_STATUS_LABELS[order.status];

/** A line item snapshot of a product at the time of order. Table: order_items. */
export type OrderItem = Models.Row & {
  orderId: string;
  productId: string;
  productName: string;
  price: number;
  unit?: string | null;
  quantity: number;
  subtotal: number;
};

export type CreateOrderItemInput = {
  productId: string;
  productName: string;
  price: number;
  unit?: string | null;
  quantity: number;
};

export type CreateOrderInput = {
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  notes?: string;
  items: CreateOrderItemInput[];
};

/** Seller-side actions allowed from a given order status. */
export const NEXT_SELLER_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ['accepted', 'rejected'],
  accepted: ['shipped'],
  // No shipped -> delivered here: delivery is completed only through the
  // two-sided confirmation (customer accepts, then seller confirms).
};

/** Buyer-side actions allowed from a given order status. */
export const NEXT_BUYER_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ['cancelled'],
};