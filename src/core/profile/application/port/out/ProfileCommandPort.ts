export interface ProfileCommandPort {
	updateActiveProfile(input: {
		displayName: string;
		email: string;
		now: Date;
		profileImageUrl?: string | null;
		userId: number;
	}): Promise<void>;
}
