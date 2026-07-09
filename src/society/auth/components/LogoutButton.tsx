"use client";

import { $api } from "#/api/client/$api";
import { useRouter } from "#/society/shared/hooks/useRouter";

export function LogoutButton() {
	const router = useRouter();
	const logoutMutation = $api.useMutation("post", "/api/auth/logout");

	const logout = () => {
		logoutMutation
			.mutateAsync({})
			.then(() => {
				router.push("/");
				router.refresh();
			})
			.catch(() => {
				router.push("/");
				router.refresh();
			});
	};

	return (
		<button
			disabled={logoutMutation.isPending}
			onClick={logout}
			size-="small"
			type="button"
			variant-="foreground2"
		>
			로그아웃
		</button>
	);
}
