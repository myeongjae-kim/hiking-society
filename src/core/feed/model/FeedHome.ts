import type { AuthenticatedUser } from "@/core/auth/model/AuthenticatedUser";
import type { NotificationListSnapshot } from "@/core/notification/model/Notification";
import type { FeedSummarySnapshot } from "./FeedSnapshot";

export type FeedHomeResult =
	| {
			readonly status: "associate";
			readonly user: AuthenticatedUser;
	  }
	| {
			readonly feedSummary: FeedSummarySnapshot;
			readonly notificationSnapshot: NotificationListSnapshot | null;
			readonly status: "ok";
			readonly user: AuthenticatedUser;
	  };
