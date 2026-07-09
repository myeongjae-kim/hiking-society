import type { UserRoleContract } from "#/api/contracts";

export type UserRoleView = UserRoleContract;

export const userRoleViewOptions = [
	"associate",
	"member",
	"admin",
] as const satisfies readonly UserRoleView[];

export const userRoleLabels = {
	admin: "관리자",
	associate: "준회원",
	member: "정회원",
} as const satisfies Record<UserRoleView, string>;

export function canViewMemberManagement(role: UserRoleView) {
	return role === "admin" || role === "member";
}

export function canSelectMemberRole(
	actorRole: UserRoleView,
	targetRole: UserRoleView,
	nextRole: UserRoleView,
) {
	if (actorRole === "admin") {
		return true;
	}

	if (actorRole !== "member") {
		return false;
	}

	return targetRole !== "admin" && nextRole !== "admin";
}
