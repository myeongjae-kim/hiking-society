import { and, eq, isNull, ne } from "drizzle-orm";
import type { DrizzleTransactionRunner } from "#/infrastructure/common/adapter/DrizzleTransactionRunner";
import { Autowired } from "@/core/config/Autowired";
import { userTable } from "@/drizzle/schema";
import type { ProfileCommandPort } from "@/core/profile/application/port/out/ProfileCommandPort";
import type { ProfileQueryPort } from "@/core/profile/application/port/out/ProfileQueryPort";

export class ProfileDrizzleAdapter
	implements ProfileCommandPort, ProfileQueryPort
{
	constructor(
		@Autowired("DrizzleTransactionRunner")
		private transactionRunner: DrizzleTransactionRunner,
	) {}

	async existsActiveUserByEmailExceptUserId(
		input: Parameters<
			ProfileQueryPort["existsActiveUserByEmailExceptUserId"]
		>[0],
	) {
		const [row] = await this.transactionRunner.read(async (tx) =>
			tx
				.select({ id: userTable.id })
				.from(userTable)
				.where(
					and(
						eq(userTable.email, input.email),
						ne(userTable.id, input.userId),
						isNull(userTable.deletedAt),
					),
				)
				.limit(1),
		);

		return Boolean(row);
	}

	async updateActiveDisplayName(
		input: Parameters<ProfileCommandPort["updateActiveDisplayName"]>[0],
	) {
		await this.transactionRunner.write(async (tx) => {
			await tx
				.update(userTable)
				.set({
					displayName: input.displayName,
					name: input.displayName,
					updatedAt: input.now,
				})
				.where(
					and(eq(userTable.id, input.userId), isNull(userTable.deletedAt)),
				);
		});
	}

	async updateActiveEmail(
		input: Parameters<ProfileCommandPort["updateActiveEmail"]>[0],
	) {
		await this.transactionRunner.write(async (tx) => {
			await tx
				.update(userTable)
				.set({
					email: input.email,
					updatedAt: input.now,
				})
				.where(
					and(eq(userTable.id, input.userId), isNull(userTable.deletedAt)),
				);
		});
	}

	async updateActiveProfileImage(
		input: Parameters<ProfileCommandPort["updateActiveProfileImage"]>[0],
	) {
		await this.transactionRunner.write(async (tx) => {
			await tx
				.update(userTable)
				.set({
					profileImageUrl: input.profileImageUrl,
					updatedAt: input.now,
				})
				.where(
					and(eq(userTable.id, input.userId), isNull(userTable.deletedAt)),
				);
		});
	}
}
