# society-app

`src/society-app`는 TanStack Start route들이 공유하는 앱 서버 context 경계입니다.

이 디렉터리는 서버에서 실행되는 코드를 모두 모아두는 곳이 아닙니다. REST API adapter는 `src/api`, 핵심 정책과 use case는 `src/core`, DB/S3/OAuth 같은 외부 I/O 구현은 `src/infrastructure/**/adapter`에 둡니다.

## 이름

`society-app`이라는 이름은 이 디렉터리가 서버 런타임 전체가 아니라 등산 모임 앱 route들이 공유하는 서버 context 경계라는 점을 드러내기 위한 이름입니다.

`server-features`라고 부르면 서버에서 실행되는 모든 feature 코드, 예를 들어 REST API controller, core adapter, DB/OAuth/S3 구현까지 이곳에 모아야 한다는 오해가 생길 수 있습니다. 하지만 이 프로젝트에서 서버 실행 여부는 주된 분류 기준이 아닙니다. 주된 기준은 제품 정책을 소유하는 `core`, HTTP API adapter인 `api`, route adapter인 `routes`, 공유 앱 서버 context인 `society-app`, UI/client product boundary인 `society`의 역할 분리입니다.

따라서 `society-app`은 “등산 모임 앱 route들이 공유하는 서버 context 경계”라는 뜻으로 사용합니다.

## 역할

- 여러 route가 공유하는 `createServerFn`, `createServerOnlyFn` 기반 server function을 배치합니다.
- route loader가 필요한 세션, 쿠키, 테마 같은 웹 서버 context를 읽고 씁니다.
- route 하나에서만 쓰는 data loader server function은 해당 route 파일에 colocate합니다.
- route loader와 REST controller가 함께 써야 하는 접근 정책이나 조회 조립은 직접 판단하지 않고 `src/core/**/application/port/in` use case로 위임합니다.
- UI 컴포넌트, client hook, client-side utility는 `src/society`에 둡니다.

## 경계 규칙

- `src/society-app`는 `src/society`를 import하지 않습니다.
- `src/society`는 `src/society-app`를 import하지 않습니다.
- outbound port, DB schema, adapter를 직접 호출하지 않습니다.
- 제품 정책이 필요하면 먼저 core in-port use case로 올린 뒤 그 use case를 호출합니다.

즉, 이 디렉터리는 “서버 기능 전체”가 아니라 “앱 route들이 공유하는 server context boundary”입니다.
