import { and, asc, eq, isNull } from "drizzle-orm";
import type { DrizzleTransactionRunner } from "#/infrastructure/common/adapter/DrizzleTransactionRunner";
import { toIsoDateTime } from "@/core/common/domain";
import { Autowired } from "@/core/config/Autowired";
import { socialAccountTable, userTable } from "@/drizzle/schema";
import type { MemberQueryPort } from "@/core/member/application/port/out/MemberQueryPort";
import type { MemberListItem } from "@/core/member/model/MemberListItem";

export class MemberQueryAdapter implements MemberQueryPort {
	constructor(
		@Autowired("DrizzleTransactionRunner")
		private transactionRunner: DrizzleTransactionRunner,
	) {}

	async listActiveMembers(): Promise<MemberListItem[]> {
		const rows = await this.transactionRunner.read(async (tx) =>
			tx
				.select({
					createdAt: userTable.createdAt,
					displayName: userTable.displayName,
					email: userTable.email,
					id: userTable.id,
					lastLoginAt: userTable.lastLoginAt,
					name: userTable.name,
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
				.where(isNull(userTable.deletedAt))
				.orderBy(asc(userTable.id)),
		);

		return rows.map((row) => ({
			...row,
			createdAt: toIsoDateTime(row.createdAt),
			lastLoginAt: toIsoDateTime(row.lastLoginAt),
		}));
	}

	async findActiveMemberRoleById(userId: number) {
		const [row] = await this.transactionRunner.read(async (tx) =>
			tx
				.select({
					role: userTable.role,
				})
				.from(userTable)
				.where(and(eq(userTable.id, userId), isNull(userTable.deletedAt)))
				.limit(1),
		);

		return row?.role ?? null;
	}
}
