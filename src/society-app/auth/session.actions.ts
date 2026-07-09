import { redirect } from "@tanstack/react-router";
import {
	clearSessionCookies,
	getCurrentUser,
	setSessionCookies,
} from "#/society-app/auth/session.functions";
import type { UserRole } from "@/core/auth/model/roles";

export { clearSessionCookies, getCurrentUser, setSessionCookies };

export async function requireCurrentUser() {
	const user = await getCurrentUser();

	if (!user) {
		throw redirect({ href: "/" });
	}

	return user;
}

export async function requireRole(allowedRoles: readonly UserRole[]) {
	const user = await requireCurrentUser();

	if (!allowedRoles.includes(user.role)) {
		throw redirect({ href: "/feed" });
	}

	return user;
}
