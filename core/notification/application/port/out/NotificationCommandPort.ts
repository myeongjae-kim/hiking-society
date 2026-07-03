import type { NotificationId } from '@/core/notification/model/Notification';

export interface NotificationCommandPort {
  markAllRead(input: { currentUserId: number }): Promise<void>;
  markRead(input: { currentUserId: number; notificationId: NotificationId }): Promise<void>;
}
