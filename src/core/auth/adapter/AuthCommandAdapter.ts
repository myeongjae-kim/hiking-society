import { and, eq, isNull } from "drizzle-orm";
import type { DrizzleTransactionRunner } from "@/core/common/adapter/DrizzleTransactionRunner";
import { applicationError } from "@/core/common/application/ApplicationError";
import { Autowired } from "@/core/config/Autowired";
import { socialAccountTable, userTable } from "@/drizzle/schema";
import type { AuthCommandPort } from "../application/port/out/AuthCommandPort";
import type { AuthenticatedUser } from "../model/AuthenticatedUser";
import type { GoogleAccountPayload } from "../model/GoogleAccountPayload";

function toAuthenticatedUser(
	user: {
		displayName: string | null;
		email: string | null;
		id: number;
		lastLoginAt: Date | null;
		name: string | null;
		profileImageUrl: string | null;
		role: AuthenticatedUser["role"];
	},
	provider: string,
	fallbackEmail: string,
): AuthenticatedUser {
	return {
		displayName: user.displayName,
		email: user.email ?? fallbackEmail,
		id: user.id,
		lastLoginAt: user.lastLoginAt,
		name: user.name,
		profileImageUrl: user.profileImageUrl,
		provider,
		role: user.role,
	};
}

export class AuthCommandAdapter implements AuthCommandPort {
	constructor(
		@Autowired("DrizzleTransactionRunner")
		private transactionRunner: DrizzleTransactionRunner,
	) {}

	async upsertGoogleAccount(input: {
		now: Date;
		payload: GoogleAccountPayload;
	}) {
		const { now, payload } = input;

		return this.transactionRunner.write(async (tx) => {
			const [existingAccount] = await tx
				.select({
					user: userTable,
				})
				.from(socialAccountTable)
				.innerJoin(userTable, eq(userTable.id, socialAccountTable.userId))
				.where(
					and(
						eq(socialAccountTable.provider, payload.provider),
						eq(socialAccountTable.providerUserId, payload.providerUserId),
						isNull(socialAccountTable.deletedAt),
						isNull(userTable.deletedAt),
					),
				)
				.limit(1);

			if (existingAccount) {
				const [updatedUser] = await tx
					.update(userTable)
					.set({
						lastLoginAt: now,
						updatedAt: now,
					})
					.where(eq(userTable.id, existingAccount.user.id))
					.returning();

				if (!updatedUser) {
					throw applicationError.internal("사용자를 갱신하지 못했습니다.");
				}

				await tx
					.update(socialAccountTable)
					.set({
						displayName: payload.displayName,
						email: payload.email,
						emailVerified: payload.emailVerified,
						profileImageUrl: payload.profileImageUrl,
						rawClaims: payload.rawClaims,
						updatedAt: now,
					})
					.where(
						and(
							eq(socialAccountTable.provider, payload.provider),
							eq(socialAccountTable.providerUserId, payload.providerUserId),
						),
					);

				return toAuthenticatedUser(
					updatedUser,
					payload.provider,
					payload.email,
				);
			}

			const [existingUserByEmail] = await tx
				.select()
				.from(userTable)
				.where(
					and(eq(userTable.email, payload.email), isNull(userTable.deletedAt)),
				)
				.limit(1);

			const userForSocialAccount =
				existingUserByEmail ??
				(
					await tx
						.insert(userTable)
						.values({
							displayName: payload.displayName,
							email: payload.email,
							lastLoginAt: now,
							name: payload.displayName,
							profileImageUrl: payload.profileImageUrl,
						})
						.returning()
				)[0];

			if (!userForSocialAccount) {
				throw applicationError.internal("사용자를 생성하지 못했습니다.");
			}

			if (existingUserByEmail) {
				await tx
					.update(userTable)
					.set({
						displayName: payload.displayName,
						lastLoginAt: now,
						name: payload.displayName,
						profileImageUrl: payload.profileImageUrl,
						updatedAt: now,
					})
					.where(eq(userTable.id, existingUserByEmail.id));
			}

			await tx.insert(socialAccountTable).values({
				displayName: payload.displayName,
				email: payload.email,
				emailVerified: payload.emailVerified,
				profileImageUrl: payload.profileImageUrl,
				provider: payload.provider,
				providerUserId: payload.providerUserId,
				rawClaims: payload.rawClaims,
				userId: userForSocialAccount.id,
			});

			return toAuthenticatedUser(
				userForSocialAccount,
				payload.provider,
				payload.email,
			);
		});
	}
}
