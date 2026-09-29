import { ID, Permission, Query, Role, TablesDB } from 'appwrite';
import {
  APPWRITE_DATABASE_ID,
  APPWRITE_MEDICAL_PRODUCTS_TABLE_ID,
  appwriteClient,
} from './client';
import {
  CreateProductInput,
  Product,
  UpdateProductInput,
} from '../types/product';

class ProductService {
  private tables: TablesDB;

  constructor() {
    this.tables = new TablesDB(appwriteClient);
  }

  private ownerPermissions(sellerId: string): string[] {
    return [
      // Every signed-in medical store must be able to browse the catalog.
      Permission.read(Role.users()),
      Permission.update(Role.user(sellerId)),
      Permission.delete(Role.user(sellerId)),
    ];
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    return this.tables.createRow<Product>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_MEDICAL_PRODUCTS_TABLE_ID,
      rowId: ID.unique(),
      data: {
        sellerId: input.sellerId,
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        unit: input.unit ?? null,
        stock: input.stock,
        imageUrl: input.imageUrl ?? null,
        status: input.status ?? 'active',
      },
      permissions: this.ownerPermissions(input.sellerId),
    });
  }

  async updateProduct(
    productId: string,
    data: UpdateProductInput,
  ): Promise<Product> {
    return this.tables.updateRow<Product>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_MEDICAL_PRODUCTS_TABLE_ID,
      rowId: productId,
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description || null }
          : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.unit !== undefined ? { unit: data.unit || null } : {}),
        ...(data.stock !== undefined ? { stock: data.stock } : {}),
        ...(data.imageUrl !== undefined
          ? { imageUrl: data.imageUrl || null }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });
  }

  async deleteProduct(productId: string): Promise<void> {
    await this.tables.deleteRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_MEDICAL_PRODUCTS_TABLE_ID,
      rowId: productId,
    });
  }

  async getProduct(productId: string): Promise<Product> {
    return this.tables.getRow<Product>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_MEDICAL_PRODUCTS_TABLE_ID,
      rowId: productId,
    });
  }

  /** Every product owned by this seller, any status — seller's own management list. */
  async listSellerProducts(sellerId: string): Promise<Product[]> {
    const response = await this.tables.listRows<Product>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_MEDICAL_PRODUCTS_TABLE_ID,
      queries: [
        Query.equal('sellerId', sellerId),
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ],
    });
    return response.rows;
  }

  /** Only active, in-catalog products from one seller — customer-facing store view. */
  async listActiveProductsBySeller(sellerId: string): Promise<Product[]> {
    const response = await this.tables.listRows<Product>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_MEDICAL_PRODUCTS_TABLE_ID,
      queries: [
        Query.equal('sellerId', sellerId),
        Query.equal('status', 'active'),
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ],
    });
    return response.rows;
  }
  async listActiveProducts(): Promise<Product[]> {
  const response = await this.tables.listRows<Product>({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: APPWRITE_MEDICAL_PRODUCTS_TABLE_ID,
    queries: [
      Query.equal('status', 'active'),
      Query.orderDesc('$createdAt'),
      Query.limit(100),
    ],
  });

  return response.rows;
}
}

const productService = new ProductService();

export default productService;