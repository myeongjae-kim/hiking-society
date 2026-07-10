import { describe, expect, it } from "vitest";
import { currentUserSchema, membersResponseSchema } from "./schemas";

describe("api schemas", () => {
	it("keeps lastLoginAt out of the current user wire response", () => {
		const currentUser = currentUserSchema.parse({
			displayName: "회원",
			email: "member@example.com",
			id: 1,
			lastLoginAt: "2026-07-10T10:00:00.000Z",
			name: "Member",
			profileImageUrl: null,
			provider: "google",
			role: "member",
		});

		expect(currentUser).not.toHaveProperty("lastLoginAt");
	});

	it("accepts member response dates as ISO strings", () => {
		const response = membersResponseSchema.parse({
			members: [
				{
					createdAt: "2026-07-10T10:00:00.000Z",
					displayName: "회원",
					email: "member@example.com",
					id: 1,
					lastLoginAt: "2026-07-10T11:00:00.000Z",
					name: null,
					profileImageUrl: null,
					provider: "google",
					role: "member",
				},
			],
		});

		expect(response.members[0]?.createdAt).toBe("2026-07-10T10:00:00.000Z");
		expect(response.members[0]?.lastLoginAt).toBe(
			"2026-07-10T11:00:00.000Z",
		);
	});
});
