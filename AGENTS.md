<!-- BEGIN:tanstack-start-agent-rules -->
# This is NOT the tanstack-start you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Before making any TanStack Start-related change, use https://tanstack.com/start/latest/docs/framework/react/guide/routing as the entry point to the latest documentation, then read the current guide relevant to the specific area you are changing (for example routing, server functions, middleware, execution model, authentication, or deployment). Do not treat the routing guide as the only required reference. Heed deprecation notices.
<!-- END:tanstack-start-agent-rules -->

<!-- BEGIN:tooling-agent-rules -->
# Tooling

Use the pnpm executable from the user's normal shell environment for pnpm commands in this repository, not the Codex bundled runtime pnpm. The bundled pnpm can trigger local build-approval prompts that do not reproduce in the user's shell. On this machine, the user's pnpm is currently `/opt/homebrew/bin/pnpm`.
<!-- END:tooling-agent-rules -->

<!-- BEGIN:ui-component-agent-rules -->
# UI Components

When implementing UI, first check the Components section in the WebTUI docs: https://webtui.ironclad.sh/start/intro/

If WebTUI does not provide an appropriate component for the interaction, use Radix UI.

Use Tailwind CSS utilities as much as possible for application styling.
<!-- END:ui-component-agent-rules -->

<!-- BEGIN:api-client-agent-rules -->
# API Client

Do not use `fetchClient` directly. Use `$api.useQuery()` and `$api.useMutation()` instead.

When a `queryKey` is needed, use `$api.queryOptions().queryKey`.
<!-- END:api-client-agent-rules -->

<!-- BEGIN:backend-architecture-agent-rules -->
# Backend Architecture

Manage backend-related code with port and adapter architecture.

- Put feature backend code under `src/core/{feature}`.
- Keep `model`, `domain`, and `application` independent from Next.js, Drizzle, database schema types, request/response APIs, and external SDK implementations.
- Expose inbound behavior through `application/port/in` use case interfaces.
- Hide outbound I/O behind `application/port/out` interfaces.
- Put concrete DB, external API, framework, and SDK implementations under `src/infrastructure/{feature}/adapter`.
- Wire ports to implementations in `src/infrastructure/config/BeanConfig.server.ts`.
- `src/routes`, API controllers, server functions, and framework entrypoints should call application in-ports or query ports instead of importing DB tables directly.
- Auth/domain model types should be owned by `src/core/{feature}/model` or `src/core/{feature}/domain`; adapters map persistence rows into those models.
- Keep `drizzle/schema.ts` as the DB schema source of truth, but do not leak its inferred row types into core application/model contracts.
<!-- END:backend-architecture-agent-rules -->

<!-- BEGIN:db-transaction-agent-rules -->
# DB Transactions

Do not run DB queries with `Promise.all` inside `transactionPort.run()` or `db.transaction()`.

These transaction scopes share a single PostgreSQL client/connection. Starting another DB query before the previous query has completed queues concurrent work on the same client, which triggers the `pg` deprecation warning: `Calling client.query() when the client is already executing a query is deprecated`. In `pg@9.0`, this behavior is expected to become an error. Await DB queries sequentially inside a transaction, or move independent parallel reads outside the transaction scope.
<!-- END:db-transaction-agent-rules -->

<!-- BEGIN:db-schema-agent-rules -->
# DB Schema

Name database tables in the singular form.

In `drizzle/schema.ts`, declare table variables using the `{name}Table` pattern, for example `userTable`.
<!-- END:db-schema-agent-rules -->
