import { describe, expect, it } from "vitest";
import { UserRolePolicy } from "@/core/auth/model/roles";

describe("UserRolePolicy", () => {
	it("allows member content only for member and admin roles", () => {
		expect(UserRolePolicy.of("admin").canAccessMemberContent()).toBe(true);
		expect(UserRolePolicy.of("member").canAccessMemberContent()).toBe(true);
		expect(UserRolePolicy.of("associate").canAccessMemberContent()).toBe(false);
	});

	it("allows admins to change any role", () => {
		expect(UserRolePolicy.of("admin").canChangeRole("admin", "member")).toBe(
			true,
		);
	});

	it("allows members to change only non-admin roles to non-admin roles", () => {
		const policy = UserRolePolicy.of("member");

		expect(policy.canChangeRole("associate", "member")).toBe(true);
		expect(policy.canChangeRole("admin", "member")).toBe(false);
		expect(policy.canChangeRole("member", "admin")).toBe(false);
	});
});
