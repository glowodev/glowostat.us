#!/usr/bin/env bash
# Orchestrate the full deploy:
#   1. Sync HEAD's tree to github main as a squashed commit → BUILD_SHA
#   2. Build landing with that SHA (Astro picks it up via process.env.BUILD_SHA)
#   3. Deploy the worker with the same SHA as a runtime env var
#
# Both surfaces (the static HTML's "Live commit" link and the worker's
# X-Build response header) end up with the same github SHA, so the public
# commit URL always resolves.

set -euo pipefail

BUILD_SHA=$(scripts/publish-github.sh)
export BUILD_SHA

echo "→ BUILD_SHA = $BUILD_SHA (github)"

pnpm run build
wrangler deploy --var "BUILD_SHA:$BUILD_SHA"
