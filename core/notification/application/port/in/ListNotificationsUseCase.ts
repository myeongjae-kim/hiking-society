import type { NotificationListSnapshot } from '@/core/notification/model/Notification';

export interface ListNotificationsUseCase {
  list(input: {
    currentUserId: number;
    limit?: number;
    offset?: number;
  }): Promise<NotificationListSnapshot>;
}
