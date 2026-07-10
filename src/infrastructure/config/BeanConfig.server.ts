import type { BeanConfig } from "inversify-typesafe-spring-like";
import type { AutowiredBeans } from "@/core/config/DependencyTokens";
import { ArticleCommandDrizzleAdapter } from "../article/adapter/ArticleCommandDrizzleAdapter";
import { ArticleDetailDrizzleAdapter } from "../article/adapter/ArticleDetailDrizzleAdapter";
import { S3MediaStorageAdapter } from "../article/adapter/S3MediaStorageAdapter";
import { ArticleCommandService } from "@/core/article/application/ArticleCommandService";
import { ArticleMediaUploadService } from "@/core/article/application/ArticleMediaUploadService";
import { GetArticleDetailService } from "@/core/article/application/GetArticleDetailService";
import { GetArticlePageService } from "@/core/article/application/GetArticlePageService";
import { AuthCommandAdapter } from "../auth/adapter/AuthCommandAdapter";
import { AuthQueryAdapter } from "../auth/adapter/AuthQueryAdapter";
import { GoogleOAuthAdapter } from "../auth/adapter/GoogleOAuthAdapter";
import { JoseTokenCodecAdapter } from "../auth/adapter/JoseTokenCodecAdapter";
import { CreateSessionTokenService } from "@/core/auth/application/CreateSessionTokenService";
import { GetCookieOptionsService } from "@/core/auth/application/GetCookieOptionsService";
import { LoginWithGoogleCodeService } from "@/core/auth/application/LoginWithGoogleCodeService";
import { ResolveSessionService } from "@/core/auth/application/ResolveSessionService";
import { VerifyTokenService } from "@/core/auth/application/VerifyTokenService";
import { CookieConfig } from "@/core/auth/config/CookieConfig";
import { CommentCommandDrizzleAdapter } from "../comment/adapter/CommentCommandDrizzleAdapter";
import { CommentQueryDrizzleAdapter } from "../comment/adapter/CommentQueryDrizzleAdapter";
import { CommentCommandService } from "@/core/comment/application/CommentCommandService";
import { ListArticleCommentsService } from "@/core/comment/application/ListArticleCommentsService";
import { DrizzleTransactionAdapter } from "../common/adapter/DrizzleTransactionAdapter";
import { DrizzleTransactionRunner } from "../common/adapter/DrizzleTransactionRunner";
import { SystemClockAdapter } from "../common/adapter/SystemClockAdapter";
import { FeedDrizzleAdapter } from "../feed/adapter/FeedDrizzleAdapter";
import { GetFeedHomeService } from "@/core/feed/application/GetFeedHomeService";
import { ListFeedService } from "@/core/feed/application/ListFeedService";
import { NominatimGeocodingAdapter } from "../geocoding/adapter/NominatimGeocodingAdapter";
import { SearchGeocodingService } from "@/core/geocoding/application/SearchGeocodingService";
import { HikingDrizzleAdapter } from "../hiking/adapter/HikingDrizzleAdapter";
import { HikingCommandService } from "@/core/hiking/application/HikingCommandService";
import { LikeDrizzleAdapter } from "../like/adapter/LikeDrizzleAdapter";
import { LikeCommandService } from "@/core/like/application/LikeCommandService";
import { MemberCommandAdapter } from "../member/adapter/MemberCommandAdapter";
import { MemberQueryAdapter } from "../member/adapter/MemberQueryAdapter";
import { GetMemberManagementService } from "@/core/member/application/GetMemberManagementService";
import { ListMembersService } from "@/core/member/application/ListMembersService";
import { UpdateMemberRoleService } from "@/core/member/application/UpdateMemberRoleService";
import { NotificationDrizzleAdapter } from "../notification/adapter/NotificationDrizzleAdapter";
import { CreateNotificationsService } from "@/core/notification/application/CreateNotificationsService";
import { ListNotificationsService } from "@/core/notification/application/ListNotificationsService";
import { MarkNotificationReadService } from "@/core/notification/application/MarkNotificationReadService";
import { ProfileDrizzleAdapter } from "../profile/adapter/ProfileDrizzleAdapter";
import { S3ProfileImageStorageAdapter } from "../profile/adapter/S3ProfileImageStorageAdapter";
import { ProfileImageUploadService } from "@/core/profile/application/ProfileImageUploadService";
import { UpdateDisplayNameService } from "@/core/profile/application/UpdateDisplayNameService";
import { UpdateEmailService } from "@/core/profile/application/UpdateEmailService";
import { UpdateProfileImageService } from "@/core/profile/application/UpdateProfileImageService";
import { env } from "./env.server";

export type Beans = Omit<AutowiredBeans, "DrizzleTransactionRunner"> & {
	DrizzleTransactionRunner: DrizzleTransactionRunner;
};

export const beanConfig: BeanConfig<Beans> = {
	ArticleCommandPort: (bind) => bind().to(ArticleCommandDrizzleAdapter),
	ArticleDetailQueryPort: (bind) => bind().to(ArticleDetailDrizzleAdapter),
	ArticleCommandUseCase: (bind) => bind().to(ArticleCommandService),
	ArticleMediaUploadUseCase: (bind) => bind().to(ArticleMediaUploadService),
	AuthCommandPort: (bind) => bind().to(AuthCommandAdapter),
	AuthQueryPort: (bind) => bind().to(AuthQueryAdapter),
	CommentCommandPort: (bind) => bind().to(CommentCommandDrizzleAdapter),
	CommentCommandUseCase: (bind) => bind().to(CommentCommandService),
	CommentQueryPort: (bind) => bind().to(CommentQueryDrizzleAdapter),
	FeedQueryPort: (bind) => bind().to(FeedDrizzleAdapter),
	GeocodingSearchPort: (bind) => bind().to(NominatimGeocodingAdapter),
	GoogleOAuthPort: (bind) => bind().to(GoogleOAuthAdapter),
	HikingCommandPort: (bind) => bind().to(HikingDrizzleAdapter),
	HikingCommandUseCase: (bind) => bind().to(HikingCommandService),
	LikeCommandPort: (bind) => bind().to(LikeDrizzleAdapter),
	LikeCommandUseCase: (bind) => bind().to(LikeCommandService),
	ListFeedUseCase: (bind) => bind().to(ListFeedService),
	ListArticleCommentsUseCase: (bind) => bind().to(ListArticleCommentsService),
	LoginWithGoogleCodeUseCase: (bind) => bind().to(LoginWithGoogleCodeService),
	MediaStoragePort: (bind) => bind().to(S3MediaStorageAdapter),
	ResolveSessionUseCase: (bind) => bind().to(ResolveSessionService),
	VerifyAccessTokenUseCase: (bind) => bind().to(VerifyTokenService),
	VerifyRefreshTokenUseCase: (bind) => bind().to(VerifyTokenService),
	CreateSessionTokenUseCase: (bind) => bind().to(CreateSessionTokenService),
	CookieConfig: (bind) => bind().to(CookieConfig),
	GetCookieOptionsUseCase: (bind) => bind().to(GetCookieOptionsService),
	GetArticleDetailUseCase: (bind) => bind().to(GetArticleDetailService),
	GetArticlePageUseCase: (bind) => bind().to(GetArticlePageService),
	GetFeedHomeUseCase: (bind) => bind().to(GetFeedHomeService),
	GetMemberManagementUseCase: (bind) => bind().to(GetMemberManagementService),
	MemberCommandPort: (bind) => bind().to(MemberCommandAdapter),
	MemberQueryPort: (bind) => bind().to(MemberQueryAdapter),
	NotificationCommandPort: (bind) => bind().to(NotificationDrizzleAdapter),
	NotificationQueryPort: (bind) => bind().to(NotificationDrizzleAdapter),
	CreateNotificationsUseCase: (bind) => bind().to(CreateNotificationsService),
	ListMembersUseCase: (bind) => bind().to(ListMembersService),
	ListNotificationsUseCase: (bind) => bind().to(ListNotificationsService),
	MarkAllNotificationsReadUseCase: (bind) =>
		bind().to(MarkNotificationReadService),
	MarkNotificationReadUseCase: (bind) => bind().to(MarkNotificationReadService),
	UpdateMemberRoleUseCase: (bind) => bind().to(UpdateMemberRoleService),
	ProfileCommandPort: (bind) => bind().to(ProfileDrizzleAdapter),
	ProfileImageUploadUseCase: (bind) => bind().to(ProfileImageUploadService),
	ProfileImageStoragePort: (bind) => bind().to(S3ProfileImageStorageAdapter),
	ProfileQueryPort: (bind) => bind().to(ProfileDrizzleAdapter),
	TokenCodecPort: (bind) => bind().to(JoseTokenCodecAdapter),
	TransactionPort: (bind) => bind().to(DrizzleTransactionAdapter),
	DrizzleTransactionRunner: (bind) => bind().to(DrizzleTransactionRunner),
	ClockPort: (bind) => bind().to(SystemClockAdapter),
	UpdateDisplayNameUseCase: (bind) => bind().to(UpdateDisplayNameService),
	UpdateEmailUseCase: (bind) => bind().to(UpdateEmailService),
	UpdateProfileImageUseCase: (bind) => bind().to(UpdateProfileImageService),
	SearchGeocodingUseCase: (bind) => bind().to(SearchGeocodingService),
	TextEncoder: (bind) => bind().to(TextEncoder),
	DATABASE_PRIMARY_URL: (bind) => bind().toConstantValue(env.DATABASE_URL),
	DATABASE_REPLICA_URL: (bind) => bind().toConstantValue(env.DATABASE_URL),
	JWT_SECRET: (bind) => bind().toConstantValue(env.JWT_SECRET),
	GOOGLE_LOGIN_CLIENT_ID: (bind) =>
		bind().toConstantValue(env.GOOGLE_LOGIN_CLIENT_ID),
	GOOGLE_LOGIN_CLIENT_SECRET: (bind) =>
		bind().toConstantValue(env.GOOGLE_LOGIN_CLIENT_SECRET),
	NODE_ENV: (bind) => bind().toConstantValue(process.env.NODE_ENV),
	S3_PUBLIC_BASE_URL: (bind) => bind().toConstantValue(env.S3_PUBLIC_BASE_URL),
};
