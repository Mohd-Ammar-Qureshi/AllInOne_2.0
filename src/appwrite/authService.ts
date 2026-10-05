import { Account, ID, Models } from 'appwrite';
import { appwriteClient } from './client';

type CreateUserAccount = {
  email: string;
  password: string;
  name: string;
};

type LoginUserAccount = {
  email: string;
  password: string;
};

class AuthService {
  private account: Account;

  constructor() {
    this.account = new Account(appwriteClient);
  }

  async createAccount({ email, password, name }: CreateUserAccount) {
    return this.account.create({
      userId: ID.unique(),
      email,
      password,
      name,
    });
  }

  async login({ email, password }: LoginUserAccount) {
    return this.account.createEmailPasswordSession({ email, password });
  }

  async getCurrentUser(): Promise<Models.User<Models.Preferences> | null> {
    try {
      return await this.account.get();
    } catch {
      return null;
    }
  }

  /**
   * Like getCurrentUser, but lets errors through so callers can tell a dead
   * session (401) apart from a network failure.
   */
  async getAccount(): Promise<Models.User<Models.Preferences>> {
    return this.account.get();
  }

  // ---- Email verification -------------------------------------------------

  async sendEmailVerification(url: string): Promise<Models.Token> {
    return this.account.createEmailVerification({ url });
  }

  async confirmEmailVerification(
    userId: string,
    secret: string,
  ): Promise<Models.Token> {
    return this.account.updateEmailVerification({ userId, secret });
  }

  /** Appwrite resets `emailVerification` to false when the email changes. */
  async changeEmail(
    email: string,
    password: string,
  ): Promise<Models.User<Models.Preferences>> {
    return this.account.updateEmail({ email, password });
  }

  async updatePassword(
    newPassword: string,
    currentPassword: string,
  ): Promise<Models.User<Models.Preferences>> {
    return this.account.updatePassword({
      password: newPassword,
      oldPassword: currentPassword,
    });
  }

  async logout(): Promise<boolean> {
    try {
      await this.account.deleteSession({ sessionId: 'current' });
      return true;
    } catch {
      return false;
    }
  }
}

const authService = new AuthService();

export default authService;
