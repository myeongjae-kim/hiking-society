import { and, eq, isNull } from "drizzle-orm";
import type { DrizzleTransactionRunner } from "@/core/common/adapter/DrizzleTransactionRunner";
import { Autowired } from "@/core/config/Autowired";
import { userTable } from "@/drizzle/schema";
import type { MemberCommandPort } from "../application/port/out/MemberCommandPort";

export class MemberCommandAdapter implements MemberCommandPort {
	constructor(
		@Autowired("DrizzleTransactionRunner")
		private transactionRunner: DrizzleTransactionRunner,
	) {}

	async updateActiveMemberRole(
		input: Parameters<MemberCommandPort["updateActiveMemberRole"]>[0],
	) {
		await this.transactionRunner.write(async (tx) => {
			await tx
				.update(userTable)
				.set({
					role: input.nextRole,
					updatedAt: input.now,
				})
				.where(
					and(eq(userTable.id, input.userId), isNull(userTable.deletedAt)),
				);
		});
	}
}
