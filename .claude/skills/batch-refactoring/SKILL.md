---
name: batch-refactoring
description: Apply one textual change across many files at once with find + perl, verify it landed, and roll it back safely. Use for repo-wide find-and-replace, renaming a prop or utility across every consumer, migrating a deprecated component API in bulk, or any in-place edit spanning more than a handful of files.
---

# Batch Refactoring Patterns

When making widespread changes to component stories or other files, use these proven patterns for safe, efficient batch operations.

## Find and Replace in Story Files

**Pattern**: Use `perl` one-liners with `find` for precise text replacement across multiple files.

**Basic syntax**:
```bash
find components -name "*.stories.tsx" -type f -print0 | xargs -0 perl -i -pe 's/OLD_PATTERN/NEW_PATTERN/g'
```

**Examples**:

Replace deprecated prop usage:
```bash
# Replace variant="example" with inContext={true}
find components -name "*.stories.tsx" -type f -print0 | xargs -0 perl -i -pe 's/ variant="example"/ inContext={true}/g'

# Replace StorySubsection with StorySection variant="subsection"
find components -name "*.stories.tsx" -type f -print0 | xargs -0 perl -i -pe 's/StorySubsection label=/StorySection title=/g'
```

**Important flags**:
- `-print0` and `-0`: Handle filenames with spaces correctly
- `-i`: Edit files in-place
- `-pe`: Perl one-liner mode with automatic line processing
- `s/OLD/NEW/g`: Substitute globally (all occurrences per line)

## Common Perl Substitution Pitfalls

Silent mistakes in the replacement side of `s///` can mangle hundreds of files before you notice. Before running `-i` across the repo, dry-run once on a single file and diff the output.

**Pitfall: adjacent literal text in the replacement is not implicit concatenation.**

```bash
# Goal: replace aspectRatio="4/3" with aspectRatio="4-3"
# Broken — `$1.4-3.$1` inserts the captured quote, then literal ".4-3.", then the quote again,
# producing aspectRatio=".4-3." (with surrounding dots). There is no "." operator in perl s/// RHS.
perl -i -pe 's{aspectRatio=(["\x27])4/3\1}{aspectRatio=$1.4-3.$1}g' file.tsx

# Correct — no backrefs needed when the quote itself doesn't need to vary
perl -i -pe 's{aspectRatio="4/3"}{aspectRatio="4-3"}g' file.tsx
```

**Dry-run pattern**: pipe to diff before ever using `-i`.

```bash
# Print the transformed file without touching disk; compare to the original
perl -pe 's/OLD/NEW/g' components/atoms/Example/Example.stories.tsx \
  | diff components/atoms/Example/Example.stories.tsx -
```

**After the in-place run**: always grep for the pattern you intended to leave behind *and* a couple of plausible corruptions (e.g. if replacing `4/3` with `4-3`, also grep for `.4-3.`, `4-3-`, `"4-3"`) so a silent mistake surfaces immediately.

## Verify Changes Before Committing

After batch replacements, always verify:

```bash
# Count remaining old patterns (should be 0)
grep -r 'variant="example"' components/**/*.stories.tsx | wc -l

# Show files that still have the old pattern
grep -l 'variant="example"' components/**/*.stories.tsx

# Show context around matches (if any)
grep -n -B2 -A2 'variant="example"' components/**/*.stories.tsx
```

## Safe Backup Pattern

For major refactoring, create backups first:

```bash
# Create timestamped backup
tar -czf "components-backup-$(date +%Y%m%d-%H%M%S).tar.gz" components/

# Or use git to create a safety branch
git checkout -b refactor/component-api-update
git add -A
git commit -m "Checkpoint before batch refactoring"

# After refactoring, verify changes
git diff HEAD~1 --stat
```

## Complex Multi-Step Refactoring

For changes requiring multiple steps:

```bash
# Step 1: Update imports
find components -name "*.stories.tsx" -print0 | xargs -0 perl -i -pe 's/StoryExampleSection/StorySection/g'

# Step 2: Update props
find components -name "*.stories.tsx" -print0 | xargs -0 perl -i -pe 's/<StorySection>/<StorySection title="Examples" inContext={true}>/g'

# Step 3: Verify each step
grep -l "StoryExampleSection" components/**/*.stories.tsx  # Should be empty
```

## Selective File Refactoring

Target specific directories or file patterns:

```bash
# Only atoms
find components/atoms -name "*.stories.tsx" -type f -print0 | xargs -0 perl -i -pe 's/OLD/NEW/g'

# Multiple directories
find components/atoms components/molecules -name "*.stories.tsx" -type f -print0 | xargs -0 perl -i -pe 's/OLD/NEW/g'

# Specific files matching pattern
find components -name "*Button*.tsx" -type f -print0 | xargs -0 perl -i -pe 's/OLD/NEW/g'
```

## TypeScript Verification After Refactoring

Always run TypeScript checks after batch changes:

```bash
# Check for TypeScript errors
pnpm exec tsc --noEmit

# If there are many errors, pipe to file for review
pnpm exec tsc --noEmit 2>&1 | tee typescript-errors.log

# Count errors by type
pnpm exec tsc --noEmit 2>&1 | grep "error TS" | cut -d: -f4 | sort | uniq -c
```

## Rollback Pattern

If something goes wrong:

```bash
# Quick rollback with git (if changes are uncommitted)
git checkout -- components/

# Restore from backup
tar -xzf components-backup-YYYYMMDD-HHMMSS.tar.gz

# Selective rollback of specific files
git checkout -- components/atoms/Button/Button.stories.tsx
```

## Best Practices

**Before Refactoring**:
- [ ] Create a git checkpoint or backup
- [ ] Test the perl command on a single file first
- [ ] Verify the pattern matches exactly what you want to change

**During Refactoring**:
- [ ] Use specific patterns (avoid overly broad regex)
- [ ] Process one type of change at a time
- [ ] Verify after each major step

**After Refactoring**:
- [ ] Run `pnpm exec tsc --noEmit` to check for TypeScript errors
- [ ] Use `grep` to verify old patterns are gone
- [ ] Start Ladle to visually verify story changes
- [ ] Review `git diff` before committing

