import { ArticleDetailClient } from "#/society/article/components/ArticleDetailClient";
import type { ArticleViewModel as Article } from "#/society/shared/viewModels";
import type { AuthenticatedUserViewModel as AuthenticatedUser } from "#/society/shared/viewModels";
import type { CommentViewId as CommentId, CommentViewModel as Comment } from "#/society/shared/viewModels";
import type { HikingViewModel as Hiking } from "#/society/shared/viewModels";
import type { NotificationListViewModel as NotificationListSnapshot } from "#/society/shared/viewModels";

type ArticleDetailPageViewProps = {
	article: Article;
	comments: readonly Comment[];
	currentTheme: string;
	currentUser: AuthenticatedUser;
	hiking: Hiking;
	highlightedCommentId: CommentId | null;
	notificationSnapshot: NotificationListSnapshot;
};

export default function ArticleDetailPageView({
	article,
	comments,
	currentTheme,
	currentUser,
	hiking,
	highlightedCommentId,
	notificationSnapshot,
}: ArticleDetailPageViewProps) {
	return (
		<ArticleDetailClient
			article={article}
			comments={comments}
			currentTheme={currentTheme}
			currentUser={currentUser}
			hiking={hiking}
			highlightedCommentId={highlightedCommentId}
			notificationSnapshot={notificationSnapshot}
		/>
	);
}
