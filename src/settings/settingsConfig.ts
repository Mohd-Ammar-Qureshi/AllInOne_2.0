import type { ComponentProps } from 'react';
import type MaterialIcons from '@react-native-vector-icons/material-icons';
import { SettingsStackParamList } from '../types/navigation';
import { UserRole } from '../types/user';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

/* -------------------------------------------------------------------------- */
/* Account types                                                              */
/* -------------------------------------------------------------------------- */

export const ACCOUNT_TYPE_LABELS: Record<UserRole, string> = {
  medical_store: 'Buyer',
  agency: 'Seller',
};

export const ACCOUNT_TYPE_DESCRIPTIONS: Record<UserRole, string> = {
  medical_store:
    'You buy medicines and supplies for your medical store from verified agencies.',
  agency:
    'You sell products to medical stores. A one-time licence verification is required before selling.',
};

/* -------------------------------------------------------------------------- */
/* Settings menu                                                              */
/* -------------------------------------------------------------------------- */

/** Opens a screen inside the Settings stack. */
type LinkItem = {
  kind: 'link';
  id: string;
  title: string;
  icon: IconName;
  screen: keyof SettingsStackParamList;
};

/** Opens a screen that lives in the parent (role) stack. */
type AppLinkItem = {
  kind: 'appLink';
  id: string;
  title: string;
  icon: IconName;
  screen: 'Profile' | 'LicenseVerification';
};

/** Inline Light / Dark / System selector. */
type AppearanceItem = { kind: 'appearance'; id: string };

/** Opens the language picker sheet. */
type LanguageItem = {
  kind: 'language';
  id: string;
  title: string;
  icon: IconName;
};

export type SettingsItem =
  | LinkItem
  | AppLinkItem
  | AppearanceItem
  | LanguageItem;

export type SettingsSectionConfig = {
  id: string;
  title: string;
  items: SettingsItem[];
};

/**
 * The whole Settings menu lives here. To add or remove an option, edit this
 * list; SettingsScreen renders whatever it returns. Options can differ by
 * role (buyer / seller).
 */
export const getSettingsSections = (
  role: UserRole | null,
): SettingsSectionConfig[] => {
  const accountItems: SettingsItem[] = [
    {
      kind: 'appLink',
      id: 'profile',
      title: 'Edit profile',
      icon: 'person',
      screen: 'Profile',
    },
  ];

  // Only sellers verify a licence today.
  if (role === 'agency') {
    accountItems.push({
      kind: 'appLink',
      id: 'licence',
      title: 'Licence details',
      icon: 'badge',
      screen: 'LicenseVerification',
    });
  }

  accountItems.push(
    {
      kind: 'link',
      id: 'account',
      title: 'Account type',
      icon: 'account-circle',
      screen: 'Account',
    },
    {
      kind: 'link',
      id: 'security',
      title: 'Security',
      icon: 'lock',
      screen: 'Security',
    },
  );

  return [
    { id: 'account', title: 'Account', items: accountItems },
    {
      id: 'preferences',
      title: 'Preferences',
      items: [
        {
          kind: 'link',
          id: 'notifications',
          title: 'Notifications',
          icon: 'notifications',
          screen: 'Notifications',
        },
        { kind: 'appearance', id: 'appearance' },
        {
          kind: 'language',
          id: 'language',
          title: 'Language',
          icon: 'language',
        },
      ],
    },
    {
      id: 'about',
      title: 'About',
      items: [
        {
          kind: 'link',
          id: 'about',
          title: 'About AllInOne',
          icon: 'info',
          screen: 'About',
        },
        {
          kind: 'link',
          id: 'terms',
          title: 'Terms & Conditions',
          icon: 'description',
          screen: 'Terms',
        },
        {
          kind: 'link',
          id: 'privacy',
          title: 'Privacy Policy',
          icon: 'privacy-tip',
          screen: 'Privacy',
        },
      ],
    },
  ];
};

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

export type NotificationOption = {
  id: string;
  title: string;
  description: string;
  defaultEnabled: boolean;
};

const COMMON_NOTIFICATIONS: NotificationOption[] = [
  {
    id: 'account_alerts',
    title: 'Account & security alerts',
    description: 'Sign-in and password changes on your account.',
    defaultEnabled: true,
  },
];

const ROLE_NOTIFICATIONS: Record<UserRole, NotificationOption[]> = {
  medical_store: [
    {
      id: 'order_updates',
      title: 'Order updates',
      description: 'When an agency confirms, packs or cancels your order.',
      defaultEnabled: true,
    },
    {
      id: 'delivery_updates',
      title: 'Delivery updates',
      description: 'When your order is on the way or delivered.',
      defaultEnabled: true,
    },
    {
      id: 'offers',
      title: 'Offers & announcements',
      description: 'New products and deals from agencies.',
      defaultEnabled: false,
    },
  ],
  agency: [
    {
      id: 'new_orders',
      title: 'New orders',
      description: 'When a medical store places an order with you.',
      defaultEnabled: true,
    },
    {
      id: 'low_stock',
      title: 'Low stock alerts',
      description: 'When a product is about to run out.',
      defaultEnabled: true,
    },
    {
      id: 'licence_updates',
      title: 'Licence updates',
      description: 'Changes to your licence verification status.',
      defaultEnabled: true,
    },
  ],
};

export const getNotificationOptions = (
  role: UserRole | null,
): NotificationOption[] => [
  ...(role ? ROLE_NOTIFICATIONS[role] : []),
  ...COMMON_NOTIFICATIONS,
];

/* -------------------------------------------------------------------------- */
/* Languages                                                                  */
/* -------------------------------------------------------------------------- */

export type LanguageCode = 'en' | 'hi' | 'mr';

export type LanguageOption = {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  /** false = listed but not selectable until translations exist. */
  available: boolean;
};

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', available: true },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', available: false },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', available: false },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export const getLanguageLabel = (code: LanguageCode): string =>
  LANGUAGES.find(language => language.code === code)?.label ?? 'English';