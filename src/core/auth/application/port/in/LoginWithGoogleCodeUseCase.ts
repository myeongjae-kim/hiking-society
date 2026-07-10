import type { LoginWithGoogleCodeResult } from "@/core/auth/model/LoginWithGoogleCodeResult";

export interface LoginWithGoogleCodeUseCase {
	login(input: { code: string }): Promise<LoginWithGoogleCodeResult>;
}
