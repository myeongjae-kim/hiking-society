export interface ProfileCommandPort {
	updateActiveDisplayName(input: {
		displayName: string;
		now: Date;
		userId: number;
	}): Promise<void>;
	updateActiveEmail(input: {
		email: string;
		now: Date;
		userId: number;
	}): Promise<void>;
	updateActiveProfileImage(input: {
		now: Date;
		profileImageUrl: string | null;
		userId: number;
	}): Promise<void>;
}
