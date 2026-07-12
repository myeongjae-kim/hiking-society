
import {
	useNavigate,
	useRouter as useTanStackRouter,
} from "@tanstack/react-router";

export function useRouter() {
	const router = useTanStackRouter();
	const navigate = useNavigate();

	return {
		push: (href: string) => navigate({ href }),
		refresh: () => router.invalidate(),
	};
}
