#!/bin/bash

# Security Scanning Hook (PreToolUse)
#
# Runs before Bash operations to prevent accidental exposure of secrets
# Blocks operations that might commit API keys, tokens, or other sensitive data

# Read hook input from stdin
input=$(cat)

# Extract command from JSON input
command=$(echo "$input" | grep -o '"command":"[^"]*"' | sed 's/"command":"//;s/"$//')

# Patterns to detect secrets and sensitive operations
patterns=(
  "AWS_SECRET_ACCESS_KEY"
  "CLOUDFLARE_API_TOKEN"
  "SENTRY_AUTH_TOKEN"
  "-----BEGIN PRIVATE KEY-----"
  "-----BEGIN RSA PRIVATE KEY-----"
  "api[_-]?key.*=.*['\"][a-zA-Z0-9]{20,}['\"]"
  "secret.*=.*['\"][a-zA-Z0-9]{20,}['\"]"
  "password.*=.*['\"][^'\"]{8,}['\"]"
  "token.*=.*['\"][a-zA-Z0-9]{20,}['\"]"
)

# Check if command contains git commit or git push
if echo "$command" | grep -qE "git\s+(commit|push|add)"; then
  # Get list of staged files
  staged_files=$(cd "$CLAUDE_PROJECT_DIR" && git diff --cached --name-only 2>/dev/null)

  # Check each staged file for secrets
  while IFS= read -r file; do
    if [ -f "$CLAUDE_PROJECT_DIR/$file" ]; then
      for pattern in "${patterns[@]}"; do
        if grep -qE "$pattern" "$CLAUDE_PROJECT_DIR/$file" 2>/dev/null; then
          echo "{\"continue\": false, \"reason\": \"Security scan detected potential secret in $file. Please review and use environment variables for sensitive data.\"}"
          exit 2
        fi
      done
    fi
  done <<< "$staged_files"
fi

# Check if command contains dangerous operations
dangerous_patterns=(
  "rm\s+-rf\s+/"
  "rm\s+-rf\s+\*"
  "chmod\s+-R\s+777"
  "curl.*\|\s*bash"
  "wget.*\|\s*sh"
)

for pattern in "${dangerous_patterns[@]}"; do
  if echo "$command" | grep -qE "$pattern"; then
    echo "{\"continue\": false, \"reason\": \"Blocked potentially dangerous command: $pattern\"}"
    exit 2
  fi
done

# All checks passed
exit 0
