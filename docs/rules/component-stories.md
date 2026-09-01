---
paths:
  - "**/*.stories.tsx"
  - "components/ladle/**"
  - ".ladle/**"
---

# Component Development with Ladle

This project uses **[Ladle](https://ladle.dev/)** for component development and documentation. Ladle is a lightweight, Vite-powered alternative to Storybook.

**Quick Start**:
- Run component library: `pnpm ladle` (opens at [http://localhost:61000/](http://localhost:61000/))
- Build static library: `pnpm ladle:build`

**Writing Stories**:

**⚠️ CRITICAL**: Before writing ANY component story, you MUST read [STORYBOOK.md](../../STORYBOOK.md) first. This is not optional.

Common mistakes when not following [STORYBOOK.md](../../STORYBOOK.md):
- ❌ Using raw HTML headings (`<h2>`, `<h3>`) instead of `<StorySection variant="subsection">`
- ❌ Using deprecated `StorySubsection` or `StoryExampleSection` components
- ❌ Not using `inContext={true}` prop for Examples sections
- ❌ Creating manual dividers instead of letting StorySection handle them

Key requirements:
- **First step**: Read [STORYBOOK.md](../../STORYBOOK.md) to understand story structure and utility components
- Create `ComponentName.stories.tsx` alongside your component
- **Always use a single `Default` export** - never create multiple story exports
- Use proper `title` categorization (e.g., `"Atoms / Form"`, `"Molecules / Layout"`, `"Organisms"`)
- Add `storyName` attribute to the `Default` export for human-readable names
- **ALWAYS use story utility components** - never use raw HTML for structure:
  - `<StorySection>` - For all major sections
  - `<StorySection variant="subsection">` - For nested subsections (NOT raw `<h3>` tags)
  - `<StorySection inContext={true}>` - For all Examples sections
  - `StoryGrid` - Create table layouts for multi-dimensional component matrices
- Follow standard section order: Basic Examples → Variants → Colors → Shapes → States → Sizes → Widths → Padding → Examples
- Use horizontal subsection layout (`flex flex-wrap gap-8`) for side-by-side comparisons

**See STORYBOOK.md** for complete documentation on:
- Story utility components API reference
- Standard section order and naming conventions
- Writing stories with Component Story Format (CSF)
- Grid layouts for comprehensive variant matrices
- Best practices for consistent story organization
- Configuration and customization options

**Gold Standard Examples**:
- [Button](../../components/atoms/Button/Button.stories.tsx) - Comprehensive grid layout with subsections
- [Checkbox](../../components/atoms/form/Checkbox/Checkbox.stories.tsx) - Grid combining color × state
- [Text](../../components/atoms/Text/Text.stories.tsx) - Simple vertical stacking with sections

