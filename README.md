# hiking-society

산행 모임의 피드, 글, 댓글, 좋아요, 알림, 회원/프로필을 다루는 TanStack Start 애플리케이션입니다.

## Architecture

이 프로젝트의 구조는 다음 원칙을 기준으로 잡습니다.

- **Screaming Architecture**: 최상위 구조가 기술 스택보다 제품의 기능을 먼저 드러내야 합니다.
- **Port and Adapter Architecture**: 핵심 정책은 `src/core`의 application/domain/model이 소유하고, DB/S3/OAuth 같은 외부 I/O는 adapter 뒤에 둡니다.
- **Core는 객체지향**: use case service가 객체로 협력하며 정책을 명시합니다.
- **Web 영역은 함수형**: route, controller, server function, React hook은 요청/응답 변환과 순수 계산, effect orchestration을 분리합니다.

HTTP 경로, OpenAPI wire shape, DB schema는 외부 계약입니다. 구조 변경 시에도 호환성을 유지합니다. 다만 앱 내부의 read model 타입과 런타임 검증 schema는 `src/core`를 canonical source로 삼고, REST/OpenAPI adapter는 그 core schema에서 wire schema를 파생합니다.

## Directory Layout

```txt
src/
  core/
    {feature}/
      domain/            # 도메인 식별자, 값 타입, 핵심 모델
      model/             # application에서 쓰는 feature별 모델/팩토리
      application/
        *Service.ts      # use case 정책
        port/in/         # 웹/외부에서 호출하는 use case 인터페이스
        port/out/        # application이 필요로 하는 I/O 인터페이스
    common/              # 공통 domain/application 타입
    config/              # DI token 타입과 @Autowired
  infrastructure/
    {feature}/adapter/   # Drizzle, S3, OAuth 등 구체 구현
    common/adapter/      # transaction, clock 등 공통 adapter
    config/              # DI wiring과 environment binding
  routes/                # TanStack Start file routes
  society-app/           # route-facing server functions와 앱 서버 context
  api/                   # Hono/OpenAPI HTTP adapter
  society/               # 등산 모임 제품 UI, client hooks, client-side utilities
  config/                # client/runtime configuration
  integrations/          # TanStack Query 등 기술 통합
  styles/                # 전역 스타일
  theme/                 # 테마 정의

drizzle/schema.ts        # DB schema source of truth
drizzle/migrations/      # Drizzle migration output
scripts/                 # 정적/아키텍처 검증 스크립트
```

## Core Boundary

`src/core`는 제품 정책의 중심입니다. React, TanStack, Hono, `src/society`, `src/routes`, `src/api`를 import하지 않습니다.

의존 방향은 항상 안쪽으로 향합니다.

```txt
src/routes, src/api, src/society-app, src/society
        |
        v
src/core/{feature}/application/port/in
        |
        v
src/core/{feature}/application service
        |
        v
src/core/{feature}/application/port/out
        ^
        |
src/infrastructure/{feature}/adapter
```

application service가 판단해야 하는 정책 예시는 다음과 같습니다.

- 글은 미디어 없이 생성/수정할 수 없습니다.
- 글이 있는 산행은 삭제할 수 없습니다.
- 답글 대상 댓글은 같은 글에 속하고 삭제되지 않은 댓글이어야 합니다.
- 좋아요/댓글/글 생성 시 어떤 알림을 누구에게 만들지는 application/domain 쪽에서 결정합니다.
- 세션 resolve는 access/refresh token 검증과 user 조회를 `ResolveSessionUseCase` 안에 숨깁니다.

adapter는 다음만 담당합니다.

- DB 조회/반영
- S3/OAuth/외부 SDK 호출
- persistence row와 core model 사이 mapping
- transaction 같은 I/O 일관성

adapter가 권한 없음, 대상 없음, 삭제 가능 여부, 알림 수신자 타입 같은 제품 정책을 결정하면 경계 위반입니다.

## Society Boundary

`src/society-app`는 제품 기능 단위의 server function boundary입니다. route loader와 REST controller가 함께 써야 하는 접근 정책/조회 조립은 먼저 `src/core/**/application/port/in` 유스케이스로 올리고, `src/society-app`는 쿠키/테마/read-current-user 같은 웹 작업만 더합니다.

`src/society`는 제품 기능 단위의 웹/UI 코드입니다.

현재 주요 feature는 `article`, `auth`, `comment`, `feed`, `hiking`, `media`, `member`, `notification`, `profile`, `shared`입니다.

규칙:

- `src/society/shared`는 다른 feature를 import하지 않습니다.
- feature 간 조합이 필요하면 더 구체적인 feature 쪽에서 조합합니다.
- 예를 들어 `AuthorBadge`는 순수 badge 컴포넌트이고, 프로필 이미지 preview는 `article` 쪽에서 `MediaViewer`를 render prop으로 주입합니다.
- 큰 hook은 순수 계산 함수와 effect orchestration hook으로 나눕니다.
- `src/society`는 `src/society-app`를 import하지 않습니다. server function은 route나 society-app boundary를 통해 주입합니다.

`src/society` 아래에는 제품의 기능적 어휘를 둡니다. `integrations`, `routes`, `styles`, `theme`처럼 기술적 관심사는 `src` 최상위의 별도 디렉터리에 둡니다.

## Web Adapters

`src/routes`는 TanStack Start route adapter입니다. route 파일은 loader, component wiring, route-level redirect 정도를 맡고 정책은 core use case로 위임합니다.

`src/api`는 Hono/OpenAPI HTTP adapter입니다. controller는 request/response 변환, 인증 context 확인, use case 호출, API error 변환만 담당합니다.

REST response schema는 가능한 한 `src/core/**/**Schema.ts`에서 파생합니다. API-only request body, query string, upload target 같은 wire 전용 schema만 `src/api/schemas.ts`에 직접 둡니다.

`src/society-app/**.functions.ts`는 TanStack Start server function boundary입니다. cookie read/write나 form payload 변환 같은 웹 작업만 담당하고, out-port를 직접 쓰지 않습니다.

route loader와 REST controller에서 같은 권한/조회 정책이 필요하면 controller와 server function 양쪽에 조건문을 복제하지 않습니다. 먼저 core in-port 유스케이스를 만들고 두 inbound adapter가 그 유스케이스를 호출합니다.

API client 규칙:

- `fetchClient`를 직접 쓰지 않습니다.
- query/mutation은 `$api.useQuery()`와 `$api.useMutation()`을 사용합니다.
- query key가 필요하면 `$api.queryOptions().queryKey`에서 가져옵니다.

## Error Handling

core application 정책 오류는 `ApplicationError`로 표현합니다.

API layer는 `ApplicationError`를 `ApiError`로 변환합니다.

```txt
ApplicationError.BAD_REQUEST  -> 400
ApplicationError.UNAUTHORIZED -> 401
ApplicationError.FORBIDDEN    -> 403
ApplicationError.NOT_FOUND    -> 404
ApplicationError.CONFLICT     -> 409
```

도메인/application에서 HTTP 응답 객체나 Hono context를 만들지 않습니다.

## Data and Schema

DB schema의 source of truth는 `drizzle/schema.ts`입니다.

규칙:

- 테이블 이름은 단수형으로 둡니다.
- table 변수는 `{name}Table` 패턴을 사용합니다.
- DB schema inferred row type은 core application/model contract로 누수시키지 않습니다.
- adapter가 persistence row를 domain/model 타입으로 mapping합니다.

## Dependency Injection

core의 DI token 타입과 `@Autowired` helper는 `src/core/config`에 둡니다. 실제 wiring과 환경값 binding은 `src/infrastructure/config/BeanConfig.server.ts`에서 관리합니다.

웹 영역은 `src/infrastructure/config/getUseCase.ts`의 typed boundary로 in-port를 호출합니다. `src/**`에서 `application/port/out`, concrete adapter, 또는 `applicationContext().get('*Port')`를 직접 쓰지 않습니다.

## Architecture Checks

아키텍처 회귀를 막기 위해 `scripts/check-architecture.sh`를 둡니다.

검사 내용:

- `src/core`가 웹/프레임워크 모듈과 client config를 import하지 않는지 확인합니다.
- `src/core`가 `src/infrastructure`를 import하지 않는지 확인합니다.
- `src/society/shared`가 다른 feature를 import하지 않는지 확인합니다.
- `src/routes`, `src/api`, `src/society-app`, `src/society`가 outbound port 또는 `applicationContext().get('*Port')`를 직접 쓰지 않는지 확인합니다.
- `src/society-app`가 UI feature에 의존하지 않고, `src/society`가 server-function boundary에 의존하지 않는지 확인합니다.

일상 검증:

```bash
/opt/homebrew/bin/pnpm lint
/opt/homebrew/bin/pnpm build
/opt/homebrew/bin/pnpm find-deadcode
```

`pnpm lint`는 Biome, TypeScript, architecture check를 함께 실행합니다.

## References

- https://myeongjae.kim/blog/2026/02/14/nextjs-fullstack-and-serverless-backend-architecture-proposal
- https://johngrib.github.io/wiki/article/hierarchical-controller-package-structure/
