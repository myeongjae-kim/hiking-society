#!/usr/bin/env bash
set -euo pipefail

./node_modules/.bin/depcruise --config .dependency-cruiser.mjs src
