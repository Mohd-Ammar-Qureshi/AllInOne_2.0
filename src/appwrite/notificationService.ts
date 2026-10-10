import { Query, TablesDB } from 'appwrite';
import {
  APPWRITE_DATABASE_ID,
  APPWRITE_NOTIFICATIONS_TABLE_ID,
  appwriteClient,
} from './client';
import { AppNotification } from '../types/notification';

/**
 * How long a notification stays before it expires (measured from its
 * `$createdAt`, read or unread). Change this one number to change the expiry.
 */
export const NOTIFICATION_EXPIRY_DAYS = 30;

const expiryCutoffIso = (days = NOTIFICATION_EXPIRY_DAYS): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

class NotificationService {
  private tables: TablesDB;

  constructor() {
    this.tables = new TablesDB(appwriteClient);
  }

  // Notifications are created server-side (create-order and
  // update-order-status Functions), because a client session cannot grant a
  // read permission to a different user. The app only reads and updates the
  // recipient's own notifications.

  /** All notifications for this user (buyer or seller), most recent first. */
  async listForUser(userId: string): Promise<AppNotification[]> {
    const response = await this.tables.listRows<AppNotification>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_NOTIFICATIONS_TABLE_ID,
      queries: [
        Query.equal('userId', userId),
        Query.greaterThan('$createdAt', expiryCutoffIso()),
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ],
    });
    return response.rows;
  }

  /** Count of unread notifications, for a header badge. */
  async countUnread(userId: string): Promise<number> {
    const response = await this.tables.listRows<AppNotification>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_NOTIFICATIONS_TABLE_ID,
      queries: [
        Query.equal('userId', userId),
        Query.equal('read', false),
        Query.greaterThan('$createdAt', expiryCutoffIso()),
        Query.limit(100),
      ],
    });
    return response.total;
  }

  async markAsRead(notificationId: string): Promise<AppNotification> {
    return this.tables.updateRow<AppNotification>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_NOTIFICATIONS_TABLE_ID,
      rowId: notificationId,
      data: { read: true },
    });
  }

  /**
   * Deletes one notification. Only the recipient can do this: the Functions
   * create every row with delete permission for that user alone, so Appwrite
   * rejects (401) a delete of anyone else's notification.
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await this.tables.deleteRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_NOTIFICATIONS_TABLE_ID,
      rowId: notificationId,
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const response = await this.tables.listRows<AppNotification>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_NOTIFICATIONS_TABLE_ID,
      queries: [
        Query.equal('userId', userId),
        Query.equal('read', false),
        Query.limit(100),
      ],
    });

    await Promise.all(
      response.rows.map(notification =>
        this.tables.updateRow<AppNotification>({
          databaseId: APPWRITE_DATABASE_ID,
          tableId: APPWRITE_NOTIFICATIONS_TABLE_ID,
          rowId: notification.$id,
          data: { read: true },
        }),
      ),
    );
  }
  /**
   * Deletes this user's own expired notifications (older than
   * NOTIFICATION_EXPIRY_DAYS, read or unread). The list/count queries already
   * hide expired rows; this just removes them from the table.
   *
   * Opportunistic rather than a scheduled job: called fire-and-forget when a
   * user opens their inbox, so no new Function or schedule is needed. Every
   * failure is swallowed - pruning must never block the inbox.
   */
  async pruneOldNotifications(
    userId: string,
    olderThanDays = NOTIFICATION_EXPIRY_DAYS,
  ): Promise<void> {
    try {
      const cutoff = expiryCutoffIso(olderThanDays);

      const response = await this.tables.listRows<AppNotification>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: APPWRITE_NOTIFICATIONS_TABLE_ID,
        queries: [
          Query.equal('userId', userId),
          Query.lessThan('$createdAt', cutoff),
          Query.limit(100),
        ],
      });

      if (response.rows.length === 0) {
        return;
      }

      await Promise.allSettled(
        response.rows.map(notification =>
          this.tables.deleteRow({
            databaseId: APPWRITE_DATABASE_ID,
            tableId: APPWRITE_NOTIFICATIONS_TABLE_ID,
            rowId: notification.$id,
          }),
        ),
      );
    } catch {
      // Non-fatal — see doc comment above.
    }
  }

}

const notificationService = new NotificationService();

export default notificationService;