import { and, eq, isNull } from "drizzle-orm";
import { runInDrizzleTransaction } from "@/core/common/adapter/drizzle.server";
import { userTable } from "@/drizzle/schema";
import type { MemberCommandPort } from "../application/port/out/MemberCommandPort";

export class MemberCommandAdapter implements MemberCommandPort {
	async updateActiveMemberRole(
		input: Parameters<MemberCommandPort["updateActiveMemberRole"]>[0],
	) {
		await runInDrizzleTransaction(
			async (tx) => {
				await tx
					.update(userTable)
					.set({
						role: input.nextRole,
						updatedAt: input.now,
					})
					.where(
						and(eq(userTable.id, input.userId), isNull(userTable.deletedAt)),
					);
			},
			{ readOnly: false },
		);
	}
}
