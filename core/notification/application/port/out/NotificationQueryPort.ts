import type { NotificationListSnapshot } from '@/core/notification/model/Notification';

export interface NotificationQueryPort {
  list(input: { currentUserId: number; limit?: number }): Promise<NotificationListSnapshot>;
}
