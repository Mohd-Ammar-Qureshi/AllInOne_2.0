import { Query, TablesDB } from 'appwrite';
import {
  APPWRITE_DATABASE_ID,
  APPWRITE_NOTIFICATIONS_TABLE_ID,
  appwriteClient,
} from './client';
import { AppNotification } from '../types/notification';

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
   * Deletes this user's own already-read notifications older than
   * `olderThanDays` (default 30). Never touches unread notifications —
   * only a read, stale notification is safe to lose silently.
   *
   * This is intentionally opportunistic rather than a scheduled server-side
   * job: it's called (fire-and-forget, never awaited) whenever a user opens
   * their notification inbox, which is enough to keep the table from
   * growing unbounded per user without adding a new Appwrite Function,
   * schedule, or Console setup. Every failure here is swallowed — pruning
   * must never surface an error or block the inbox from loading.
   */
  async pruneOldNotifications(
    userId: string,
    olderThanDays = 30,
  ): Promise<void> {
    try {
      const cutoff = new Date(
        Date.now() - olderThanDays * 24 * 60 * 60 * 1000,
      ).toISOString();

      const response = await this.tables.listRows<AppNotification>({
        databaseId: APPWRITE_DATABASE_ID,
        tableId: APPWRITE_NOTIFICATIONS_TABLE_ID,
        queries: [
          Query.equal('userId', userId),
          Query.equal('read', true),
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