---
name: git-push-troubleshooting
description: Diagnose a git push or other remote git operation that hangs, times out, or blocks on authentication. Use when push stalls on an SSH passphrase or credential prompt, or when a remote operation should go through the gh CLI instead.
---

# Git Push Troubleshooting

When git push operations hang or timeout, follow these troubleshooting steps:

## 1. Check Remote Protocol

```bash
git remote -v
```

- If SSH (`git@github.com:...`): May require SSH key passphrase or agent authentication
- If HTTPS (`https://github.com/...`): May require credential helper or token

## 2. Prefer GitHub CLI for Remote Operations

When available, use `gh` CLI which handles authentication automatically:

```bash
# Check GitHub CLI authentication status
gh auth status

# View existing pull requests
gh pr view

# List issues
gh issue list
```

**Note**: For creating PRs, user approval is required as it modifies remote state.

## 3. Handle SSH Authentication Issues

If SSH hangs waiting for passphrase:

```bash
# Switch to HTTPS (if gh CLI is authenticated)
git remote set-url origin https://github.com/owner/repo.git

# Then retry push
git push -u origin branch-name
```

## 4. When Push Operations Consistently Fail

If push operations timeout repeatedly:
- Inform the user about the authentication issue
- Let the user handle the push manually
- Continue with next steps (e.g., PR creation using `gh pr create`)

**Remember**: Git operations that modify remote state (push, force-push) may require interactive authentication that cannot be handled in automated scripts.

