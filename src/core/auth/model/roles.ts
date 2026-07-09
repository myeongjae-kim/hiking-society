export type UserRole = "admin" | "member" | "associate";

export const mutableRoles = [
	"associate",
	"member",
	"admin",
] as const satisfies readonly UserRole[];

export class UserRolePolicy {
	private constructor(private readonly role: UserRole) {}

	static of(role: UserRole) {
		return new UserRolePolicy(role);
	}

	canAccessMemberContent() {
		return this.role === "admin" || this.role === "member";
	}

	canManageMembers() {
		return this.canAccessMemberContent();
	}

	canChangeRole(targetRole: UserRole, nextRole: UserRole) {
		if (this.role === "admin") {
			return true;
		}

		if (this.role !== "member") {
			return false;
		}

		return targetRole !== "admin" && nextRole !== "admin";
	}
}

export function canManageMembers(role: UserRole) {
	return UserRolePolicy.of(role).canManageMembers();
}

export function canChangeRole(
	actorRole: UserRole,
	targetRole: UserRole,
	nextRole: UserRole,
) {
	return UserRolePolicy.of(actorRole).canChangeRole(targetRole, nextRole);
}
