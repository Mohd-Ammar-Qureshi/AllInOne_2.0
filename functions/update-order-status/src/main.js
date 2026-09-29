import { Client, TablesDB, ID, Permission, Query, Role } from 'node-appwrite';

/**
 * Secure server-side order status changes for AllInOne.
 *
 * Why this exists: orders used to be updated straight from the app, so the
 * "allowed transitions" rules only lived in the UI. Anyone with a modified
 * client could mark any order "delivered". Now the app calls this Function
 * instead, and it is the only thing that writes `orders.status`.
 *
 * When an order is rejected or cancelled, the stock that create-order-2
 * reserved for it is returned to the products (best-effort).
 *
 * It also creates the in-app notification for the *other* party. A client
 * session can never grant a document permission to a different user, so a
 * notification for the buyer/seller can only be created server-side.
 *
 * Security model:
 * - The caller is taken ONLY from Appwrite's `x-appwrite-user-id` header.
 * - The caller must be the order's buyer or its seller.
 * - Only the transitions below are allowed. Keep in sync with
 *   NEXT_SELLER_STATUSES / NEXT_BUYER_STATUSES in src/types/order.ts.
 */

const ORDER_STATUSES = [
  'pending',
  'accepted',
  'rejected',
  'shipped',
  'delivered',
  'cancelled',
];

const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const SELLER_TRANSITIONS = {
  pending: ['accepted', 'rejected'],
  accepted: ['shipped'],
  shipped: ['delivered'],
};

const BUYER_TRANSITIONS = {
  pending: ['cancelled'],
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const allowedNextStatuses = (order, callerId) => {
  const allowed = [];
  if (callerId === order.sellerId) {
    allowed.push(...(SELLER_TRANSITIONS[order.status] ?? []));
  }
  if (callerId === order.buyerId) {
    allowed.push(...(BUYER_TRANSITIONS[order.status] ?? []));
  }
  return allowed;
};

// Statuses that end an order without delivering it, so its stock must go back.
const STOCK_RESTORING_STATUSES = ['rejected', 'cancelled'];

/**
 * Best-effort: adds each order line's quantity back onto its product, and
 * flips a product that create-order-2 marked "out_of_stock" back to
 * "active". A "draft" product stays draft (the seller chose that). Any
 * failure is logged and swallowed: it must never undo or fail the status
 * change itself, and a product that was deleted since is simply skipped.
 */
const restoreStock = async (tables, { databaseId, orderId, log, error }) => {
  const itemsTableId = process.env.APPWRITE_ORDER_ITEMS_TABLE_ID;
  const productsTableId = process.env.APPWRITE_MEDICAL_PRODUCTS_TABLE_ID;
  if (!itemsTableId || !productsTableId) {
    error(
      'Stock not restored: APPWRITE_ORDER_ITEMS_TABLE_ID / APPWRITE_MEDICAL_PRODUCTS_TABLE_ID is not set on this function.',
    );
    return;
  }

  try {
    const { rows } = await tables.listRows({
      databaseId,
      tableId: itemsTableId,
      queries: [Query.equal('orderId', orderId), Query.limit(100)],
    });

    const results = await Promise.allSettled(
      rows.map(async item => {
        const product = await tables.getRow({
          databaseId,
          tableId: productsTableId,
          rowId: item.productId,
        });
        const nextStock = (Number(product.stock) || 0) + item.quantity;
        await tables.updateRow({
          databaseId,
          tableId: productsTableId,
          rowId: item.productId,
          data: {
            stock: nextStock,
            status: product.status === 'out_of_stock' ? 'active' : product.status,
          },
        });
      }),
    );

    const failed = results.filter(r => r.status === 'rejected').length;
    log(`Stock restored for order ${orderId}: ${rows.length - failed}/${rows.length} products`);
  } catch (restoreErr) {
    error(`Stock restore failed: ${restoreErr.message ?? String(restoreErr)}`);
  }
};

// Env vars this Function cannot work without. APPWRITE_ORDER_ITEMS_TABLE_ID and
// APPWRITE_MEDICAL_PRODUCTS_TABLE_ID are only needed for the (best-effort)
// stock restore, so they are checked there instead.
const REQUIRED_ENV = [
  'APPWRITE_ENDPOINT',
  'APPWRITE_PROJECT_ID',
  'APPWRITE_API_KEY',
  'APPWRITE_DATABASE_ID',
  'APPWRITE_ORDERS_TABLE_ID',
  'APPWRITE_NOTIFICATIONS_TABLE_ID',
];

export default async ({ req, res, log, error }) => {
  try {
    // Everything, including client setup, lives inside this try so a
    // misconfigured Function answers with a JSON error instead of crashing
    // with an empty response (which the app can only show as a generic error).
    const missingEnv = REQUIRED_ENV.filter(name => !process.env[name]);
    if (missingEnv.length > 0) {
      error(`Function is missing environment variables: ${missingEnv.join(', ')}`);
      throw new HttpError(500, 'Order service is not configured. Please contact support.');
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const tables = new TablesDB(client);

    const databaseId = process.env.APPWRITE_DATABASE_ID;
    const ordersTableId = process.env.APPWRITE_ORDERS_TABLE_ID;
    const notificationsTableId = process.env.APPWRITE_NOTIFICATIONS_TABLE_ID;

    const callerId = req.headers['x-appwrite-user-id'];
    if (!callerId) {
      throw new HttpError(401, 'You must be signed in to update an order.');
    }

    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
      throw new HttpError(400, 'Invalid request body.');
    }
    const orderId = body && body.orderId;
    const nextStatus = body && body.status;

    if (!orderId || typeof orderId !== 'string') {
      throw new HttpError(400, 'orderId is required.');
    }
    if (!ORDER_STATUSES.includes(nextStatus)) {
      throw new HttpError(400, 'A valid status is required.');
    }
    let order;
    try {
      order = await tables.getRow({
        databaseId,
        tableId: ordersTableId,
        rowId: orderId,
      });
    } catch (getErr) {
      // Appwrite answers 404 both for "no such row" AND for a wrong database,
      // table or project. Only a missing row means the order does not exist;
      // everything else is a configuration/permission problem and is reported
      // as such, with Appwrite's error type, so it can be told apart.
      const errType = (getErr && getErr.type) || 'unknown';
      error(
        `getRow failed [${getErr && getErr.code} ${errType}]: ${getErr && getErr.message} | ` +
          `endpoint=${process.env.APPWRITE_ENDPOINT} project=${process.env.APPWRITE_PROJECT_ID} ` +
          `database=${databaseId} table=${ordersTableId} row=${orderId}`,
      );
      if (
        getErr &&
        getErr.code === 404 &&
        (errType === 'row_not_found' || errType === 'document_not_found')
      ) {
        throw new HttpError(404, 'Order not found.');
      }
      throw new HttpError(500, `Unable to load the order (${errType}).`);
    }

    if (callerId !== order.sellerId && callerId !== order.buyerId) {
      // Same message as "not found" so order ids can't be probed by callers;
      // the real reason is only written to the Function's own logs.
      error(
        `Caller ${callerId} is neither the buyer (${order.buyerId}) nor the seller (${order.sellerId}) of order ${orderId}.`,
      );
      throw new HttpError(404, 'Order not found.');
    }

    const allowed = allowedNextStatuses(order, callerId);
    if (!allowed.includes(nextStatus)) {
      throw new HttpError(
        409,
        `This order is ${STATUS_LABELS[order.status] ?? order.status} and can no longer be changed to ${STATUS_LABELS[nextStatus]}.`,
      );
    }

    const updated = await tables.updateRow({
      databaseId,
      tableId: ordersTableId,
      rowId: orderId,
      data: { status: nextStatus },
    });

    if (STOCK_RESTORING_STATUSES.includes(nextStatus)) {
      await restoreStock(tables, { databaseId, orderId, log, error });
    }

    // Best-effort notification for the other party. Never fail (or undo)
    // the status change because of it.
    try {
      const orderRef = order.$id.slice(-6).toUpperCase();
      const isSellerAction = callerId === order.sellerId;
      const recipientId = isSellerAction ? order.buyerId : order.sellerId;
      const message = isSellerAction
        ? `Your order #${orderRef} status has been updated to ${STATUS_LABELS[nextStatus]}.`
        : `Order #${orderRef} from ${order.buyerName} has been cancelled by the buyer.`;

      await tables.createRow({
        databaseId,
        tableId: notificationsTableId,
        rowId: ID.unique(),
        data: {
          userId: recipientId,
          orderId: order.$id,
          orderRef,
          status: nextStatus,
          message,
          read: false,
        },
        permissions: [
          Permission.read(Role.user(recipientId)),
          Permission.update(Role.user(recipientId)),
          Permission.delete(Role.user(recipientId)),
        ],
      });
    } catch (notifyErr) {
      error(`Notification failed: ${notifyErr.message ?? String(notifyErr)}`);
    }

    log(`Order ${orderId}: ${order.status} -> ${nextStatus} by ${callerId}`);
    return res.json({ order: updated });
  } catch (err) {
    error(err.message ?? String(err));
    const status = err instanceof HttpError ? err.status : 500;
    return res.json(
      { error: err instanceof HttpError ? err.message : 'Unable to update order.' },
      status,
    );
  }
};