import { BeanConfig } from 'inversify-typesafe-spring-like';
import { AuthCommandAdapter } from '../auth/adapter/AuthCommandAdapter';
import { AuthQueryAdapter } from '../auth/adapter/AuthQueryAdapter';
import { GoogleOAuthAdapter } from '../auth/adapter/GoogleOAuthAdapter';
import { CreateSessionTokenService } from '../auth/application/CreateSessionTokenService';
import { GetCookieOptionsService } from '../auth/application/GetCookieOptionsService';
import { LoginWithGoogleCodeService } from '../auth/application/LoginWithGoogleCodeService';
import { CreateSessionTokenUseCase } from '../auth/application/port/in/CreateSessionTokenUseCase';
import { GetCookieOptionsUseCase } from '../auth/application/port/in/GetCookieOptionsUseCase';
import { LoginWithGoogleCodeUseCase } from '../auth/application/port/in/LoginWithGoogleCodeUseCase';
import { VerifyAccessTokenUseCase } from '../auth/application/port/in/VerifyAccessTokenUseCase';
import { VerifyRefreshTokenUseCase } from '../auth/application/port/in/VerifyRefreshTokenUseCase';
import { AuthCommandPort } from '../auth/application/port/out/AuthCommandPort';
import { AuthQueryPort } from '../auth/application/port/out/AuthQueryPort';
import { GoogleOAuthPort } from '../auth/application/port/out/GoogleOAuthPort';
import { VerifyTokenService } from '../auth/application/VerifyTokenService';
import { CookieConfig } from '../auth/config/CookieConfig';
import { MemberCommandAdapter } from '../member/adapter/MemberCommandAdapter';
import { MemberQueryAdapter } from '../member/adapter/MemberQueryAdapter';
import { ListMembersService } from '../member/application/ListMembersService';
import { ListMembersUseCase } from '../member/application/port/in/ListMembersUseCase';
import { UpdateMemberRoleUseCase } from '../member/application/port/in/UpdateMemberRoleUseCase';
import { MemberCommandPort } from '../member/application/port/out/MemberCommandPort';
import { MemberQueryPort } from '../member/application/port/out/MemberQueryPort';
import { UpdateMemberRoleService } from '../member/application/UpdateMemberRoleService';
import { env } from './env';

export type Beans = {
  AuthCommandPort: AuthCommandPort;
  AuthQueryPort: AuthQueryPort;
  GoogleOAuthPort: GoogleOAuthPort;
  LoginWithGoogleCodeUseCase: LoginWithGoogleCodeUseCase;
  VerifyAccessTokenUseCase: VerifyAccessTokenUseCase;
  VerifyRefreshTokenUseCase: VerifyRefreshTokenUseCase;
  CreateSessionTokenUseCase: CreateSessionTokenUseCase;
  CookieConfig: CookieConfig;
  GetCookieOptionsUseCase: GetCookieOptionsUseCase;
  MemberCommandPort: MemberCommandPort;
  MemberQueryPort: MemberQueryPort;
  ListMembersUseCase: ListMembersUseCase;
  UpdateMemberRoleUseCase: UpdateMemberRoleUseCase;
  TextEncoder: TextEncoder;
  JWT_SECRET: string;
  GOOGLE_LOGIN_CLIENT_ID: string;
  GOOGLE_LOGIN_CLIENT_SECRET: string;
  NODE_ENV: typeof process.env.NODE_ENV;
};

export const beanConfig: BeanConfig<Beans> = {
  AuthCommandPort: (bind) => bind().to(AuthCommandAdapter),
  AuthQueryPort: (bind) => bind().to(AuthQueryAdapter),
  GoogleOAuthPort: (bind) => bind().to(GoogleOAuthAdapter),
  LoginWithGoogleCodeUseCase: (bind) => bind().to(LoginWithGoogleCodeService),
  VerifyAccessTokenUseCase: (bind) => bind().to(VerifyTokenService),
  VerifyRefreshTokenUseCase: (bind) => bind().to(VerifyTokenService),
  CreateSessionTokenUseCase: (bind) => bind().to(CreateSessionTokenService),
  CookieConfig: (bind) => bind().to(CookieConfig),
  GetCookieOptionsUseCase: (bind) => bind().to(GetCookieOptionsService),
  MemberCommandPort: (bind) => bind().to(MemberCommandAdapter),
  MemberQueryPort: (bind) => bind().to(MemberQueryAdapter),
  ListMembersUseCase: (bind) => bind().to(ListMembersService),
  UpdateMemberRoleUseCase: (bind) => bind().to(UpdateMemberRoleService),
  TextEncoder: (bind) => bind().to(TextEncoder),
  JWT_SECRET: (bind) => bind().toConstantValue(env.JWT_SECRET),
  GOOGLE_LOGIN_CLIENT_ID: (bind) => bind().toConstantValue(env.NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID),
  GOOGLE_LOGIN_CLIENT_SECRET: (bind) => bind().toConstantValue(env.GOOGLE_LOGIN_CLIENT_SECRET),
  NODE_ENV: (bind) => bind().toConstantValue(process.env.NODE_ENV),
};
