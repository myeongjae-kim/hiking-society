export interface ProfileQueryPort {
  existsActiveUserByEmailExceptUserId(input: { email: string; userId: number }): Promise<boolean>;
}
