#!/usr/bin/env bash
set -euo pipefail

# Branches to fix (prefer PR side on conflicts)
BRANCHES=(
  "cursor/application-stability-f4d4"               # PR 23
  "cursor/aowlevel-script-expo-compatibility-9e8e"  # PR 32
  "cursor/video-overlay-protocols-0040"             # PR 35
)

# PRs to retarget to main
PRS_RETARGET=(31 32 35)

# PR merge order
PRS_MERGE=(31 23 32 35)

# --- Checks ---
command -v gh >/dev/null 2>&1 || { echo "gh CLI not found. Install gh in Codespaces first: sudo apt-get update && sudo apt-get install -y gh && gh auth login"; exit 1; }
git status >/dev/null 2>&1 || { echo "Not inside a git repo."; exit 1; }

echo "Fetching origin..."
git fetch origin

# --- Resolve conflicts by keeping PR side (ours) ---
for BR in "${BRANCHES[@]}"; do
  echo "Processing branch: $BR"
  git checkout "$BR"
  git merge origin/main -X ours --no-edit || { echo "Merge failed on $BR"; exit 1; }
  if git status --porcelain | grep -q .; then
    git commit -am "Resolve conflicts favoring PR branch for $BR" || true
  else
    echo "No changes to commit on $BR"
  fi
  git push origin HEAD
done

# --- Retarget PRs to main ---
for PR in "${PRS_RETARGET[@]}"; do
  echo "Retargeting PR #$PR to main"
  gh pr edit "$PR" --base main
done

# --- Merge PRs in order ---
for PR in "${PRS_MERGE[@]}"; do
  echo "Merging PR #$PR"
  gh pr merge "$PR" --merge --delete-branch=false
done

# --- Cleanup merged/redundant branches (keep only main) ---
echo "Cleaning merged/redundant branches"
git checkout main
git branch -r | awk -F'origin/' '/origin\// {print $2}' | grep -v '^main$' | while read -r b; do
  echo "Deleting remote branch $b"
  git push origin ":$b" || true
done

# --- Tests ---
echo "Running lint/tests"
npm install
npm run lint
npm test

echo "Done."
