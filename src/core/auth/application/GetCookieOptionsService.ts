import { Autowired } from "@/core/config/Autowired";
import type { GetCookieOptionsUseCase } from "./port/in/GetCookieOptionsUseCase";

export class GetCookieOptionsService implements GetCookieOptionsUseCase {
	constructor(
		@Autowired("NODE_ENV")
		private NODE_ENV: string,
	) {}
	getCookieOptions(maxAge: number) {
		return {
			httpOnly: true,
			maxAge,
			path: "/",
			sameSite: "lax" as const,
			secure: this.NODE_ENV === "production",
		} as const;
	}
}
