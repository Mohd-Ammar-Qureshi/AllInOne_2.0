export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type SharedAppParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

/** Customer = medical store. */
export type MedicalStoreStackParamList = SharedAppParamList & {
  Sellers: undefined;
  SellerStore: { sellerId: string; sellerName: string };
  ProductDetail: { productId: string;   sellerId: string; sellerName: string };
  Cart: undefined;
  Checkout: undefined;
  OrderHistory: undefined;
  OrderDetail: { orderId: string };
  Notifications: undefined;
};

/** Seller = medical agency. */
export type AgencyStackParamList = SharedAppParamList & {
  LicenseVerification: undefined;
  Products: undefined;
  ProductForm: { productId?: string } | undefined;
  IncomingOrders: undefined;
  SellerOrderDetail: { orderId: string };
  Notifications: undefined;
};

/**
 * Screens inside the Settings flow. To add a new settings screen:
 * 1. add its name here, 2. register it in routes/SettingsStack.tsx,
 * 3. add a row for it in settings/settingsConfig.ts.
 */
export type SettingsStackParamList = {
  SettingsHome: undefined;
  Account: undefined;
  Security: undefined;
  Notifications: undefined;
  About: undefined;
  Terms: undefined;
  Privacy: undefined;
};