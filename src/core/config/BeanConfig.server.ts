import type { BeanConfig } from "inversify-typesafe-spring-like";
import { ArticleCommandDrizzleAdapter } from "../article/adapter/ArticleCommandDrizzleAdapter";
import { ArticleDetailDrizzleAdapter } from "../article/adapter/ArticleDetailDrizzleAdapter";
import { S3MediaStorageAdapter } from "../article/adapter/S3MediaStorageAdapter";
import { ArticleCommandService } from "../article/application/ArticleCommandService";
import { ArticleMediaUploadService } from "../article/application/ArticleMediaUploadService";
import { GetArticleDetailService } from "../article/application/GetArticleDetailService";
import { GetArticlePageService } from "../article/application/GetArticlePageService";
import type { ArticleCommandUseCase } from "../article/application/port/in/ArticleCommandUseCase";
import type { ArticleMediaUploadUseCase } from "../article/application/port/in/ArticleMediaUploadUseCase";
import type { GetArticleDetailUseCase } from "../article/application/port/in/GetArticleDetailUseCase";
import type { GetArticlePageUseCase } from "../article/application/port/in/GetArticlePageUseCase";
import type { ArticleCommandPort } from "../article/application/port/out/ArticleCommandPort";
import type { ArticleDetailQueryPort } from "../article/application/port/out/ArticleDetailQueryPort";
import type { MediaStoragePort } from "../article/application/port/out/MediaStoragePort";
import { AuthCommandAdapter } from "../auth/adapter/AuthCommandAdapter";
import { AuthQueryAdapter } from "../auth/adapter/AuthQueryAdapter";
import { GoogleOAuthAdapter } from "../auth/adapter/GoogleOAuthAdapter";
import { JoseTokenCodecAdapter } from "../auth/adapter/JoseTokenCodecAdapter";
import { CreateSessionTokenService } from "../auth/application/CreateSessionTokenService";
import { GetCookieOptionsService } from "../auth/application/GetCookieOptionsService";
import { LoginWithGoogleCodeService } from "../auth/application/LoginWithGoogleCodeService";
import type { CreateSessionTokenUseCase } from "../auth/application/port/in/CreateSessionTokenUseCase";
import type { GetCookieOptionsUseCase } from "../auth/application/port/in/GetCookieOptionsUseCase";
import type { LoginWithGoogleCodeUseCase } from "../auth/application/port/in/LoginWithGoogleCodeUseCase";
import type { ResolveSessionUseCase } from "../auth/application/port/in/ResolveSessionUseCase";
import type { VerifyAccessTokenUseCase } from "../auth/application/port/in/VerifyAccessTokenUseCase";
import type { VerifyRefreshTokenUseCase } from "../auth/application/port/in/VerifyRefreshTokenUseCase";
import type { AuthCommandPort } from "../auth/application/port/out/AuthCommandPort";
import type { AuthQueryPort } from "../auth/application/port/out/AuthQueryPort";
import type { GoogleOAuthPort } from "../auth/application/port/out/GoogleOAuthPort";
import type { TokenCodecPort } from "../auth/application/port/out/TokenCodecPort";
import { ResolveSessionService } from "../auth/application/ResolveSessionService";
import { VerifyTokenService } from "../auth/application/VerifyTokenService";
import { CookieConfig } from "../auth/config/CookieConfig";
import { CommentCommandDrizzleAdapter } from "../comment/adapter/CommentCommandDrizzleAdapter";
import { CommentQueryDrizzleAdapter } from "../comment/adapter/CommentQueryDrizzleAdapter";
import { CommentCommandService } from "../comment/application/CommentCommandService";
import { ListArticleCommentsService } from "../comment/application/ListArticleCommentsService";
import type { CommentCommandUseCase } from "../comment/application/port/in/CommentCommandUseCase";
import type { ListArticleCommentsUseCase } from "../comment/application/port/in/ListArticleCommentsUseCase";
import type { CommentCommandPort } from "../comment/application/port/out/CommentCommandPort";
import type { CommentQueryPort } from "../comment/application/port/out/CommentQueryPort";
import { DrizzleTransactionAdapter } from "../common/adapter/DrizzleTransactionAdapter";
import { DrizzleTransactionRunner } from "../common/adapter/drizzle.server";
import { SystemClockAdapter } from "../common/adapter/SystemClockAdapter";
import type { ClockPort } from "../common/application/port/out/ClockPort";
import type { TransactionPort } from "../common/application/port/out/TransactionPort";
import { FeedDrizzleAdapter } from "../feed/adapter/FeedDrizzleAdapter";
import { GetFeedHomeService } from "../feed/application/GetFeedHomeService";
import { ListFeedService } from "../feed/application/ListFeedService";
import type { GetFeedHomeUseCase } from "../feed/application/port/in/GetFeedHomeUseCase";
import type { ListFeedUseCase } from "../feed/application/port/in/ListFeedUseCase";
import type { FeedQueryPort } from "../feed/application/port/out/FeedQueryPort";
import { NominatimGeocodingAdapter } from "../geocoding/adapter/NominatimGeocodingAdapter";
import type { SearchGeocodingUseCase } from "../geocoding/application/port/in/SearchGeocodingUseCase";
import type { GeocodingSearchPort } from "../geocoding/application/port/out/GeocodingSearchPort";
import { SearchGeocodingService } from "../geocoding/application/SearchGeocodingService";
import { HikingDrizzleAdapter } from "../hiking/adapter/HikingDrizzleAdapter";
import { HikingCommandService } from "../hiking/application/HikingCommandService";
import type { HikingCommandUseCase } from "../hiking/application/port/in/HikingCommandUseCase";
import type { HikingCommandPort } from "../hiking/application/port/out/HikingCommandPort";
import { LikeDrizzleAdapter } from "../like/adapter/LikeDrizzleAdapter";
import { LikeCommandService } from "../like/application/LikeCommandService";
import type { LikeCommandUseCase } from "../like/application/port/in/LikeCommandUseCase";
import type { LikeCommandPort } from "../like/application/port/out/LikeCommandPort";
import { MemberCommandAdapter } from "../member/adapter/MemberCommandAdapter";
import { MemberQueryAdapter } from "../member/adapter/MemberQueryAdapter";
import { GetMemberManagementService } from "../member/application/GetMemberManagementService";
import { ListMembersService } from "../member/application/ListMembersService";
import type { GetMemberManagementUseCase } from "../member/application/port/in/GetMemberManagementUseCase";
import type { ListMembersUseCase } from "../member/application/port/in/ListMembersUseCase";
import type { UpdateMemberRoleUseCase } from "../member/application/port/in/UpdateMemberRoleUseCase";
import type { MemberCommandPort } from "../member/application/port/out/MemberCommandPort";
import type { MemberQueryPort } from "../member/application/port/out/MemberQueryPort";
import { UpdateMemberRoleService } from "../member/application/UpdateMemberRoleService";
import { NotificationDrizzleAdapter } from "../notification/adapter/NotificationDrizzleAdapter";
import { CreateNotificationsService } from "../notification/application/CreateNotificationsService";
import { ListNotificationsService } from "../notification/application/ListNotificationsService";
import { MarkNotificationReadService } from "../notification/application/MarkNotificationReadService";
import type { CreateNotificationsUseCase } from "../notification/application/port/in/CreateNotificationsUseCase";
import type { ListNotificationsUseCase } from "../notification/application/port/in/ListNotificationsUseCase";
import type { MarkAllNotificationsReadUseCase } from "../notification/application/port/in/MarkAllNotificationsReadUseCase";
import type { MarkNotificationReadUseCase } from "../notification/application/port/in/MarkNotificationReadUseCase";
import type { NotificationCommandPort } from "../notification/application/port/out/NotificationCommandPort";
import type { NotificationQueryPort } from "../notification/application/port/out/NotificationQueryPort";
import { ProfileDrizzleAdapter } from "../profile/adapter/ProfileDrizzleAdapter";
import { S3ProfileImageStorageAdapter } from "../profile/adapter/S3ProfileImageStorageAdapter";
import { ProfileImageUploadService } from "../profile/application/ProfileImageUploadService";
import type { ProfileImageUploadUseCase } from "../profile/application/port/in/ProfileImageUploadUseCase";
import type { UpdateDisplayNameUseCase } from "../profile/application/port/in/UpdateDisplayNameUseCase";
import type { UpdateEmailUseCase } from "../profile/application/port/in/UpdateEmailUseCase";
import type { UpdateProfileImageUseCase } from "../profile/application/port/in/UpdateProfileImageUseCase";
import type { ProfileCommandPort } from "../profile/application/port/out/ProfileCommandPort";
import type { ProfileImageStoragePort } from "../profile/application/port/out/ProfileImageStoragePort";
import type { ProfileQueryPort } from "../profile/application/port/out/ProfileQueryPort";
import { UpdateDisplayNameService } from "../profile/application/UpdateDisplayNameService";
import { UpdateEmailService } from "../profile/application/UpdateEmailService";
import { UpdateProfileImageService } from "../profile/application/UpdateProfileImageService";
import { env } from "./env.server";

export type UseCaseBeans = {
	ArticleCommandUseCase: ArticleCommandUseCase;
	ArticleMediaUploadUseCase: ArticleMediaUploadUseCase;
	CommentCommandUseCase: CommentCommandUseCase;
	HikingCommandUseCase: HikingCommandUseCase;
	LikeCommandUseCase: LikeCommandUseCase;
	ListArticleCommentsUseCase: ListArticleCommentsUseCase;
	ListFeedUseCase: ListFeedUseCase;
	LoginWithGoogleCodeUseCase: LoginWithGoogleCodeUseCase;
	ResolveSessionUseCase: ResolveSessionUseCase;
	VerifyAccessTokenUseCase: VerifyAccessTokenUseCase;
	VerifyRefreshTokenUseCase: VerifyRefreshTokenUseCase;
	CreateSessionTokenUseCase: CreateSessionTokenUseCase;
	GetCookieOptionsUseCase: GetCookieOptionsUseCase;
	GetArticleDetailUseCase: GetArticleDetailUseCase;
	GetArticlePageUseCase: GetArticlePageUseCase;
	GetFeedHomeUseCase: GetFeedHomeUseCase;
	GetMemberManagementUseCase: GetMemberManagementUseCase;
	ListMembersUseCase: ListMembersUseCase;
	CreateNotificationsUseCase: CreateNotificationsUseCase;
	ListNotificationsUseCase: ListNotificationsUseCase;
	MarkAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase;
	MarkNotificationReadUseCase: MarkNotificationReadUseCase;
	UpdateMemberRoleUseCase: UpdateMemberRoleUseCase;
	ProfileImageUploadUseCase: ProfileImageUploadUseCase;
	UpdateDisplayNameUseCase: UpdateDisplayNameUseCase;
	UpdateEmailUseCase: UpdateEmailUseCase;
	UpdateProfileImageUseCase: UpdateProfileImageUseCase;
	SearchGeocodingUseCase: SearchGeocodingUseCase;
};

type InfrastructureBeans = {
	ArticleCommandPort: ArticleCommandPort;
	ArticleDetailQueryPort: ArticleDetailQueryPort;
	AuthCommandPort: AuthCommandPort;
	AuthQueryPort: AuthQueryPort;
	CommentCommandPort: CommentCommandPort;
	CommentQueryPort: CommentQueryPort;
	FeedQueryPort: FeedQueryPort;
	GeocodingSearchPort: GeocodingSearchPort;
	GoogleOAuthPort: GoogleOAuthPort;
	HikingCommandPort: HikingCommandPort;
	LikeCommandPort: LikeCommandPort;
	MediaStoragePort: MediaStoragePort;
	MemberCommandPort: MemberCommandPort;
	MemberQueryPort: MemberQueryPort;
	NotificationCommandPort: NotificationCommandPort;
	NotificationQueryPort: NotificationQueryPort;
	CookieConfig: CookieConfig;
	ProfileCommandPort: ProfileCommandPort;
	ProfileImageStoragePort: ProfileImageStoragePort;
	ProfileQueryPort: ProfileQueryPort;
	TokenCodecPort: TokenCodecPort;
	TransactionPort: TransactionPort;
	DrizzleTransactionRunner: DrizzleTransactionRunner;
	ClockPort: ClockPort;
	TextEncoder: TextEncoder;
	JWT_SECRET: string;
	GOOGLE_LOGIN_CLIENT_ID: string;
	GOOGLE_LOGIN_CLIENT_SECRET: string;
	NODE_ENV: typeof process.env.NODE_ENV;
	S3_PUBLIC_BASE_URL: string;
};

export type Beans = InfrastructureBeans & UseCaseBeans;

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
	JWT_SECRET: (bind) => bind().toConstantValue(env.JWT_SECRET),
	GOOGLE_LOGIN_CLIENT_ID: (bind) =>
		bind().toConstantValue(env.GOOGLE_LOGIN_CLIENT_ID),
	GOOGLE_LOGIN_CLIENT_SECRET: (bind) =>
		bind().toConstantValue(env.GOOGLE_LOGIN_CLIENT_SECRET),
	NODE_ENV: (bind) => bind().toConstantValue(process.env.NODE_ENV),
	S3_PUBLIC_BASE_URL: (bind) => bind().toConstantValue(env.S3_PUBLIC_BASE_URL),
};
