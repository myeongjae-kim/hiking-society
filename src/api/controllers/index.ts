import { getUseCase } from "#/core/config/getUseCase";
import { createPostArticleMediaUploadTargetsController } from "./article-media/upload-targets/PostArticleMediaUploadTargetsController";
import { createDeleteArticleMediaUploadsController } from "./article-media/uploads/DeleteArticleMediaUploadsController";
import { createPostArticlesController } from "./articles/PostArticlesController";
import { createGetArticleCommentsController } from "./articles/{articleId}/comments/GetArticleCommentsController";
import { createPostArticleCommentsController } from "./articles/{articleId}/comments/PostArticleCommentsController";
import { createDeleteArticleController } from "./articles/{articleId}/DeleteArticleController";
import { createGetArticleController } from "./articles/{articleId}/GetArticleController";
import { createDeleteArticleLikeController } from "./articles/{articleId}/like/DeleteArticleLikeController";
import { createPostArticleLikeController } from "./articles/{articleId}/like/PostArticleLikeController";
import { createPatchArticleController } from "./articles/{articleId}/PatchArticleController";
import { createPostGoogleLoginController } from "./auth/google/login/PostGoogleLoginController";
import { createPostLogoutController } from "./auth/logout/PostLogoutController";
import { createDeleteCommentController } from "./comments/{commentId}/DeleteCommentController";
import { createDeleteCommentLikeController } from "./comments/{commentId}/like/DeleteCommentLikeController";
import { createPostCommentLikeController } from "./comments/{commentId}/like/PostCommentLikeController";
import { createPatchCommentController } from "./comments/{commentId}/PatchCommentController";
import { createGetFeedController } from "./feed/GetFeedController";
import { createGetHikingArticlesController } from "./feed/hikings/{hikingId}/articles/GetHikingArticlesController";
import { createGetGeocodingSearchController } from "./geocoding/search/GetGeocodingSearchController";
import { createPostHikingsController } from "./hikings/PostHikingsController";
import { createDeleteHikingController } from "./hikings/{hikingId}/DeleteHikingController";
import { createPatchHikingController } from "./hikings/{hikingId}/PatchHikingController";
import { createGetMembersController } from "./members/GetMembersController";
import { createPatchMemberRoleController } from "./members/{userId}/role/PatchMemberRoleController";
import { createGetNotificationsController } from "./notifications/GetNotificationsController";
import { createPatchNotificationsReadAllController } from "./notifications/read-all/PatchNotificationsReadAllController";
import { createPatchNotificationReadController } from "./notifications/{notificationId}/read/PatchNotificationReadController";
import { createPostProfileImageUploadTargetController } from "./profile-image/upload-target/PostProfileImageUploadTargetController";
import { createDeleteProfileImageUploadsController } from "./profile-image/uploads/DeleteProfileImageUploadsController";
import { createPatchProfileDisplayNameController } from "./profile/display-name/PatchProfileDisplayNameController";
import { createPatchProfileEmailController } from "./profile/email/PatchProfileEmailController";
import { createPatchProfileImageController } from "./profile/image/PatchProfileImageController";
import { createGetCurrentUserController } from "./users/me/GetCurrentUserController";

const articleCommandUseCase = getUseCase("ArticleCommandUseCase");
const articleMediaUploadUseCase = getUseCase("ArticleMediaUploadUseCase");
const commentCommandUseCase = getUseCase("CommentCommandUseCase");
const createSessionTokenUseCase = getUseCase("CreateSessionTokenUseCase");
const getArticleDetailUseCase = getUseCase("GetArticleDetailUseCase");
const getArticlePageUseCase = getUseCase("GetArticlePageUseCase");
const getCookieOptionsUseCase = getUseCase("GetCookieOptionsUseCase");
const getFeedHomeUseCase = getUseCase("GetFeedHomeUseCase");
const getMemberManagementUseCase = getUseCase("GetMemberManagementUseCase");
const hikingCommandUseCase = getUseCase("HikingCommandUseCase");
const likeCommandUseCase = getUseCase("LikeCommandUseCase");
const listArticleCommentsUseCase = getUseCase("ListArticleCommentsUseCase");
const listFeedUseCase = getUseCase("ListFeedUseCase");
const listNotificationsUseCase = getUseCase("ListNotificationsUseCase");
const loginWithGoogleCodeUseCase = getUseCase("LoginWithGoogleCodeUseCase");
const markAllNotificationsReadUseCase = getUseCase(
	"MarkAllNotificationsReadUseCase",
);
const markNotificationReadUseCase = getUseCase("MarkNotificationReadUseCase");
const profileImageUploadUseCase = getUseCase("ProfileImageUploadUseCase");
const searchGeocodingUseCase = getUseCase("SearchGeocodingUseCase");
const updateDisplayNameUseCase = getUseCase("UpdateDisplayNameUseCase");
const updateEmailUseCase = getUseCase("UpdateEmailUseCase");
const updateMemberRoleUseCase = getUseCase("UpdateMemberRoleUseCase");
const updateProfileImageUseCase = getUseCase("UpdateProfileImageUseCase");

export const apiControllers = [
	createGetCurrentUserController(),
	createPostGoogleLoginController({
		getCookieOptionsUseCase,
		createSessionTokenUseCase,
		loginWithGoogleCodeUseCase,
	}),
	createPostLogoutController(),
	createGetFeedController({
		getFeedHomeUseCase,
	}),
	createGetHikingArticlesController({
		listFeedUseCase,
	}),
	createPostHikingsController({
		hikingCommandUseCase,
	}),
	createPatchHikingController({
		hikingCommandUseCase,
	}),
	createDeleteHikingController({
		hikingCommandUseCase,
	}),
	createPostArticlesController({
		articleCommandUseCase,
	}),
	createGetArticleController({
		getArticlePageUseCase,
	}),
	createPatchArticleController({
		articleCommandUseCase,
		getArticleDetailUseCase,
	}),
	createDeleteArticleController({
		articleCommandUseCase,
	}),
	createPostArticleLikeController({
		likeCommandUseCase,
	}),
	createDeleteArticleLikeController({
		likeCommandUseCase,
	}),
	createPostArticleMediaUploadTargetsController({
		articleMediaUploadUseCase,
	}),
	createDeleteArticleMediaUploadsController({
		articleMediaUploadUseCase,
	}),
	createGetArticleCommentsController({
		listArticleCommentsUseCase,
	}),
	createPostArticleCommentsController({
		commentCommandUseCase,
	}),
	createPatchCommentController({
		commentCommandUseCase,
	}),
	createDeleteCommentController({
		commentCommandUseCase,
	}),
	createPostCommentLikeController({
		likeCommandUseCase,
	}),
	createDeleteCommentLikeController({
		likeCommandUseCase,
	}),
	createPatchProfileDisplayNameController({
		updateDisplayNameUseCase,
	}),
	createPatchProfileEmailController({
		getCookieOptionsUseCase,
		createSessionTokenUseCase,
		updateEmailUseCase,
	}),
	createPatchProfileImageController({
		updateProfileImageUseCase,
	}),
	createPostProfileImageUploadTargetController({
		profileImageUploadUseCase,
	}),
	createDeleteProfileImageUploadsController({
		profileImageUploadUseCase,
	}),
	createGetNotificationsController({
		listNotificationsUseCase,
	}),
	createPatchNotificationReadController({
		markNotificationReadUseCase,
	}),
	createPatchNotificationsReadAllController({
		markAllNotificationsReadUseCase,
	}),
	createGetMembersController({
		getMemberManagementUseCase,
	}),
	createPatchMemberRoleController({
		updateMemberRoleUseCase,
	}),
	createGetGeocodingSearchController({
		searchGeocodingUseCase,
	}),
] as const;
