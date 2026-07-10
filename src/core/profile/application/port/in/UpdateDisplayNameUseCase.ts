export interface UpdateDisplayNameUseCase {
	updateDisplayName(input: {
		readonly displayName: string;
		readonly userId: number;
	}): Promise<void>;
}
