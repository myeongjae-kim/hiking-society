import type { NotificationId } from "@/core/notification/model/Notification";
import type { CreateNotificationInput } from "@/core/notification/model/NotificationFactory";

export interface NotificationCommandPort {
	createMany(input: {
		notifications: readonly CreateNotificationInput[];
	}): Promise<void>;
	markAllRead(input: { currentUserId: number }): Promise<void>;
	markRead(input: {
		currentUserId: number;
		notificationId: NotificationId;
	}): Promise<void>;
}
