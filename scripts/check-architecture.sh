#!/usr/bin/env bash
set -euo pipefail

feature_server_files="$(
	find src/features -type f \( -name '*.functions.ts' -o -name '*.actions.ts' \) -print
)"

if [[ -n "$feature_server_files" ]]; then
	echo "Server function/action files must live under src/app-features, not src/features:" >&2
	echo "$feature_server_files" >&2
	exit 1
fi

app_feature_ui_files="$(
	find src/app-features -type f \( -name '*.tsx' -o -name '*.css' \) -print
)"

if [[ -n "$app_feature_ui_files" ]]; then
	echo "src/app-features is a server-function boundary and must not contain UI/style files:" >&2
	echo "$app_feature_ui_files" >&2
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

./node_modules/.bin/depcruise --config .dependency-cruiser.mjs src
