#!/bin/bash
# Stop hook: ensures the project builds before Claude declares "done"
# Exit 0 = success, Exit 2 = block (forces Claude to fix)

# Check if stop_hook_active to prevent infinite loop
STOP_ACTIVE=$(cat /dev/stdin | jq -r '.stop_hook_active // false')
if [ "$STOP_ACTIVE" = "true" ]; then
  exit 0
fi

cd "$(dirname "$0")/../.." || exit 0

# Only enforce build if source files were modified
if git diff --name-only HEAD 2>/dev/null | grep -q "^src/"; then
  echo "Running build check..." >&2
  npm run build 2>&1
  BUILD_EXIT=$?

  if [ $BUILD_EXIT -ne 0 ]; then
    echo "Build failed. Fix the errors before finishing." >&2
    exit 2
  fi

  echo "Build passed." >&2
fi

exit 0
