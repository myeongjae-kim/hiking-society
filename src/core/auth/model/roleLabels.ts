import type { UserRole } from "./roles";

export const roleLabels: Record<UserRole, string> = {
	admin: "관리자",
	associate: "준회원",
	member: "정회원",
};
