#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${VERCEL_DEPLOYMENT_TOKEN:-}" ]]; then
  echo "VERCEL_DEPLOYMENT_TOKEN is required." >&2
  exit 1
fi

if [[ -z "${VERCEL_TEAM_ID:-}" ]]; then
  echo "VERCEL_TEAM_ID is required." >&2
  exit 1
fi

if [[ -z "${VERCEL_DEPLOYMENT_ID:-}" ]]; then
  echo "VERCEL_DEPLOYMENT_ID is required." >&2
  exit 1
fi

WAIT_TIMEOUT_SECONDS="${VERCEL_WAIT_TIMEOUT_SECONDS:-1200}"
WAIT_INTERVAL_SECONDS="${VERCEL_WAIT_INTERVAL_SECONDS:-10}"
STARTED_AT="$(date +%s)"

while true; do
  RESPONSE="$(curl --fail --silent --show-error \
    "https://api.vercel.com/v13/deployments/${VERCEL_DEPLOYMENT_ID}?teamId=${VERCEL_TEAM_ID}" \
    -H "Authorization: Bearer ${VERCEL_DEPLOYMENT_TOKEN}" \
    -H "Content-Type: application/json")"

  READY_STATE="$(echo "${RESPONSE}" | jq -r '.readyState // .status // "UNKNOWN"')"
  READY_SUBSTATE="$(echo "${RESPONSE}" | jq -r '.readySubstate // empty')"
  DEPLOYMENT_URL="$(echo "${RESPONSE}" | jq -r '.url // empty')"
  INSPECTOR_URL="$(echo "${RESPONSE}" | jq -r '.inspectorUrl // empty')"
  ERROR_MESSAGE="$(echo "${RESPONSE}" | jq -r '.errorMessage // .readyStateReason // empty')"

  MESSAGE="Vercel deployment ${VERCEL_DEPLOYMENT_ID} is ${READY_STATE}"
  if [[ -n "${READY_SUBSTATE}" ]]; then
    MESSAGE="${MESSAGE} (${READY_SUBSTATE})"
  fi
  if [[ -n "${DEPLOYMENT_URL}" ]]; then
    MESSAGE="${MESSAGE}: https://${DEPLOYMENT_URL}"
  fi
  echo "${MESSAGE}"

  case "${READY_STATE}" in
    READY)
      if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
        echo "url=${DEPLOYMENT_URL}" >> "${GITHUB_OUTPUT}"
        echo "inspectorUrl=${INSPECTOR_URL}" >> "${GITHUB_OUTPUT}"
        echo "readyState=${READY_STATE}" >> "${GITHUB_OUTPUT}"
        echo "readySubstate=${READY_SUBSTATE}" >> "${GITHUB_OUTPUT}"
      fi
      exit 0
      ;;
    ERROR|CANCELED|BLOCKED)
      if [[ -n "${ERROR_MESSAGE}" ]]; then
        echo "Vercel deployment failed: ${ERROR_MESSAGE}" >&2
      else
        echo "Vercel deployment failed with state ${READY_STATE}." >&2
      fi
      exit 1
      ;;
  esac

  NOW="$(date +%s)"
  if (( NOW - STARTED_AT >= WAIT_TIMEOUT_SECONDS )); then
    echo "Timed out after ${WAIT_TIMEOUT_SECONDS}s waiting for Vercel deployment ${VERCEL_DEPLOYMENT_ID}." >&2
    exit 1
  fi

  sleep "${WAIT_INTERVAL_SECONDS}"
done
