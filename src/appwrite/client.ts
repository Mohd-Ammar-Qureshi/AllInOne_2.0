import { Client } from 'appwrite';
import Config from 'react-native-config';

export const APPWRITE_ENDPOINT = Config.APPWRITE_ENDPOINT!;
export const APPWRITE_PROJECT_ID = Config.APPWRITE_PROJECT_ID!;

export const appwriteClient = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const APPWRITE_DATABASE_ID = Config.APPWRITE_DATABASE_ID!;
export const APPWRITE_PROFILES_TABLE_ID = Config.APPWRITE_PROFILES_TABLE_ID!;
export const APPWRITE_MEDICAL_PRODUCTS_TABLE_ID = Config.APPWRITE_MEDICAL_PRODUCTS_TABLE_ID!;
export const APPWRITE_ORDERS_TABLE_ID = Config.APPWRITE_ORDERS_TABLE_ID!;
export const APPWRITE_ORDER_ITEMS_TABLE_ID = Config.APPWRITE_ORDER_ITEMS_TABLE_ID!;
export const APPWRITE_NOTIFICATIONS_TABLE_ID = Config.APPWRITE_NOTIFICATIONS_TABLE_ID!;
export const APPWRITE_CREATE_ORDER_FUNCTION_ID = Config.APPWRITE_CREATE_ORDER_FUNCTION_ID!;
export const APPWRITE_UPDATE_ORDER_STATUS_FUNCTION_ID =
  Config.APPWRITE_UPDATE_ORDER_STATUS_FUNCTION_ID ?? 'update-order-status';
export const APPWRITE_PRODUCT_IMAGES_BUCKET_ID = Config.APPWRITE_PRODUCT_IMAGES_BUCKET_ID!;

/**
 * Where the Appwrite verification email links to. Must be reachable by Appwrite's
 * redirect validation (see README / docs/verify-email.html) and must open this
 * app via the deep link registered in AndroidManifest / Info.plist.
 */
export const APPWRITE_VERIFICATION_URL = Config.APPWRITE_VERIFICATION_URL ?? '';
