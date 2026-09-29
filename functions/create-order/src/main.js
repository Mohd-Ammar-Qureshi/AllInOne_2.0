import { Client, TablesDB, ID, Permission, Query, Role } from 'node-appwrite';

/**
 * Secure server-side order creation for AllInOne.
 *
 * Why this exists: a buyer's client session can only grant Appwrite
 * document permissions for roles it itself holds (any, users, or its own
 * user:<id>) — it can never grant a permission naming a *different* user
 * (the seller). Only a server-side API key can do that. This Function runs
 * with an API key, so it can create the order with precise
 * buyer-only + seller-only read/update permissions.
 *
 * Security model:
 * - buyerId is taken ONLY from Appwrite's own `x-appwrite-user-id` header,
 *   which Appwrite sets from the caller's real session and cannot be
 *   spoofed by the client. The request body's buyerId (if any) is ignored.
 * - Every product is re-fetched from the database and its price/name/unit
 *   and sellerId ownership are verified server-side — the client only ever
 *   sends { productId, quantity }, never price or product name.
 * - The seller must be a real, verified 'agency' profile.
 */

const required = (value, name) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new HttpError(400, `${name} is required.`);
  }
  return value;
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export default async ({ req, res, log, error }) => {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const profilesTableId = process.env.APPWRITE_PROFILES_TABLE_ID;
  const productsTableId = process.env.APPWRITE_MEDICAL_PRODUCTS_TABLE_ID;
  const ordersTableId = process.env.APPWRITE_ORDERS_TABLE_ID;
  const orderItemsTableId = process.env.APPWRITE_ORDER_ITEMS_TABLE_ID;

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);
  const tables = new TablesDB(client);

  const createdItemIds = [];
  let createdOrderId = null;

  try {
    // 1 & 2. Identify + verify the authenticated caller. This header is set
    // by Appwrite itself from the real session that invoked this execution
    // — the client cannot forge it.
    const buyerId = req.headers['x-appwrite-user-id'];
    if (!buyerId) {
      throw new HttpError(401, 'You must be signed in to place an order.');
    }

    // 3. Accept checkout data from the app.
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
      throw new HttpError(400, 'Invalid request body.');
    }
    if (!body) {
      throw new HttpError(400, 'Invalid request body.');
    }

    const sellerId = required(body.sellerId, 'sellerId');
    const address = required(body.address, 'address');
    const city = required(body.city, 'city');
    const state = required(body.state, 'state');
    const pincode = required(body.pincode, 'pincode');
    const phone = required(body.phone, 'phone');
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (rawItems.length === 0) {
      throw new HttpError(400, 'Your order must contain at least one item.');
    }
    for (const item of rawItems) {
      if (!item || !item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new HttpError(400, 'Each item needs a valid productId and quantity.');
      }
    }

    // Buyer must be a real medical store — profile $id === userId.
    let buyerProfile;
    try {
      buyerProfile = await tables.getRow({
        databaseId,
        tableId: profilesTableId,
        rowId: buyerId,
      });
    } catch {
      throw new HttpError(403, 'No buyer profile found for this account.');
    }
    if (buyerProfile.role !== 'medical_store') {
      throw new HttpError(403, 'Only medical stores can place orders.');
    }

    // 4 & 5. Validate the seller server-side rather than trusting the client.
    let sellerProfile;
    try {
      sellerProfile = await tables.getRow({
        databaseId,
        tableId: profilesTableId,
        rowId: sellerId,
      });
    } catch {
      throw new HttpError(400, 'Selected seller could not be found.');
    }
    if (sellerProfile.role !== 'agency' || !sellerProfile.licenseVerified) {
      throw new HttpError(400, 'Selected seller is not a verified agency.');
    }

    // Re-fetch every product; verify it truly belongs to this seller.
    // Price/name/unit come from the database, never from the client.
    const items = [];
    for (const raw of rawItems) {
      let product;
      try {
        product = await tables.getRow({
          databaseId,
          tableId: productsTableId,
          rowId: raw.productId,
        });
      } catch {
        throw new HttpError(400, `Product ${raw.productId} could not be found.`);
      }
      if (product.sellerId !== sellerId) {
        throw new HttpError(
          400,
          'One or more products do not belong to the selected seller.',
        );
      }
      if (product.status !== 'active') {
        throw new HttpError(
          400,
          `"${product.name}" is not available for ordering right now.`,
        );
      }
      if (product.stock < raw.quantity) {
        throw new HttpError(
          400,
          `Only ${product.stock} of "${product.name}" left in stock.`,
        );
      }
      items.push({
        productId: product.$id,
        productName: product.name,
        price: product.price,
        unit: product.unit || undefined,
        quantity: raw.quantity,
        subtotal: product.price * raw.quantity,
      });
    }

    // 6. Totals computed server-side.
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    // 10. Precise permissions — only possible because this runs with an
    // API key, not a user session.
    // Read-only for both parties: order status is changed only by the
    // update-order-status Function, so neither client can edit the row.
    const permissions = [
      Permission.read(Role.user(buyerId)),
      Permission.read(Role.user(sellerId)),
    ];

    // 7. Create the order.
    const order = await tables.createRow({
      databaseId,
      tableId: ordersTableId,
      rowId: ID.unique(),
      data: {
        buyerId,
        buyerName: buyerProfile.name,
        sellerId,
        sellerName: sellerProfile.name,
        status: 'pending',
        totalAmount,
        itemCount,
        address,
        city,
        state,
        pincode,
        phone,
        notes: notes || null,
        deliverySnapshot: '',
      },
      permissions,
    });
    createdOrderId = order.$id;

    // 9. Create order_items. If any fails, roll back what we created and
    // return an error — never leave a half-written order in place.
    const createdItems = [];
    try {
      for (const item of items) {
        const itemData = {
          orderId: order.$id,
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          ...(item.unit ? { unit: item.unit } : {}),
          quantity: item.quantity,
          subtotal: item.subtotal,
        };

        const createItemRow = data =>
          tables.createRow({
            databaseId,
            tableId: orderItemsTableId,
            rowId: ID.unique(),
            data,
            permissions,
          });

        let row;
        try {
          row = await createItemRow(itemData);
        } catch (firstErr) {
          // Only if the order_items table has a REQUIRED sellerId column.
          if (!/sellerId/i.test(String(firstErr.message))) {
            throw firstErr;
          }
          row = await createItemRow({ ...itemData, sellerId });
        }

        log(`Order item created: ${row.$id}`);
        createdItems.push(row);
        createdItemIds.push(row.$id);
      }
    } catch (itemErr) {
  error(`ORDER_ITEMS ERROR: ${JSON.stringify(itemErr)}`);
  error(itemErr.message);

  await rollback(tables, {
    databaseId,
    ordersTableId,
    orderItemsTableId,
    orderId: createdOrderId,
    itemIds: createdItemIds,
  });

  throw new HttpError(
    500,
    'Unable to create your order items. No order was placed.',
  );
}

    // 10b. Best-effort "new order" notification for the seller. Created
    // here (API key) because a buyer's session cannot grant a permission to
    // the seller. Never fails the order.
    try {
      const orderRef = order.$id.slice(-6).toUpperCase();
      await tables.createRow({
        databaseId,
        tableId: process.env.APPWRITE_NOTIFICATIONS_TABLE_ID,
        rowId: ID.unique(),
        data: {
          userId: sellerId,
          orderId: order.$id,
          orderRef,
          status: 'pending',
          message: `New order #${orderRef} from ${buyerProfile.name} (${itemCount} item${itemCount === 1 ? '' : 's'}).`,
          read: false,
        },
        permissions: [
          Permission.read(Role.user(sellerId)),
          Permission.update(Role.user(sellerId)),
          Permission.delete(Role.user(sellerId)),
        ],
      });
    } catch (notifyErr) {
      error(`Seller notification failed: ${notifyErr.message ?? String(notifyErr)}`);
    }

    // 11. Best-effort stock decrement — same non-fatal behavior as before.
    // A failure here must not fail the already-successful order.
    await Promise.allSettled(
      items.map(async item => {
        const product = await tables.getRow({
          databaseId,
          tableId: productsTableId,
          rowId: item.productId,
        });
        const nextStock = Math.max(0, product.stock - item.quantity);
        await tables.updateRow({
          databaseId,
          tableId: productsTableId,
          rowId: item.productId,
          data: {
            stock: nextStock,
            status: nextStock === 0 ? 'out_of_stock' : product.status,
          },
        });
      }),
    );

    log(`Order ${order.$id} created for buyer ${buyerId}, seller ${sellerId}`);

    // 12. Return the created order to the app.
    return res.json({ order, items: createdItems });
  } catch (err) {
    error(err.message ?? String(err));
    const status = err instanceof HttpError ? err.status : 500;
    return res.json({ error: err.message ?? 'Unable to place order.' }, status);
  }
};

async function rollback(tables, { databaseId, ordersTableId, orderItemsTableId, orderId, itemIds }) {
  await Promise.allSettled(
    itemIds.map(id =>
      tables.deleteRow({ databaseId, tableId: orderItemsTableId, rowId: id }),
    ),
  );
  if (orderId) {
    await Promise.allSettled([
      tables.deleteRow({ databaseId, tableId: ordersTableId, rowId: orderId }),
    ]);
  }
}