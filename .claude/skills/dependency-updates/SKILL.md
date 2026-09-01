---
name: dependency-updates
description: Update npm dependencies in phased priority groups with a build + test check between each group, and roll back cleanly if one breaks. Use when bumping packages, running pnpm update, or resolving a peer-dependency conflict after an upgrade.
---

# Dependency Update Workflow

When updating multiple dependencies, follow this phased approach to minimize risk and isolate breaking changes.

## Phase 1: Safety Setup

Before making any changes:

```bash
# 1. Create a safety tag for easy rollback
git tag pre-dependency-update

# 2. Create a feature branch
git checkout -b chore/update-dependencies

# 3. Verify baseline passes
pnpm build && pnpm test:run
```

Document baseline results (number of passing tests, any pre-existing warnings).

## Phase 2: Update by Priority Groups

Update dependencies in phases, verifying after each group:

**Priority 1: Critical/Framework Packages** (highest risk)
- SSR framework packages (vike, vike-react, photon ecosystem)
- These often have peer dependency requirements
- Example:
  ```bash
  pnpm add vike@latest vike-react@latest
  # May require updating peer dependencies
  ```

**Priority 2: Major Version Updates** (high risk)
- Breaking changes expected
- Update one at a time
- Example:
  ```bash
  pnpm add -D @types/node@^22
  ```

**Priority 3: Tooling Updates** (medium risk)
- Build tools (vite, wrangler)
- Linters (eslint, typescript-eslint)
- Example:
  ```bash
  pnpm add -D vite@latest
  ```

**Priority 4: Minor/Patch Updates** (low risk)
- Use `pnpm update` to update all remaining packages
- Example:
  ```bash
  pnpm update
  ```

## Phase 3: Verification After Each Group

After updating each priority group:

```bash
# 1. Build the project
pnpm build

# 2. Run tests
pnpm test:run

# 3. If passing, commit the changes
git add package.json pnpm-lock.yaml
git commit -m "chore: update [group description]

[Brief description of what was updated]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

If build or tests fail:
- Investigate the specific failure
- Check for peer dependency conflicts
- Consider reverting that group and updating packages individually
- Document any pre-existing issues that aren't regressions

## Phase 4: Create Pull Request

After all updates are complete and verified:

```bash
# 1. Push the branch (may require manual user action)
git push -u origin chore/update-dependencies

# 2. Create PR with comprehensive details
gh pr create \
  --title "chore: Update package dependencies" \
  --body "## Summary

[High-level overview]

### Package Updates
[List major updates with version changes]

## Test Results
- Build: ✓ Success
- Tests: [X] passed

## Verification
- [x] Build succeeds
- [x] Tests pass
- [x] No new TypeScript errors
- [x] Pre-existing issues documented

Closes #[issue-number]"
```

## Best Practices

**Do:**
- ✅ Create safety tag before starting
- ✅ Update in phases with verification between each
- ✅ Commit after each successful phase
- ✅ Document pre-existing issues separately from regressions
- ✅ Include test results in PR description

**Don't:**
- ❌ Update all dependencies at once without verification
- ❌ Skip verification steps between phases
- ❌ Combine dependency updates with feature changes
- ❌ Ignore build or test failures as "probably fine"

## Rollback Strategy

If major issues are discovered:

```bash
# Rollback to safety tag
git reset --hard pre-dependency-update

# Or rollback specific commits
git revert HEAD~3..HEAD
```
