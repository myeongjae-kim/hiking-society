export interface MarkAllNotificationsReadUseCase {
  markAllRead(input: { currentUserId: number }): Promise<void>;
}
