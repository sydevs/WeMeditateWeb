---
paths:
  - "**/*.stories.tsx"
  - "components/ladle/**"
  - ".ladle/**"
---

# Component Development with Ladle

This project uses [Ladle](https://ladle.dev/) for component development and documentation. Ladle
is a lightweight, Vite-powered alternative to Storybook.

**Quick start**:
- Run the component library: `pnpm ladle` (opens at [http://localhost:61000/](http://localhost:61000/))
- Build the static library: `pnpm ladle:build`

**Before you write a story**: read [STORYBOOK.md](../../STORYBOOK.md) first. It documents the
story utility components and the required structure.

Common mistakes when a story skips STORYBOOK.md:
- A raw HTML heading (`<h2>`, `<h3>`) instead of `<StorySection variant="subsection">`
- A deprecated `StorySubsection` or `StoryExampleSection` component
- A missing `inContext={true}` prop on an Examples section
- A manual divider instead of the one `StorySection` renders automatically

Key requirements:
- Create `ComponentName.stories.tsx` alongside the component.
- Export a single `Default` story. Do not add a second story export.
- Set a `title` category, for example `"Atoms / Form"` or `"Molecules / Layout"`.
- Set `storyName` on the `Default` export for a human-readable name.
- Use story utility components for all structure, never raw HTML:
  - `<StorySection>` for a major section.
  - `<StorySection variant="subsection">` for a nested subsection.
  - `<StorySection inContext={true}>` for an Examples section.
  - `StoryGrid` for a table layout showing multiple variants at once.
- Follow the standard section order: Basic Examples → Variants → Colors → Shapes → States →
  Sizes → Widths → Padding → Examples.
- Use a horizontal subsection layout (`flex flex-wrap gap-8`) for a side-by-side comparison.

See [STORYBOOK.md](../../STORYBOOK.md) for the full reference: the utility component API, section
naming conventions, Component Story Format examples, grid layouts, and Ladle configuration.

**Gold standard examples**:
- [Button](../../components/atoms/Button/Button.stories.tsx) — a grid layout with subsections
- [Checkbox](../../components/atoms/form/Checkbox/Checkbox.stories.tsx) — a grid combining color and state
- [Typography](../../components/atoms/Typography.stories.tsx) — a documentation-only story with no component wrapper
