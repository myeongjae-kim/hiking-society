import type { AuthenticatedUserViewModel as AuthenticatedUser } from "#/society/shared/viewModels";
import type { FeedSummaryViewModel as FeedSummarySnapshot } from "#/society/shared/viewModels";
import type { HikingViewId as HikingId } from "#/society/shared/viewModels";
import type { NotificationListViewModel as NotificationListSnapshot } from "#/society/shared/viewModels";
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
