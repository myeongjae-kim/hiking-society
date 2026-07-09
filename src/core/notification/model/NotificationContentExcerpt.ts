const NOTIFICATION_CONTENT_EXCERPT_MAX_LENGTH = 160;

export function createNotificationContentExcerpt(content: string) {
	return [...content.trim().replace(/\s+/g, " ")]
		.slice(0, NOTIFICATION_CONTENT_EXCERPT_MAX_LENGTH)
		.join("");
}
