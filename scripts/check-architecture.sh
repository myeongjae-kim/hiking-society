#!/usr/bin/env bash
set -euo pipefail

failures=0

check_no_matches() {
  local label="$1"
  local pattern="$2"
  local target="$3"

  if rg -n "$pattern" "$target"; then
    printf '\narchitecture violation: %s\n' "$label" >&2
    failures=$((failures + 1))
  fi
}

check_no_matches_glob() {
  local label="$1"
  local pattern="$2"
  local target="$3"
  local include_glob="$4"

  if rg -n -g "$include_glob" "$pattern" "$target"; then
    printf '\narchitecture violation: %s\n' "$label" >&2
    failures=$((failures + 1))
  fi
}

check_no_matches \
  "core must not import web/framework modules" \
  "from ['\"](#/|@/src|react($|/)|react-dom($|/)|@tanstack/|hono($|/))" \
  src/core

check_no_matches \
  "src/features/shared must not import other product features" \
  "#/features/(article|auth|comment|feed|hiking|media|member|notification|profile)(/|['\"])" \
  src/features/shared

check_no_matches \
  "web adapters must not directly depend on outbound ports" \
  "application/port/out|applicationContext\\(\\)\\.get\\(['\"][^'\"]*Port['\"]\\)" \
  src/routes src/api src/features

check_no_matches_glob \
  "core domain/model must stay independent from application, adapters, config, database, and web modules" \
  "from ['\"].*(application/|adapter/|core/config|@/drizzle|drizzle/schema|#/|react($|/)|react-dom($|/)|@tanstack/|hono($|/))" \
  src/core \
  "**/{domain,model}/**/*.ts"

check_no_matches_glob \
  "core application ports must not depend on adapters, config, database, or web modules" \
  "from ['\"].*(adapter/|core/config|@/drizzle|drizzle/schema|#/|react($|/)|react-dom($|/)|@tanstack/|hono($|/))" \
  src/core \
  "**/application/port/**/*.ts"

check_no_matches_glob \
  "core application services must not depend on adapters, database schema, or web modules" \
  "from ['\"].*(adapter/|@/drizzle|drizzle/schema|#/|react($|/)|react-dom($|/)|@tanstack/|hono($|/))" \
  src/core \
  "**/application/*.ts"

if (( failures > 0 )); then
  exit 1
fi

printf 'Architecture checks passed.\n'
