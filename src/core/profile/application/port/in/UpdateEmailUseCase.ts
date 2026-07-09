export interface UpdateEmailUseCase {
	updateEmail(input: {
		readonly email: string;
		readonly now: Date;
		readonly userId: number;
	}): Promise<void>;
}
