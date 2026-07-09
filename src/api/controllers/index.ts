import PostArticleMediaUploadTargetsController from "./article-media/upload-targets/PostArticleMediaUploadTargetsController";
import DeleteArticleMediaUploadsController from "./article-media/uploads/DeleteArticleMediaUploadsController";
import GetArticleCommentsController from "./articles/{articleId}/comments/GetArticleCommentsController";
import PostArticleCommentsController from "./articles/{articleId}/comments/PostArticleCommentsController";
import DeleteArticleController from "./articles/{articleId}/DeleteArticleController";
import GetArticleController from "./articles/{articleId}/GetArticleController";
import DeleteArticleLikeController from "./articles/{articleId}/like/DeleteArticleLikeController";
import PostArticleLikeController from "./articles/{articleId}/like/PostArticleLikeController";
import PatchArticleController from "./articles/{articleId}/PatchArticleController";
import PostArticlesController from "./articles/PostArticlesController";
import PostGoogleLoginController from "./auth/google/login/PostGoogleLoginController";
import PostLogoutController from "./auth/logout/PostLogoutController";
import DeleteCommentController from "./comments/{commentId}/DeleteCommentController";
import DeleteCommentLikeController from "./comments/{commentId}/like/DeleteCommentLikeController";
import PostCommentLikeController from "./comments/{commentId}/like/PostCommentLikeController";
import PatchCommentController from "./comments/{commentId}/PatchCommentController";
import GetFeedController from "./feed/GetFeedController";
import GetHikingArticlesController from "./feed/hikings/{hikingId}/articles/GetHikingArticlesController";
import GetGeocodingSearchController from "./geocoding/search/GetGeocodingSearchController";
import DeleteHikingController from "./hikings/{hikingId}/DeleteHikingController";
import PatchHikingController from "./hikings/{hikingId}/PatchHikingController";
import PostHikingsController from "./hikings/PostHikingsController";
import PatchMemberRoleController from "./members/{userId}/role/PatchMemberRoleController";
import GetMembersController from "./members/GetMembersController";
import PatchNotificationReadController from "./notifications/{notificationId}/read/PatchNotificationReadController";
import GetNotificationsController from "./notifications/GetNotificationsController";
import PatchNotificationsReadAllController from "./notifications/read-all/PatchNotificationsReadAllController";
import PatchProfileDisplayNameController from "./profile/display-name/PatchProfileDisplayNameController";
import PatchProfileEmailController from "./profile/email/PatchProfileEmailController";
import PatchProfileImageController from "./profile/image/PatchProfileImageController";
import PostProfileImageUploadTargetController from "./profile-image/upload-target/PostProfileImageUploadTargetController";
import DeleteProfileImageUploadsController from "./profile-image/uploads/DeleteProfileImageUploadsController";
import GetCurrentUserController from "./users/me/GetCurrentUserController";

export const apiControllers = [
	GetCurrentUserController,
	PostGoogleLoginController,
	PostLogoutController,
	GetFeedController,
	GetHikingArticlesController,
	PostHikingsController,
	PatchHikingController,
	DeleteHikingController,
	PostArticlesController,
	GetArticleController,
	PatchArticleController,
	DeleteArticleController,
	PostArticleLikeController,
	DeleteArticleLikeController,
	PostArticleMediaUploadTargetsController,
	DeleteArticleMediaUploadsController,
	GetArticleCommentsController,
	PostArticleCommentsController,
	PatchCommentController,
	DeleteCommentController,
	PostCommentLikeController,
	DeleteCommentLikeController,
	PatchProfileDisplayNameController,
	PatchProfileEmailController,
	PatchProfileImageController,
	PostProfileImageUploadTargetController,
	DeleteProfileImageUploadsController,
	GetNotificationsController,
	PatchNotificationReadController,
	PatchNotificationsReadAllController,
	GetMembersController,
	PatchMemberRoleController,
	GetGeocodingSearchController,
] as const;
