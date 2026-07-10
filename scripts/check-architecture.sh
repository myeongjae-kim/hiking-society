#!/usr/bin/env bash
set -euo pipefail

feature_server_files="$(
	find src/society -type f \( -name '*.functions.ts' -o -name '*.actions.ts' \) -print
)"

if [[ -n "$feature_server_files" ]]; then
	echo "Server function/action files must live under src/society-app, not src/society:" >&2
	echo "$feature_server_files" >&2
	exit 1
fi

app_feature_ui_files="$(
	find src/society-app -type f \( -name '*.tsx' -o -name '*.css' \) -print
)"

if [[ -n "$app_feature_ui_files" ]]; then
	echo "src/society-app is a server-function boundary and must not contain UI/style files:" >&2
	echo "$app_feature_ui_files" >&2
	exit 1
fi

society_to_society_app_imports="$(
	rg -n 'from ["'\'']#/society-app/' src/society --glob '*.{ts,tsx}' || true
)"

if [[ -n "$society_to_society_app_imports" ]]; then
	echo "src/society UI must not import src/society-app, including type-only imports:" >&2
	echo "$society_to_society_app_imports" >&2
	exit 1
fi

society_app_to_society_imports="$(
	rg -n 'from ["'\'']#/society/' src/society-app --glob '*.{ts,tsx}' || true
)"

if [[ -n "$society_app_to_society_imports" ]]; then
	echo "src/society-app server-function boundary must not import src/society UI, including type-only imports:" >&2
	echo "$society_app_to_society_imports" >&2
	exit 1
fi

service_contract_violations="$(
	find src/core -path '*/application/*Service.ts' -type f -print0 | while IFS= read -r -d '' file; do
		if ! perl -0ne 'exit(/export\s+class\s+\w+Service\s+implements\s+[\s\S]*UseCase\b/ ? 0 : 1)' "$file"; then
			printf '%s\n' "$file"
		fi
	done
)"

if [[ -n "$service_contract_violations" ]]; then
	echo "Core application services must be OO use-case objects implementing in-port UseCase interfaces:" >&2
	echo "$service_contract_violations" >&2
	exit 1
fi

cross_feature_out_port_violations="$(
	find src/core -path '*/application/*Service.ts' -type f -print0 | while IFS= read -r -d '' file; do
		feature="${file#src/core/}"
		feature="${feature%%/*}"
		FEATURE="$feature" perl -ne 'while (/from\s+["'\'']@\/core\/([^\/]+)\/application\/port\/out\/[^"'\'']+["'\'']/g) { print "$ARGV:$.: cross-feature outbound port import: $1\n" if $1 ne $ENV{"FEATURE"} && $1 ne "common" }' "$file"
	done
)"

if [[ -n "$cross_feature_out_port_violations" ]]; then
	echo "Core application services should collaborate through in-port use cases, not other feature outbound ports:" >&2
	echo "$cross_feature_out_port_violations" >&2
	exit 1
fi

weak_server_fn_validators="$(
	rg -n 'validator\(\((data|input):' src/society-app src/routes --glob '*.{ts,tsx}' || true
)"

if [[ -n "$weak_server_fn_validators" ]]; then
	echo "TanStack server functions must use runtime validators such as Zod schemas, not type-only validator callbacks:" >&2
	echo "$weak_server_fn_validators" >&2
	exit 1
fi

route_never_assertions="$(
	rg -n 'as never' src/routes --glob '*.{ts,tsx}' || true
)"

if [[ -n "$route_never_assertions" ]]; then
	echo "Routes should model loader/view states explicitly instead of using 'as never' assertions:" >&2
	echo "$route_never_assertions" >&2
	exit 1
fi

boundary_brand_id_casts="$(
	rg -n 'as (ArticleId|HikingId|CommentId|NotificationId)\b' src/api/controllers src/routes src/society-app --glob '*.{ts,tsx}' || true
)"

if [[ -n "$boundary_brand_id_casts" ]]; then
	echo "API controllers, routes, and server-function boundaries must parse branded IDs through validated helpers instead of direct casts:" >&2
	echo "$boundary_brand_id_casts" >&2
	exit 1
fi

direct_fetch_client_usage="$(
	rg -n 'fetchClient|createFetchClient' src --glob '*.{ts,tsx}' --glob '!src/api/client/$api.ts' || true
)"

if [[ -n "$direct_fetch_client_usage" ]]; then
	echo "Do not use fetchClient directly outside src/api/client/\$api.ts; use \$api.useQuery(), \$api.useMutation(), or \$api.queryOptions().queryKey:" >&2
	echo "$direct_fetch_client_usage" >&2
	exit 1
fi

direct_use_case_context_usage="$(
	rg -n 'applicationUseCaseContext|getUseCase\(|[.]get\("[^"]*UseCase"' src/api src/routes src/society-app \
		--glob '*.{ts,tsx}' \
		--glob '!src/api/controllers/index.ts' \
		--glob '!src/api/config/apiRuntimeDependencies.server.ts' \
		--glob '!src/society-app/**/*.functions.ts' || true
)"

if [[ -n "$direct_use_case_context_usage" ]]; then
	echo "Routes, API controllers, API middleware, and society-app server functions should receive explicit dependencies from their composition modules instead of looking up use cases directly:" >&2
	echo "$direct_use_case_context_usage" >&2
	exit 1
fi

unsafe_api_model_casts="$(
	rg -n 'as unknown as (readonly )?(Article|Comment|NotificationListSnapshot|[{])' src/society/feed src/society/notification --glob '*.{ts,tsx}' || true
)"

if [[ -n "$unsafe_api_model_casts" ]]; then
	echo "Feed and notification UI must map API contracts through society/shared/apiContractMappers instead of casting API data into core-shaped models:" >&2
	echo "$unsafe_api_model_casts" >&2
	exit 1
fi

./node_modules/.bin/depcruise --config .dependency-cruiser.mjs src
