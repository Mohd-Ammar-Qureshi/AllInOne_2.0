import { Models } from 'appwrite';
import { OrderStatus } from './order';

/**
 * In-app notification for either side of an order — sent to a buyer when a
 * seller changes an order's status, or to a seller when a buyer cancels an
 * order.
 * Table: notifications.
 */
export type AppNotification = Models.Row & {
  userId: string; // recipient of this notification (buyer or seller)
  orderId: string;
  orderRef: string; // short human-friendly reference, e.g. last 6 chars of orderId
  status: OrderStatus; // the order's status at the time this notification was created
  message: string;
  read: boolean;
};

export type CreateNotificationInput = {
  userId: string;
  orderId: string;
  orderRef: string;
  status: OrderStatus;
  message: string;
};