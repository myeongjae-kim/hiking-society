import { getUseCase } from "#/infrastructure/config/getUseCase";
import type { ResolveSessionUseCase } from "@/core/auth/application/port/in/ResolveSessionUseCase";
import {
	type CookieOptionsFactory,
	createCookieOptions,
} from "./sessionCookies";

export type ApiRuntimeDependencies = {
	readonly cookieOptions: CookieOptionsFactory;
	readonly resolveSessionUseCase: ResolveSessionUseCase;
};

export function createApiRuntimeDependencies(): ApiRuntimeDependencies {
	return {
		cookieOptions: createCookieOptions(process.env.NODE_ENV),
		resolveSessionUseCase: getUseCase("ResolveSessionUseCase"),
	};
}
