import { and, eq, isNull } from "drizzle-orm";
import type { DrizzleTransactionRunner } from "@/core/common/adapter/drizzle.server";
import { Autowired } from "@/core/config/Autowired";
import { socialAccountTable, userTable } from "@/drizzle/schema";
import type { AuthQueryPort } from "../application/port/out/AuthQueryPort";
import type { AuthenticatedUser } from "../model/AuthenticatedUser";
import type { SessionSnapshot } from "../model/SessionSnapshot";

export class AuthQueryAdapter implements AuthQueryPort {
	constructor(
		@Autowired("DrizzleTransactionRunner")
		private transactionRunner: DrizzleTransactionRunner,
	) {}

	async getSessionSnapshotByUserId(
		userId: number,
	): Promise<SessionSnapshot | null> {
		const [row] = await this.transactionRunner.read(async (tx) =>
			tx
				.select({
					email: userTable.email,
					provider: socialAccountTable.provider,
					role: userTable.role,
					userId: userTable.id,
				})
				.from(userTable)
				.leftJoin(
					socialAccountTable,
					and(
						eq(socialAccountTable.userId, userTable.id),
						isNull(socialAccountTable.deletedAt),
					),
				)
				.where(and(eq(userTable.id, userId), isNull(userTable.deletedAt)))
				.limit(1),
		);

		if (!row?.email || !row.provider) {
			return null;
		}

		return {
			email: row.email,
			provider: row.provider,
			role: row.role,
			userId: row.userId,
		};
	}

	async getUserByUserId(userId: number): Promise<AuthenticatedUser | null> {
		const [row] = await this.transactionRunner.read(async (tx) =>
			tx
				.select({
					displayName: userTable.displayName,
					email: userTable.email,
					id: userTable.id,
					lastLoginAt: userTable.lastLoginAt,
					name: userTable.name,
					profileImageUrl: userTable.profileImageUrl,
					provider: socialAccountTable.provider,
					role: userTable.role,
				})
				.from(userTable)
				.leftJoin(
					socialAccountTable,
					and(
						eq(socialAccountTable.userId, userTable.id),
						isNull(socialAccountTable.deletedAt),
					),
				)
				.where(and(eq(userTable.id, userId), isNull(userTable.deletedAt)))
				.limit(1),
		);

		if (!row?.email) {
			return null;
		}

		return {
			displayName: row.displayName,
			email: row.email,
			id: row.id,
			lastLoginAt: row.lastLoginAt,
			name: row.name,
			profileImageUrl: row.profileImageUrl,
			provider: row.provider,
			role: row.role,
		};
	}
}
