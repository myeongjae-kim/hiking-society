export interface UpdateEmailUseCase {
	updateEmail(input: {
		readonly email: string;
		readonly userId: number;
	}): Promise<void>;
}
