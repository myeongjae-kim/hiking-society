import type { ArticleViewId as ArticleId, ArticleViewModel as Article } from "#/society/shared/viewModels";
import type { CommentViewModel as Comment } from "#/society/shared/viewModels";
import type { AuthorNameView as AuthorName, IsoDateTimeStringView as IsoDateTimeString } from "#/society/shared/viewModels";
import type { HikingViewModel as Hiking } from "#/society/shared/viewModels";

export type FeedGroup = {
	articles: Article[];
	hiking: Hiking;
};

function compareDateDesc(left: string, right: string) {
	return right.localeCompare(left);
}

function compareNumberDesc(left: number, right: number) {
	return right - left;
}

export function getAuthorName(user: {
	displayName: string | null;
	email: string | null;
	name: string | null;
}) {
	return (user.displayName ?? user.name ?? user.email ?? "회원") as AuthorName;
}

export function getFeedGroups(
	hikings: readonly Hiking[],
	articles: readonly Article[],
): FeedGroup[] {
	return [...hikings]
		.sort((left, right) => compareNumberDesc(left.order, right.order))
		.map((hiking) => ({
			articles: articles
				.filter(
					(article) =>
						article.hikingId === hiking.id && article.deletedAt === null,
				)
				.sort((left, right) =>
					compareDateDesc(left.createdAt, right.createdAt),
				),
			hiking,
		}));
}

export function getCommentsByArticleId(comments: readonly Comment[]) {
	const commentsByArticleId = new Map<ArticleId, Comment[]>();

	for (const comment of comments) {
		const articleComments = commentsByArticleId.get(comment.articleId) ?? [];
		articleComments.push(comment);
		commentsByArticleId.set(comment.articleId, articleComments);
	}

	return commentsByArticleId;
}

export function getArticleComments(
	commentsByArticleId: Map<ArticleId, Comment[]>,
	articleId: ArticleId,
) {
	return [...(commentsByArticleId.get(articleId) ?? [])].sort((left, right) =>
		left.createdAt.localeCompare(right.createdAt),
	);
}

export function isOwn(authorName: AuthorName, currentAuthorName: AuthorName) {
	return authorName === currentAuthorName;
}

export function makeDateTime(date: string, time: string, timezone: string) {
	const offset = timezone === "Asia/Seoul" ? "+09:00" : "";
	return `${date}T${time || "00:00"}:00${offset}` as IsoDateTimeString;
}

export function nowIso() {
	return new Date().toISOString() as IsoDateTimeString;
}
