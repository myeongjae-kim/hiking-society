import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/core/config/drizzle.server";
import { userTable } from "@/drizzle/schema";
import type { ProfileCommandPort } from "../application/port/out/ProfileCommandPort";
import type { ProfileQueryPort } from "../application/port/out/ProfileQueryPort";

export class ProfileDrizzleAdapter
	implements ProfileCommandPort, ProfileQueryPort
{
	async existsActiveUserByEmailExceptUserId(
		input: Parameters<
			ProfileQueryPort["existsActiveUserByEmailExceptUserId"]
		>[0],
	) {
		const [row] = await db
			.select({ id: userTable.id })
			.from(userTable)
			.where(
				and(
					eq(userTable.email, input.email),
					ne(userTable.id, input.userId),
					isNull(userTable.deletedAt),
				),
			)
			.limit(1);

		return Boolean(row);
	}

	async updateActiveProfile(
		input: Parameters<ProfileCommandPort["updateActiveProfile"]>[0],
	) {
		await db
			.update(userTable)
			.set({
				displayName: input.displayName,
				email: input.email,
				name: input.displayName,
				...(input.profileImageUrl !== undefined
					? { profileImageUrl: input.profileImageUrl }
					: {}),
				updatedAt: input.now,
			})
			.where(and(eq(userTable.id, input.userId), isNull(userTable.deletedAt)));
	}
}
