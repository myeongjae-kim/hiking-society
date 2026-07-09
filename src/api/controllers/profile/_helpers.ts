import { badRequest } from "#/api/config/apiUtils";
import { revalidatePath } from "#/api/config/revalidate";
import { env } from "@/core/config/env.server";

export function revalidateProfileViews() {
	revalidatePath("/me");
	revalidatePath("/feed");
	revalidatePath("/members");
}

export function getCurrentDisplayName(user: {
	displayName: string | null;
	email: string | null;
	name: string | null;
}) {
	return user.displayName ?? user.name ?? user.email ?? "회원";
}

function assertProfileObjectKey(objectKey: string, userId: number) {
	if (!objectKey.startsWith(`profile-images/users/${userId}/`)) {
		throw badRequest("잘못된 프로필 이미지입니다.");
	}
}

function assertPublicUrl(url: string, objectKey: string) {
	const expectedUrl = `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${objectKey
		.split("/")
		.map((part) => encodeURIComponent(part))
		.join("/")}`;

	if (url !== expectedUrl) {
		throw badRequest("잘못된 프로필 이미지 URL입니다.");
	}
}

export function assertProfileImage(
	profileImage: { objectKey: string; url: string } | null | undefined,
	userId: number,
) {
	if (!profileImage) {
		return;
	}

	assertProfileObjectKey(profileImage.objectKey, userId);
	assertPublicUrl(profileImage.url, profileImage.objectKey);
}
