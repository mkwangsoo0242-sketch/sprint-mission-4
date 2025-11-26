#!/usr/bin/env bash
set -e
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

echo "Setting repository git hooks path to '.githooks'..."
git config core.hooksPath .githooks
mkdir -p .githooks

# Find the local path where this script is (usually in scripts/)
SCRIPT_DIR=$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)
# Try a few common locations to find the versioned hookfile
SRC_HOOKS_CANDIDATES=(
	"$SCRIPT_DIR/../githooks/pre-commit"
	"$REPO_ROOT/githooks/pre-commit"
)
SRC_HOOK=""
for c in "${SRC_HOOKS_CANDIDATES[@]}"; do
	if [ -f "$c" ]; then
		SRC_HOOK="$c"
		break
	fi
done

if [ -z "$SRC_HOOK" ]; then
	# Search repo for githooks/pre-commit within a small depth to avoid scanning everything
	SRC_HOOK=$(find "$REPO_ROOT" -maxdepth 4 -type f -path '*/githooks/pre-commit' -print -quit || true)
fi

if [ -z "$SRC_HOOK" ]; then
	echo "Error: githooks/pre-commit not found. Make sure 'githooks/pre-commit' exists somewhere under the repository." >&2
	exit 1
fi
cp -f "$SRC_HOOK" .githooks/pre-commit
chmod +x .githooks/pre-commit
echo "Installed pre-commit hook to .githooks/pre-commit"
