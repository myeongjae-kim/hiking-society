import type { AuthenticatedUser } from "@/core/auth/model/AuthenticatedUser";
import type { FeedSummarySnapshot } from "@/core/feed/model/FeedSnapshot";
import type { HikingId } from "@/core/hiking/domain";
import type { NotificationListSnapshot } from "@/core/notification/model/Notification";
import { AssociateFeedNotice } from "./components/AssociateFeedNotice";
import { FeedCrudClient } from "./components/FeedCrudClient";

type FeedPageViewProps = {
	currentTheme: string;
	feedSummary: FeedSummarySnapshot | null;
	notificationSnapshot: NotificationListSnapshot | null;
	selectedHikingId: HikingId | null;
	user: AuthenticatedUser;
};

export default function FeedPageView({
	currentTheme,
	feedSummary,
	notificationSnapshot,
	selectedHikingId,
	user,
}: FeedPageViewProps) {
	if (user.role === "associate") {
		return <AssociateFeedNotice user={user} />;
	}

	if (!feedSummary || !notificationSnapshot) {
		return null;
	}

	return (
		<FeedCrudClient
			articleCount={feedSummary.articleCount}
			commentCount={feedSummary.commentCount}
			currentTheme={currentTheme}
			currentUser={user}
			hikingArticleCounts={feedSummary.hikingArticleCounts}
			hikings={feedSummary.hikings}
			notificationSnapshot={notificationSnapshot}
			selectedHikingId={selectedHikingId}
		/>
	);
}
