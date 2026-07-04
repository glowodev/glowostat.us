#!/usr/bin/env bash
# Publish the current HEAD tree as a single squashed commit on the github
# remote's main branch, then echo the short SHA on stdout for the deploy
# script to consume as BUILD_SHA.
#
# Why: gitlab (origin) keeps the full dev history; github (public) shows
# one clean commit. Building the commit object from the HEAD tree with the
# source commit's date makes the result deterministic — re-running with no
# tree change yields the same SHA, so the force-push is a no-op.

set -euo pipefail

# Refuse to run on a dirty tree — the github orphan is built from HEAD's
# tree, but the Astro build reads the working tree. Letting them drift
# silently produces SHA mismatches between the deployed HTML and github.
if ! git diff-index --quiet HEAD --; then
  echo "publish-github: working tree is dirty — commit before deploy" >&2
  exit 1
fi

tree=$(git rev-parse HEAD^{tree})
date=$(git log -1 --format=%cI HEAD)

new_commit=$(GIT_AUTHOR_DATE="$date" GIT_COMMITTER_DATE="$date" \
  git commit-tree "$tree" -m "feat: glowostat.us — public release")

git push --force github "$new_commit:main" >&2
git rev-parse --short "$new_commit"
