import type { NotificationListSnapshot } from "@/core/notification/model/Notification";
import type { ArticleDetailSnapshot } from "./ArticleDetailSnapshot";

export type ArticlePageResult =
	| {
			readonly status: "associate";
	  }
	| {
			readonly status: "notFound";
	  }
	| {
			readonly notificationSnapshot: NotificationListSnapshot | null;
			readonly snapshot: ArticleDetailSnapshot;
			readonly status: "ok";
	  };
