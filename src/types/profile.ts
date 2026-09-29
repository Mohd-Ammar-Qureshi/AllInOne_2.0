import { Models } from 'appwrite';
import { UserRole } from './user';

export type Profile = Models.Row & {
  userId: string;
  role: UserRole;
  name: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  licenseNumber?: string | null;
  licenseVerified?: boolean | null;
};

export type CreateProfileInput = {
  userId: string;
  role: UserRole;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  licenseNumber?: string;
  licenseVerified?: boolean;
};

export type UpdateProfileInput = Partial<
  Omit<CreateProfileInput, 'userId' | 'role'>
>;
