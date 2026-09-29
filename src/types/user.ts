export const USER_ROLES = ['medical_store', 'agency'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  medical_store: 'Medical Store',
  agency: 'Agency / Distributor',
};

export const isUserRole = (value: string): value is UserRole =>
  (USER_ROLES as readonly string[]).includes(value);