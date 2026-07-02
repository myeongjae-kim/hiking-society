import { BeanConfig } from 'inversify-typesafe-spring-like';
import { AuthQueryAdapter } from '../auth/adapter/AuthQueryAdapter';
import { CreateSessionTokenService } from '../auth/application/CreateSessionTokenService';
import { GetCookieOptionsService } from '../auth/application/GetCookieOptionsService';
import { CreateSessionTokenUseCase } from '../auth/application/port/in/CreateSessionTokenUseCase';
import { GetCookieOptionsUseCase } from '../auth/application/port/in/GetCookieOptionsUseCase';
import { VerifyAccessTokenUseCase } from '../auth/application/port/in/VerifyAccessTokenUseCase';
import { VerifyRefreshTokenUseCase } from '../auth/application/port/in/VerifyRefreshTokenUseCase';
import { AuthQueryPort } from '../auth/application/port/out/AuthQueryPort';
import { VerifyTokenService } from '../auth/application/VerifyTokenService';
import { CookieConfig } from '../auth/config/CookieConfig';
import { env } from './env';

export type Beans = {
  AuthQueryPort: AuthQueryPort;
  VerifyAccessTokenUseCase: VerifyAccessTokenUseCase;
  VerifyRefreshTokenUseCase: VerifyRefreshTokenUseCase;
  CreateSessionTokenUseCase: CreateSessionTokenUseCase;
  CookieConfig: CookieConfig;
  GetCookieOptionsUseCase: GetCookieOptionsUseCase;
  TextEncoder: TextEncoder;
  JWT_SECRET: string;
  NODE_ENV: typeof process.env.NODE_ENV;
};

export const beanConfig: BeanConfig<Beans> = {
  AuthQueryPort: (bind) => bind().to(AuthQueryAdapter),
  VerifyAccessTokenUseCase: (bind) => bind().to(VerifyTokenService),
  VerifyRefreshTokenUseCase: (bind) => bind().to(VerifyTokenService),
  CreateSessionTokenUseCase: (bind) => bind().to(CreateSessionTokenService),
  CookieConfig: (bind) => bind().to(CookieConfig),
  GetCookieOptionsUseCase: (bind) => bind().to(GetCookieOptionsService),
  TextEncoder: (bind) => bind().to(TextEncoder),
  JWT_SECRET: (bind) => bind().toConstantValue(env.JWT_SECRET),
  NODE_ENV: (bind) => bind().toConstantValue(process.env.NODE_ENV),
};
