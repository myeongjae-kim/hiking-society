import {
	createSessionCookieOptionsFactory,
	type SessionCookieOptionsFactory,
} from "@/core/auth/config/sessionCookieOptions";
import { sessionCookieConfig } from "@/core/auth/config/sessionCookieConfig";

export { sessionCookieConfig };

export type CookieOptionsFactory = SessionCookieOptionsFactory;

export const createCookieOptions = createSessionCookieOptionsFactory;
