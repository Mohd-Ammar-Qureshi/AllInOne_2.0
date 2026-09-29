import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Models } from 'appwrite';
import authService from './authService';
import profileService from './profileService';
import { Profile, UpdateProfileInput } from '../types/profile';
import { UserRole } from '../types/user';

type RegisterInput = {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

type AppwriteContextType = {
  isLoggedIn: boolean;
  user: Models.User<Models.Preferences> | null;
  profile: Profile | null;
  role: UserRole | null;
  setIsLoggedIn: (value: boolean) => void;
  setUser: (user: Models.User<Models.Preferences> | null) => void;
  setProfile: (profile: Profile | null) => void;
  login: (email: string, password: string) => Promise<Profile>;
  register: (input: RegisterInput) => Promise<Profile>;
  logout: () => Promise<boolean>;
  refreshProfile: () => Promise<Profile | null>;
  updateProfile: (data: UpdateProfileInput) => Promise<Profile>;
  getCurrentUser: typeof authService.getCurrentUser;
};

const AppwriteContext = createContext<AppwriteContextType | undefined>(
  undefined,
);
const getCurrentUser = authService.getCurrentUser.bind(authService);

export const AppwriteProvider = ({ children }: PropsWithChildren) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null,
  );
  const [profile, setProfile] = useState<Profile | null>(null);

  const clearSessionState = useCallback(() => {
    setIsLoggedIn(false);
    setUser(null);
    setProfile(null);
  }, []);

  const loadProfileForUser = useCallback(async (userId: string) => {
    const existingProfile = await profileService.getProfileByUserId(userId);
    if (!existingProfile) {
      throw new Error(
        'No profile found for this account. Please complete registration again or contact support.',
      );
    }
    setProfile(existingProfile);
    return existingProfile;
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      await authService.login({ email, password });
      const currentUser = await authService.getCurrentUser();

      if (!currentUser) {
        throw new Error('Unable to load user after login.');
      }

      const userProfile = await loadProfileForUser(currentUser.$id);
      setUser(currentUser);
      setIsLoggedIn(true);
      return userProfile;
    },
    [loadProfileForUser],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const account = await authService.createAccount({
        email: input.email,
        password: input.password,
        name: input.name,
      });

      await authService.login({
        email: input.email,
        password: input.password,
      });

      const userProfile = await profileService.createProfile({
        userId: account.$id,
        role: input.role,
        name: input.name.trim(),
        phone: input.phone?.trim(),
        address: input.address?.trim(),
        city: input.city?.trim(),
        state: input.state?.trim(),
        pincode: input.pincode?.trim(),
        licenseVerified: false,
      });

      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setProfile(userProfile);
      setIsLoggedIn(true);
      return userProfile;
    },
    [],
  );

  const logout = useCallback(async () => {
    const success = await authService.logout();
    if (success) {
      clearSessionState();
    }
    return success;
  }, [clearSessionState]);

  const refreshProfile = useCallback(async () => {
    if (!user?.$id) {
      return null;
    }

    const latest = await loadProfileForUser(user.$id);
    return latest;
  }, [loadProfileForUser, user?.$id]);

  const updateProfile = useCallback(
    async (data: UpdateProfileInput) => {
      if (!profile?.$id) {
        throw new Error('No profile loaded.');
      }

      const updated = await profileService.updateProfile(profile.$id, data);
      setProfile(updated);
      return updated;
    },
    [profile?.$id],
  );

  const value = useMemo<AppwriteContextType>(
    () => ({
      isLoggedIn,
      user,
      profile,
      role: profile?.role ?? null,
      setIsLoggedIn,
      setUser,
      setProfile,
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
      getCurrentUser,
    }),
    [
      isLoggedIn,
      user,
      profile,
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
    ],
  );

  return (
    <AppwriteContext.Provider value={value}>{children}</AppwriteContext.Provider>
  );
};

export const useAppwrite = (): AppwriteContextType => {
  const context = useContext(AppwriteContext);

  if (!context) {
    throw new Error('useAppwrite must be used within AppwriteProvider');
  }

  return context;
};

export default AppwriteContext;
