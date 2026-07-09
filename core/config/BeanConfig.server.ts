import { BeanConfig } from 'inversify-typesafe-spring-like';
import { ArticleCommandDrizzleAdapter } from '../article/adapter/ArticleCommandDrizzleAdapter';
import { ArticleDetailDrizzleAdapter } from '../article/adapter/ArticleDetailDrizzleAdapter';
import { S3MediaStorageAdapter } from '../article/adapter/S3MediaStorageAdapter';
import { ArticleCommandService } from '../article/application/ArticleCommandService';
import { GetArticleDetailService } from '../article/application/GetArticleDetailService';
import { ArticleCommandUseCase } from '../article/application/port/in/ArticleCommandUseCase';
import { GetArticleDetailUseCase } from '../article/application/port/in/GetArticleDetailUseCase';
import { ArticleCommandPort } from '../article/application/port/out/ArticleCommandPort';
import { ArticleDetailQueryPort } from '../article/application/port/out/ArticleDetailQueryPort';
import { MediaStoragePort } from '../article/application/port/out/MediaStoragePort';
import { AuthCommandAdapter } from '../auth/adapter/AuthCommandAdapter';
import { AuthQueryAdapter } from '../auth/adapter/AuthQueryAdapter';
import { GoogleOAuthAdapter } from '../auth/adapter/GoogleOAuthAdapter';
import { CreateSessionTokenService } from '../auth/application/CreateSessionTokenService';
import { GetCookieOptionsService } from '../auth/application/GetCookieOptionsService';
import { LoginWithGoogleCodeService } from '../auth/application/LoginWithGoogleCodeService';
import { CreateSessionTokenUseCase } from '../auth/application/port/in/CreateSessionTokenUseCase';
import { GetCookieOptionsUseCase } from '../auth/application/port/in/GetCookieOptionsUseCase';
import { LoginWithGoogleCodeUseCase } from '../auth/application/port/in/LoginWithGoogleCodeUseCase';
import { ResolveSessionUseCase } from '../auth/application/port/in/ResolveSessionUseCase';
import { VerifyAccessTokenUseCase } from '../auth/application/port/in/VerifyAccessTokenUseCase';
import { VerifyRefreshTokenUseCase } from '../auth/application/port/in/VerifyRefreshTokenUseCase';
import { AuthCommandPort } from '../auth/application/port/out/AuthCommandPort';
import { AuthQueryPort } from '../auth/application/port/out/AuthQueryPort';
import { GoogleOAuthPort } from '../auth/application/port/out/GoogleOAuthPort';
import { ResolveSessionService } from '../auth/application/ResolveSessionService';
import { VerifyTokenService } from '../auth/application/VerifyTokenService';
import { CookieConfig } from '../auth/config/CookieConfig';
import { CommentCommandService } from '../comment/application/CommentCommandService';
import { ListArticleCommentsService } from '../comment/application/ListArticleCommentsService';
import { CommentCommandUseCase } from '../comment/application/port/in/CommentCommandUseCase';
import { ListArticleCommentsUseCase } from '../comment/application/port/in/ListArticleCommentsUseCase';
import { CommentCommandPort } from '../comment/application/port/out/CommentCommandPort';
import { CommentQueryPort } from '../comment/application/port/out/CommentQueryPort';
import { CommentCommandDrizzleAdapter } from '../comment/adapter/CommentCommandDrizzleAdapter';
import { FeedDrizzleAdapter } from '../feed/adapter/FeedDrizzleAdapter';
import { ListFeedService } from '../feed/application/ListFeedService';
import { ListFeedUseCase } from '../feed/application/port/in/ListFeedUseCase';
import { FeedQueryPort } from '../feed/application/port/out/FeedQueryPort';
import { HikingDrizzleAdapter } from '../hiking/adapter/HikingDrizzleAdapter';
import { HikingCommandService } from '../hiking/application/HikingCommandService';
import { HikingCommandUseCase } from '../hiking/application/port/in/HikingCommandUseCase';
import { HikingCommandPort } from '../hiking/application/port/out/HikingCommandPort';
import { LikeDrizzleAdapter } from '../like/adapter/LikeDrizzleAdapter';
import { LikeCommandService } from '../like/application/LikeCommandService';
import { LikeCommandUseCase } from '../like/application/port/in/LikeCommandUseCase';
import { LikeCommandPort } from '../like/application/port/out/LikeCommandPort';
import { MemberCommandAdapter } from '../member/adapter/MemberCommandAdapter';
import { MemberQueryAdapter } from '../member/adapter/MemberQueryAdapter';
import { ListMembersService } from '../member/application/ListMembersService';
import { ListMembersUseCase } from '../member/application/port/in/ListMembersUseCase';
import { UpdateMemberRoleUseCase } from '../member/application/port/in/UpdateMemberRoleUseCase';
import { MemberCommandPort } from '../member/application/port/out/MemberCommandPort';
import { MemberQueryPort } from '../member/application/port/out/MemberQueryPort';
import { UpdateMemberRoleService } from '../member/application/UpdateMemberRoleService';
import { NotificationDrizzleAdapter } from '../notification/adapter/NotificationDrizzleAdapter';
import { ListNotificationsService } from '../notification/application/ListNotificationsService';
import { MarkNotificationReadService } from '../notification/application/MarkNotificationReadService';
import { ListNotificationsUseCase } from '../notification/application/port/in/ListNotificationsUseCase';
import { MarkAllNotificationsReadUseCase } from '../notification/application/port/in/MarkAllNotificationsReadUseCase';
import { MarkNotificationReadUseCase } from '../notification/application/port/in/MarkNotificationReadUseCase';
import { NotificationCommandPort } from '../notification/application/port/out/NotificationCommandPort';
import { NotificationQueryPort } from '../notification/application/port/out/NotificationQueryPort';
import { ProfileDrizzleAdapter } from '../profile/adapter/ProfileDrizzleAdapter';
import { S3ProfileImageStorageAdapter } from '../profile/adapter/S3ProfileImageStorageAdapter';
import { UpdateProfileService } from '../profile/application/UpdateProfileService';
import { UpdateProfileUseCase } from '../profile/application/port/in/UpdateProfileUseCase';
import { ProfileCommandPort } from '../profile/application/port/out/ProfileCommandPort';
import { ProfileImageStoragePort } from '../profile/application/port/out/ProfileImageStoragePort';
import { ProfileQueryPort } from '../profile/application/port/out/ProfileQueryPort';
import { env } from './env.server';

export type Beans = {
  ArticleCommandPort: ArticleCommandPort;
  ArticleDetailQueryPort: ArticleDetailQueryPort;
  ArticleCommandUseCase: ArticleCommandUseCase;
  AuthCommandPort: AuthCommandPort;
  AuthQueryPort: AuthQueryPort;
  CommentCommandPort: CommentCommandPort;
  CommentCommandUseCase: CommentCommandUseCase;
  CommentQueryPort: CommentQueryPort;
  FeedQueryPort: FeedQueryPort;
  GoogleOAuthPort: GoogleOAuthPort;
  HikingCommandPort: HikingCommandPort;
  HikingCommandUseCase: HikingCommandUseCase;
  LikeCommandPort: LikeCommandPort;
  LikeCommandUseCase: LikeCommandUseCase;
  ListArticleCommentsUseCase: ListArticleCommentsUseCase;
  ListFeedUseCase: ListFeedUseCase;
  LoginWithGoogleCodeUseCase: LoginWithGoogleCodeUseCase;
  MediaStoragePort: MediaStoragePort;
  ResolveSessionUseCase: ResolveSessionUseCase;
  VerifyAccessTokenUseCase: VerifyAccessTokenUseCase;
  VerifyRefreshTokenUseCase: VerifyRefreshTokenUseCase;
  CreateSessionTokenUseCase: CreateSessionTokenUseCase;
  CookieConfig: CookieConfig;
  GetCookieOptionsUseCase: GetCookieOptionsUseCase;
  GetArticleDetailUseCase: GetArticleDetailUseCase;
  MemberCommandPort: MemberCommandPort;
  MemberQueryPort: MemberQueryPort;
  NotificationCommandPort: NotificationCommandPort;
  NotificationQueryPort: NotificationQueryPort;
  ListMembersUseCase: ListMembersUseCase;
  ListNotificationsUseCase: ListNotificationsUseCase;
  MarkAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase;
  MarkNotificationReadUseCase: MarkNotificationReadUseCase;
  UpdateMemberRoleUseCase: UpdateMemberRoleUseCase;
  ProfileCommandPort: ProfileCommandPort;
  ProfileImageStoragePort: ProfileImageStoragePort;
  ProfileQueryPort: ProfileQueryPort;
  UpdateProfileUseCase: UpdateProfileUseCase;
  TextEncoder: TextEncoder;
  JWT_SECRET: string;
  GOOGLE_LOGIN_CLIENT_ID: string;
  GOOGLE_LOGIN_CLIENT_SECRET: string;
  NODE_ENV: typeof process.env.NODE_ENV;
};

export const beanConfig: BeanConfig<Beans> = {
  ArticleCommandPort: (bind) => bind().to(ArticleCommandDrizzleAdapter),
  ArticleDetailQueryPort: (bind) => bind().to(ArticleDetailDrizzleAdapter),
  ArticleCommandUseCase: (bind) => bind().to(ArticleCommandService),
  AuthCommandPort: (bind) => bind().to(AuthCommandAdapter),
  AuthQueryPort: (bind) => bind().to(AuthQueryAdapter),
  CommentCommandPort: (bind) => bind().to(CommentCommandDrizzleAdapter),
  CommentCommandUseCase: (bind) => bind().to(CommentCommandService),
  CommentQueryPort: (bind) => bind().to(FeedDrizzleAdapter),
  FeedQueryPort: (bind) => bind().to(FeedDrizzleAdapter),
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
  MemberCommandPort: (bind) => bind().to(MemberCommandAdapter),
  MemberQueryPort: (bind) => bind().to(MemberQueryAdapter),
  NotificationCommandPort: (bind) => bind().to(NotificationDrizzleAdapter),
  NotificationQueryPort: (bind) => bind().to(NotificationDrizzleAdapter),
  ListMembersUseCase: (bind) => bind().to(ListMembersService),
  ListNotificationsUseCase: (bind) => bind().to(ListNotificationsService),
  MarkAllNotificationsReadUseCase: (bind) => bind().to(MarkNotificationReadService),
  MarkNotificationReadUseCase: (bind) => bind().to(MarkNotificationReadService),
  UpdateMemberRoleUseCase: (bind) => bind().to(UpdateMemberRoleService),
  ProfileCommandPort: (bind) => bind().to(ProfileDrizzleAdapter),
  ProfileImageStoragePort: (bind) => bind().to(S3ProfileImageStorageAdapter),
  ProfileQueryPort: (bind) => bind().to(ProfileDrizzleAdapter),
  UpdateProfileUseCase: (bind) => bind().to(UpdateProfileService),
  TextEncoder: (bind) => bind().to(TextEncoder),
  JWT_SECRET: (bind) => bind().toConstantValue(env.JWT_SECRET),
  GOOGLE_LOGIN_CLIENT_ID: (bind) => bind().toConstantValue(env.NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID),
  GOOGLE_LOGIN_CLIENT_SECRET: (bind) => bind().toConstantValue(env.GOOGLE_LOGIN_CLIENT_SECRET),
  NODE_ENV: (bind) => bind().toConstantValue(process.env.NODE_ENV),
};
