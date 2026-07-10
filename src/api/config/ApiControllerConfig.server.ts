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
		createPostGoogleLoginController({
			getCookieOptionsUseCase: getUseCase("GetCookieOptionsUseCase"),
			createSessionTokenUseCase: getUseCase("CreateSessionTokenUseCase"),
			loginWithGoogleCodeUseCase: getUseCase("LoginWithGoogleCodeUseCase"),
		}),
		createPostLogoutController(),
		createGetFeedController({
			getFeedHomeUseCase: getUseCase("GetFeedHomeUseCase"),
		}),
		createGetHikingArticlesController({
			listFeedUseCase: getUseCase("ListFeedUseCase"),
		}),
		createPostHikingsController({
			hikingCommandUseCase: getUseCase("HikingCommandUseCase"),
		}),
		createPatchHikingController({
			hikingCommandUseCase: getUseCase("HikingCommandUseCase"),
		}),
		createDeleteHikingController({
			hikingCommandUseCase: getUseCase("HikingCommandUseCase"),
		}),
		createPostArticlesController({
			articleCommandUseCase: getUseCase("ArticleCommandUseCase"),
		}),
		createGetArticleController({
			getArticlePageUseCase: getUseCase("GetArticlePageUseCase"),
		}),
		createPatchArticleController({
			articleCommandUseCase: getUseCase("ArticleCommandUseCase"),
			getArticleDetailUseCase: getUseCase("GetArticleDetailUseCase"),
		}),
		createDeleteArticleController({
			articleCommandUseCase: getUseCase("ArticleCommandUseCase"),
		}),
		createPostArticleLikeController({
			likeCommandUseCase: getUseCase("LikeCommandUseCase"),
		}),
		createDeleteArticleLikeController({
			likeCommandUseCase: getUseCase("LikeCommandUseCase"),
		}),
		createPostArticleMediaUploadTargetsController({
			articleMediaUploadUseCase: getUseCase("ArticleMediaUploadUseCase"),
		}),
		createDeleteArticleMediaUploadsController({
			articleMediaUploadUseCase: getUseCase("ArticleMediaUploadUseCase"),
		}),
		createGetArticleCommentsController({
			listArticleCommentsUseCase: getUseCase("ListArticleCommentsUseCase"),
		}),
		createPostArticleCommentsController({
			commentCommandUseCase: getUseCase("CommentCommandUseCase"),
		}),
		createPatchCommentController({
			commentCommandUseCase: getUseCase("CommentCommandUseCase"),
		}),
		createDeleteCommentController({
			commentCommandUseCase: getUseCase("CommentCommandUseCase"),
		}),
		createPostCommentLikeController({
			likeCommandUseCase: getUseCase("LikeCommandUseCase"),
		}),
		createDeleteCommentLikeController({
			likeCommandUseCase: getUseCase("LikeCommandUseCase"),
		}),
		createPatchProfileDisplayNameController({
			updateDisplayNameUseCase: getUseCase("UpdateDisplayNameUseCase"),
		}),
		createPatchProfileEmailController({
			getCookieOptionsUseCase: getUseCase("GetCookieOptionsUseCase"),
			createSessionTokenUseCase: getUseCase("CreateSessionTokenUseCase"),
			updateEmailUseCase: getUseCase("UpdateEmailUseCase"),
		}),
		createPatchProfileImageController({
			updateProfileImageUseCase: getUseCase("UpdateProfileImageUseCase"),
		}),
		createPostProfileImageUploadTargetController({
			profileImageUploadUseCase: getUseCase("ProfileImageUploadUseCase"),
		}),
		createDeleteProfileImageUploadsController({
			profileImageUploadUseCase: getUseCase("ProfileImageUploadUseCase"),
		}),
		createGetNotificationsController({
			listNotificationsUseCase: getUseCase("ListNotificationsUseCase"),
		}),
		createPatchNotificationReadController({
			markNotificationReadUseCase: getUseCase("MarkNotificationReadUseCase"),
		}),
		createPatchNotificationsReadAllController({
			markAllNotificationsReadUseCase: getUseCase(
				"MarkAllNotificationsReadUseCase",
			),
		}),
		createGetMembersController({
			getMemberManagementUseCase: getUseCase("GetMemberManagementUseCase"),
		}),
		createPatchMemberRoleController({
			updateMemberRoleUseCase: getUseCase("UpdateMemberRoleUseCase"),
		}),
		createGetGeocodingSearchController({
			searchGeocodingUseCase: getUseCase("SearchGeocodingUseCase"),
		}),
	] as const;
}
