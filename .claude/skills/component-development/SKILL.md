---
name: component-development
description: Build a new React UI component in this repo end to end: classify its atomic level, lay out the component and barrel exports, write the Ladle story, and verify. Use when creating a new atom, molecule, organism or template from scratch.
---

# Component Development Workflow

Follow this checklist when creating new components from scratch:

## 1. Planning Phase

**IMPORTANT**: Before starting, read:
- [ ] @DESIGN_SYSTEM.md for component architecture and design patterns
- [ ] @STORYBOOK.md for story structure and conventions

Then proceed with planning:
- [ ] Examine design (URL, images, or description)
- [ ] Identify atomic level (atom/molecule/organism)
- [ ] Determine required and optional props
- [ ] Plan variants and configurations
- [ ] Identify responsive behavior needs

## 2. Implementation Phase

- [ ] Create component file: `components/[level]/ComponentName/ComponentName.tsx`
  - Define TypeScript interface with JSDoc
  - Implement component with mobile-first approach
  - Add responsive breakpoints (md:, lg:)
  - Use only Tailwind tokens (no custom CSS)
  - **Extract any inline SVGs to `components/atoms/graphics/svgs/` and import them**

- [ ] Create barrel export: `components/[level]/ComponentName/index.ts`
  ```typescript
  export { ComponentName, type ComponentNameProps } from './ComponentName'
  ```

- [ ] Update parent index: `components/[level]/index.ts`
  ```typescript
  export { ComponentName } from './ComponentName'
  export type { ComponentNameProps } from './ComponentName'
  ```

**Import Pattern**: When importing atoms in other components:
- ✅ Preferred: `import { ComponentName } from '../../atoms'` (barrel export)
- ✅ Alternative: `import { ComponentName } from '../../atoms/ComponentName'` (direct import)
- Use the barrel export for cleaner imports when importing multiple atoms

## 3. Stories Phase

- [ ] Create story file: `components/[level]/ComponentName/ComponentName.stories.tsx`
  - Import from '@ladle/react' and component
  - Import story utilities from '../../ladle'
  - Follow @STORYBOOK.md section patterns
  - For **atoms**: Use grids for multi-dimensional variations
  - For **molecules**: Use sections with Minimal/Maximal subsections
  - Add Examples section with realistic usage
  - End with `<div />` to remove trailing divider

## 4. Testing Phase

- [ ] Start/restart Ladle if not running
  ```bash
  pnpm ladle  # Opens at http://localhost:61000
  ```

- [ ] Verify in browser:
  - All variants render correctly
  - Responsive behavior at different breakpoints
  - Interactive states work (hover, focus, active)
  - Matches original design

- [ ] Check TypeScript:
  ```bash
  pnpm exec tsc --noEmit
  ```

## 5. Completion Checklist

- [ ] Component follows @DESIGN_SYSTEM.md guidelines
- [ ] Story follows @STORYBOOK.md patterns
- [ ] All exports updated (component and parent index)
- [ ] No TypeScript errors
- [ ] Tested in Ladle
- [ ] Responsive behavior verified
- [ ] Accessibility considered (ARIA, semantic HTML)

## Quick Reference

**File Structure**:
```
components/
└── [atoms|molecules|organisms]/
    └── ComponentName/
        ├── ComponentName.tsx       # Component implementation
        ├── ComponentName.stories.tsx  # Ladle stories
        └── index.ts                # Barrel export
```

**Story Pattern for Molecules**:
```typescript
<StoryWrapper>
  <StorySection title="Variant Name">
    <div className="flex flex-col gap-8">
      <StorySection title="Minimal" variant="subsection">
        {/* Only required props */}
      </StorySection>

      <StorySection title="Maximal" variant="subsection">
        {/* All optional props */}
      </StorySection>
    </div>
  </StorySection>

  <StorySection title="Examples" inContext={true}>
    {/* Realistic usage examples */}
  </StorySection>

  <div />
</StoryWrapper>
```

