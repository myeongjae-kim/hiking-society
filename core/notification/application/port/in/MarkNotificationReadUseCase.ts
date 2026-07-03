import type { NotificationId } from '@/core/notification/model/Notification';

export interface MarkNotificationReadUseCase {
  markRead(input: { currentUserId: number; notificationId: NotificationId }): Promise<void>;
}
