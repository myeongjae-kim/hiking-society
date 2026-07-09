export interface UpdateDisplayNameUseCase {
	updateDisplayName(input: {
		readonly displayName: string;
		readonly now: Date;
		readonly userId: number;
	}): Promise<void>;
}
