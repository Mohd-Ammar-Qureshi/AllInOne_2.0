import { ExecutionMethod, Functions, Query, TablesDB } from 'appwrite';
import {
  APPWRITE_CREATE_ORDER_FUNCTION_ID,
  APPWRITE_DATABASE_ID,
  APPWRITE_ORDERS_TABLE_ID,
  APPWRITE_ORDER_ITEMS_TABLE_ID,
  APPWRITE_UPDATE_ORDER_STATUS_FUNCTION_ID,
  appwriteClient,
} from './client';
import { CreateOrderInput, Order, OrderItem, OrderStatus } from '../types/order';

class OrderService {
  private tables: TablesDB;
  private functions: Functions;

  constructor() {
    this.tables = new TablesDB(appwriteClient);
    this.functions = new Functions(appwriteClient);
  }

  /**
   * Creates one order plus its line items via the server-side `create-order`
   * Appwrite Function, instead of writing rows directly from this client.
   *
   * Why: a buyer's client session can only grant Appwrite document
   * permissions for roles it itself holds (any, users, or its own
   * user:<buyerId>) — it can never grant a permission naming the seller, a
   * *different* user. Only a server-side API key can do that, so order
   * creation (and the precise buyer+seller permissions it needs) now
   * happens inside that Function. The Function also re-validates the
   * seller and every product server-side rather than trusting this input.
   */
  async createOrder(input: CreateOrderInput): Promise<Order> {
   const execution = await this.functions.createExecution({
  functionId: APPWRITE_CREATE_ORDER_FUNCTION_ID,
  body: JSON.stringify({
    sellerId: input.sellerId,
    address: input.address,
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    phone: input.phone,
    notes: input.notes,
    items: input.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  }),
  method: ExecutionMethod.POST,
});

    let parsed: { order?: Order; error?: string } = {};
    try {
      parsed = execution.responseBody
        ? JSON.parse(execution.responseBody)
        : {};
    } catch {
      throw new Error('Unable to place order. Please try again.');
    }

    if (execution.responseStatusCode >= 400 || !parsed.order) {
      throw new Error(parsed.error ?? 'Unable to place order.');
    }

    return parsed.order;
  }

  async getOrder(orderId: string): Promise<Order> {
    return this.tables.getRow<Order>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_ORDERS_TABLE_ID,
      rowId: orderId,
    });
  }

  async listOrderItems(orderId: string): Promise<OrderItem[]> {
    const response = await this.tables.listRows<OrderItem>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_ORDER_ITEMS_TABLE_ID,
      queries: [Query.equal('orderId', orderId), Query.limit(100)],
    });
    return response.rows;
  }

  /** Orders placed by this medical store (buyer). */
  async listOrdersForBuyer(buyerId: string): Promise<Order[]> {
    const response = await this.tables.listRows<Order>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_ORDERS_TABLE_ID,
      queries: [
        Query.equal('buyerId', buyerId),
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ],
    });
    return response.rows;
  }

  /** Orders received by this agency (seller). */
  async listOrdersForSeller(sellerId: string): Promise<Order[]> {
    const response = await this.tables.listRows<Order>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_ORDERS_TABLE_ID,
      queries: [
        Query.equal('sellerId', sellerId),
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ],
    });
    return response.rows;
  }

  /**
   * Changes an order's status via the server-side `update-order-status`
   * Function. The Function decides whether the signed-in user (buyer or
   * seller) may make this exact transition, rejects invalid ones, and
   * creates the in-app notification for the other party. The client can no
   * longer write `orders.status` directly.
   */
   async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<Order> {
    const execution = await this.functions.createExecution({
      functionId: APPWRITE_UPDATE_ORDER_STATUS_FUNCTION_ID,
      body: JSON.stringify({ orderId, status }),
      method: ExecutionMethod.POST,
    });

    let parsed: { order?: Order; error?: string } = {};
    try {
      parsed = execution.responseBody
        ? JSON.parse(execution.responseBody)
        : {};
    } catch {
      throw new Error('Unable to update the order. Please try again.');
    }

    if (execution.responseStatusCode >= 400 || !parsed.order) {
      if (!parsed.error) {
        // The Function crashed, timed out or is not deployed/configured: it
        // returned no JSON error of its own. Log what Appwrite recorded so it
        // can be found in Metro, and show a message that names the HTTP code.
        console.warn('[update-order-status] no error body returned', {
          status: execution.status,
          code: execution.responseStatusCode,
          errors: execution.errors,
          logs: execution.logs,
        });
      }
      throw new Error(
        parsed.error ??
          `Unable to update the order (service error ${
            execution.responseStatusCode || execution.status
          }). Please try again.`,
      );
    }

    return parsed.order;
  }
}

const orderService = new OrderService();

export default orderService;
