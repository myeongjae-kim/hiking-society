import { and, desc, eq, isNull } from "drizzle-orm";
import type { ArticleId } from "@/core/article/domain";
import type { CommentId } from "@/core/comment/domain";
import type { DrizzleTransactionRunner } from "#/infrastructure/common/adapter/DrizzleTransactionRunner";
import { applicationError } from "@/core/common/application/ApplicationError";
import { toIsoDateTime, type AuthorName } from "@/core/common/domain";
import { Autowired } from "@/core/config/Autowired";
import type { NotificationCommandPort } from "@/core/notification/application/port/out/NotificationCommandPort";
import type { NotificationQueryPort } from "@/core/notification/application/port/out/NotificationQueryPort";
import type { NotificationId } from "@/core/notification/model/Notification";
import { notificationTable, userTable } from "@/drizzle/schema";

function toNumericId(id: string) {
	const numericId = Number(id);

	if (!Number.isInteger(numericId) || numericId <= 0) {
		throw applicationError.badRequest("잘못된 id입니다.");
	}

	return numericId;
}

function toAuthorName(row: {
	displayName: string | null;
	email: string | null;
	name: string | null;
}) {
	return (row.displayName ?? row.name ?? row.email ?? "회원") as AuthorName;
}

export class NotificationDrizzleAdapter
	implements NotificationCommandPort, NotificationQueryPort
{
	constructor(
		@Autowired("DrizzleTransactionRunner")
		private transactionRunner: DrizzleTransactionRunner,
	) {}

	async createMany(
		input: Parameters<NotificationCommandPort["createMany"]>[0],
	) {
		if (input.notifications.length === 0) {
			return;
		}

		await this.transactionRunner.write(async (tx) => {
			await tx.insert(notificationTable).values(
				input.notifications.map((notification) => ({
					actorUserId: notification.actorUserId,
					articleId: toNumericId(notification.articleId),
					commentId: notification.commentId
						? toNumericId(notification.commentId)
						: null,
					contentExcerpt: notification.contentExcerpt,
					recipientUserId: notification.recipientUserId,
					type: notification.type,
				})),
			);
		});
	}

	async list(input: Parameters<NotificationQueryPort["list"]>[0]) {
		return this.transactionRunner.read(async (tx) => {
			const limit = input.limit ?? 20;
			const offset = input.offset ?? 0;
			const rows = await tx
				.select({
					actorUserId: notificationTable.actorUserId,
					articleId: notificationTable.articleId,
					commentId: notificationTable.commentId,
					contentExcerpt: notificationTable.contentExcerpt,
					createdAt: notificationTable.createdAt,
					displayName: userTable.displayName,
					email: userTable.email,
					id: notificationTable.id,
					name: userTable.name,
					profileImageUrl: userTable.profileImageUrl,
					readAt: notificationTable.readAt,
					type: notificationTable.type,
				})
				.from(notificationTable)
				.innerJoin(userTable, eq(userTable.id, notificationTable.actorUserId))
				.where(eq(notificationTable.recipientUserId, input.currentUserId))
				.orderBy(desc(notificationTable.createdAt))
				.limit(limit + 1)
				.offset(offset);
			const unreadRows = await tx
				.select({ id: notificationTable.id })
				.from(notificationTable)
				.where(
					and(
						eq(notificationTable.recipientUserId, input.currentUserId),
						isNull(notificationTable.readAt),
					),
				)
				.limit(1);

			return {
				hasMoreNotifications: rows.length > limit,
				hasUnreadNotifications: unreadRows.length > 0,
				notifications: rows.slice(0, limit).map((row) => ({
					actorName: toAuthorName(row),
					actorProfileImageUrl: row.profileImageUrl,
					actorUserId: row.actorUserId,
					articleId: String(row.articleId) as ArticleId,
					commentId:
						row.commentId === null
							? null
							: (String(row.commentId) as CommentId),
					contentExcerpt: row.contentExcerpt,
					createdAt: toIsoDateTime(row.createdAt),
					id: String(row.id) as NotificationId,
					readAt: toIsoDateTime(row.readAt),
					type: row.type,
				})),
			};
		});
	}

	async markAllRead(
		input: Parameters<NotificationCommandPort["markAllRead"]>[0],
	) {
		await this.transactionRunner.write(async (tx) => {
			await tx
				.update(notificationTable)
				.set({ readAt: input.now })
				.where(
					and(
						eq(notificationTable.recipientUserId, input.currentUserId),
						isNull(notificationTable.readAt),
					),
				);
		});
	}

	async markRead(input: Parameters<NotificationCommandPort["markRead"]>[0]) {
		await this.transactionRunner.write(async (tx) => {
			await tx
				.update(notificationTable)
				.set({ readAt: input.now })
				.where(
					and(
						eq(notificationTable.id, toNumericId(input.notificationId)),
						eq(notificationTable.recipientUserId, input.currentUserId),
						isNull(notificationTable.readAt),
					),
				);
		});
	}
}
