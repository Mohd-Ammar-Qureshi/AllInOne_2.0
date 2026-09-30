import { Permission, Query, Role, TablesDB } from 'appwrite';
import {
  APPWRITE_DATABASE_ID,
  APPWRITE_PROFILES_TABLE_ID,
  appwriteClient,
} from './client';
import {
  CreateProfileInput,
  Profile,
  UpdateProfileInput,
} from '../types/profile';
import { isUserRole } from '../types/user';

const isConflictError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  (error as { code?: number }).code === 409;

class ProfileService {
  private tables: TablesDB;

  constructor() {
    this.tables = new TablesDB(appwriteClient);
  }

  private mapRow(row: Profile): Profile {
    if (!isUserRole(row.role)) {
      throw new Error(`Invalid profile role: ${row.role}`);
    }

    return {
      ...row,
      licenseVerified: Boolean(row.licenseVerified),
    };
  }

  private ownerPermissions(userId: string, role: Profile['role']): string[] {
    const permissions = [
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ];

    // Sellers must be discoverable by every signed-in customer; buyers'
    // profiles stay private to themselves.
    permissions.push(
      role === 'agency'
        ? Permission.read(Role.users())
        : Permission.read(Role.user(userId)),
    );

    return permissions;
  }

  async createProfile(input: CreateProfileInput): Promise<Profile> {
    try {
      const row = await this.tables.createRow<Profile>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: APPWRITE_PROFILES_TABLE_ID,
        rowId: input.userId,
        data: {
          userId: input.userId,
          role: input.role,
          name: input.name,
          phone: input.phone ?? null,
          address: input.address ?? null,
          city: input.city ?? null,
          state: input.state ?? null,
          pincode: input.pincode ?? null,
          licenseNumber: input.licenseNumber ?? null,
          licenseVerified: input.licenseVerified ?? false,
        },
        permissions: this.ownerPermissions(input.userId, input.role),
      });

      return this.mapRow(row);
    } catch (error) {
      if (isConflictError(error)) {
        const existing = await this.getProfileByUserId(input.userId);
        if (existing) {
          return existing;
        }
      }
      throw error;
    }
  }

  async getProfileByUserId(userId: string): Promise<Profile | null> {
    const response = await this.tables.listRows<Profile>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_PROFILES_TABLE_ID,
      queries: [
        Query.equal('userId', userId),
        Query.orderAsc('$createdAt'),
        Query.limit(1),
      ],
    });

    const row = response.rows[0];
    return row ? this.mapRow(row) : null;
  }

  async updateProfile(
    profileId: string,
    data: UpdateProfileInput,
  ): Promise<Profile> {
    const row = await this.tables.updateRow<Profile>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_PROFILES_TABLE_ID,
      rowId: profileId,
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
        ...(data.address !== undefined
          ? { address: data.address || null }
          : {}),
        ...(data.city !== undefined ? { city: data.city || null } : {}),
        ...(data.state !== undefined ? { state: data.state || null } : {}),
        ...(data.pincode !== undefined
          ? { pincode: data.pincode || null }
          : {}),
        ...(data.licenseNumber !== undefined
          ? { licenseNumber: data.licenseNumber || null }
          : {}),
      },
    });

    return this.mapRow(row);
  }

  /** Verified sellers a customer can discover and buy from. */
  async listVerifiedSellers(): Promise<Profile[]> {
    const response = await this.tables.listRows<Profile>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_PROFILES_TABLE_ID,
      queries: [
        Query.equal('role', 'agency'),
        Query.equal('licenseVerified', true),
        Query.orderAsc('name'),
        Query.limit(100),
      ],
    });
    return response.rows.map(row => this.mapRow(row));
  }
}

const profileService = new ProfileService();

export default profileService;