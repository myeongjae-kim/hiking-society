import { getUseCase } from "#/core/config/getUseCase";
import { createPostArticleMediaUploadTargetsController } from "../controllers/article-media/upload-targets/PostArticleMediaUploadTargetsController";
import { createDeleteArticleMediaUploadsController } from "../controllers/article-media/uploads/DeleteArticleMediaUploadsController";
import { createPostArticlesController } from "../controllers/articles/PostArticlesController";
import { createGetArticleCommentsController } from "../controllers/articles/{articleId}/comments/GetArticleCommentsController";
import { createPostArticleCommentsController } from "../controllers/articles/{articleId}/comments/PostArticleCommentsController";
import { createDeleteArticleController } from "../controllers/articles/{articleId}/DeleteArticleController";
import { createGetArticleController } from "../controllers/articles/{articleId}/GetArticleController";
import { createDeleteArticleLikeController } from "../controllers/articles/{articleId}/like/DeleteArticleLikeController";
import { createPostArticleLikeController } from "../controllers/articles/{articleId}/like/PostArticleLikeController";
import { createPatchArticleController } from "../controllers/articles/{articleId}/PatchArticleController";
import { createPostGoogleLoginController } from "../controllers/auth/google/login/PostGoogleLoginController";
import { createPostLogoutController } from "../controllers/auth/logout/PostLogoutController";
import { createDeleteCommentController } from "../controllers/comments/{commentId}/DeleteCommentController";
import { createDeleteCommentLikeController } from "../controllers/comments/{commentId}/like/DeleteCommentLikeController";
import { createPostCommentLikeController } from "../controllers/comments/{commentId}/like/PostCommentLikeController";
import { createPatchCommentController } from "../controllers/comments/{commentId}/PatchCommentController";
import { createGetFeedController } from "../controllers/feed/GetFeedController";
import { createGetHikingArticlesController } from "../controllers/feed/hikings/{hikingId}/articles/GetHikingArticlesController";
import { createGetGeocodingSearchController } from "../controllers/geocoding/search/GetGeocodingSearchController";
import { createPostHikingsController } from "../controllers/hikings/PostHikingsController";
import { createDeleteHikingController } from "../controllers/hikings/{hikingId}/DeleteHikingController";
import { createPatchHikingController } from "../controllers/hikings/{hikingId}/PatchHikingController";
import { createGetMembersController } from "../controllers/members/GetMembersController";
import { createPatchMemberRoleController } from "../controllers/members/{userId}/role/PatchMemberRoleController";
import { createGetNotificationsController } from "../controllers/notifications/GetNotificationsController";
import { createPatchNotificationsReadAllController } from "../controllers/notifications/read-all/PatchNotificationsReadAllController";
import { createPatchNotificationReadController } from "../controllers/notifications/{notificationId}/read/PatchNotificationReadController";
import { createPostProfileImageUploadTargetController } from "../controllers/profile-image/upload-target/PostProfileImageUploadTargetController";
import { createDeleteProfileImageUploadsController } from "../controllers/profile-image/uploads/DeleteProfileImageUploadsController";
import { createPatchProfileDisplayNameController } from "../controllers/profile/display-name/PatchProfileDisplayNameController";
import { createPatchProfileEmailController } from "../controllers/profile/email/PatchProfileEmailController";
import { createPatchProfileImageController } from "../controllers/profile/image/PatchProfileImageController";
import { createGetCurrentUserController } from "../controllers/users/me/GetCurrentUserController";

export function createApiControllers() {
	return [
		createGetCurrentUserController(),
		createPostGoogleLoginController(
			getUseCase("GetCookieOptionsUseCase"),
			getUseCase("CreateSessionTokenUseCase"),
			getUseCase("LoginWithGoogleCodeUseCase"),
		),
		createPostLogoutController(),
		createGetFeedController(getUseCase("GetFeedHomeUseCase")),
		createGetHikingArticlesController(getUseCase("ListFeedUseCase")),
		createPostHikingsController(getUseCase("HikingCommandUseCase")),
		createPatchHikingController(getUseCase("HikingCommandUseCase")),
		createDeleteHikingController(getUseCase("HikingCommandUseCase")),
		createPostArticlesController(getUseCase("ArticleCommandUseCase")),
		createGetArticleController(getUseCase("GetArticlePageUseCase")),
		createPatchArticleController(
			getUseCase("ArticleCommandUseCase"),
			getUseCase("GetArticleDetailUseCase"),
		),
		createDeleteArticleController(getUseCase("ArticleCommandUseCase")),
		createPostArticleLikeController(getUseCase("LikeCommandUseCase")),
		createDeleteArticleLikeController(getUseCase("LikeCommandUseCase")),
		createPostArticleMediaUploadTargetsController(
			getUseCase("ArticleMediaUploadUseCase"),
		),
		createDeleteArticleMediaUploadsController(
			getUseCase("ArticleMediaUploadUseCase"),
		),
		createGetArticleCommentsController(
			getUseCase("ListArticleCommentsUseCase"),
		),
		createPostArticleCommentsController(getUseCase("CommentCommandUseCase")),
		createPatchCommentController(getUseCase("CommentCommandUseCase")),
		createDeleteCommentController(getUseCase("CommentCommandUseCase")),
		createPostCommentLikeController(getUseCase("LikeCommandUseCase")),
		createDeleteCommentLikeController(getUseCase("LikeCommandUseCase")),
		createPatchProfileDisplayNameController(
			getUseCase("UpdateDisplayNameUseCase"),
		),
		createPatchProfileEmailController(
			getUseCase("GetCookieOptionsUseCase"),
			getUseCase("CreateSessionTokenUseCase"),
			getUseCase("UpdateEmailUseCase"),
		),
		createPatchProfileImageController(getUseCase("UpdateProfileImageUseCase")),
		createPostProfileImageUploadTargetController(
			getUseCase("ProfileImageUploadUseCase"),
		),
		createDeleteProfileImageUploadsController(
			getUseCase("ProfileImageUploadUseCase"),
		),
		createGetNotificationsController(getUseCase("ListNotificationsUseCase")),
		createPatchNotificationReadController(
			getUseCase("MarkNotificationReadUseCase"),
		),
		createPatchNotificationsReadAllController(
			getUseCase("MarkAllNotificationsReadUseCase"),
		),
		createGetMembersController(getUseCase("GetMemberManagementUseCase")),
		createPatchMemberRoleController(getUseCase("UpdateMemberRoleUseCase")),
		createGetGeocodingSearchController(getUseCase("SearchGeocodingUseCase")),
	] as const;
}
