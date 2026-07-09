export class HikingOwnership {
	private constructor(private readonly authorUserId: number) {}

	static of(hiking: { readonly authorUserId: number }) {
		return new HikingOwnership(hiking.authorUserId);
	}

	canBeManagedBy(userId: number) {
		return this.authorUserId === userId;
	}
}

export class HikingDeletionPolicy {
	private constructor(private readonly activeArticleCount: number) {}

	static of(hiking: { readonly activeArticleCount: number }) {
		return new HikingDeletionPolicy(hiking.activeArticleCount);
	}

	canDelete() {
		return this.activeArticleCount === 0;
	}
}
