function joinPublicUrl(baseUrl: string, objectKey: string) {
	return `${baseUrl.replace(/\/$/, "")}/${objectKey
		.split("/")
		.map((part) => encodeURIComponent(part))
		.join("/")}`;
}

export class UploadOwnershipPolicy {
	private constructor(
		private readonly input: {
			readonly objectPrefix: string;
			readonly publicBaseUrl: string;
			readonly userId: number;
		},
	) {}

	static forUser(input: {
		readonly objectPrefix: string;
		readonly publicBaseUrl: string;
		readonly userId: number;
	}) {
		return new UploadOwnershipPolicy(input);
	}

	private get ownedPrefix() {
		return `${this.input.objectPrefix}/users/${this.input.userId}/`;
	}

	hasOwnedObjectKey(objectKey: string) {
		return objectKey.startsWith(this.ownedPrefix);
	}

	hasExpectedPublicUrl(input: {
		readonly objectKey: string;
		readonly url: string;
	}) {
		return (
			input.url === joinPublicUrl(this.input.publicBaseUrl, input.objectKey)
		);
	}

	hasOwnedPublicUrl(url: string) {
		return url.startsWith(
			joinPublicUrl(this.input.publicBaseUrl, this.ownedPrefix),
		);
	}
}
