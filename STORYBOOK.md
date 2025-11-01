# Component Storybook with Ladle

This project uses **[Ladle](https://ladle.dev/)** as a lightweight, Vite-powered alternative to Storybook for developing and documenting UI components in isolation.

## Why Ladle?

- **Lightweight**: Minimal setup and dependencies compared to traditional Storybook
- **Fast**: Built on Vite and SWC for instant hot module replacement
- **Low Maintenance**: Simple configuration, stays out of your way
- **Battle-Tested**: Used in 335+ Uber projects with 15,896 stories
- **Compatible**: Supports Component Story Format (CSF) like Storybook
- **Works with our stack**: Full support for Tailwind CSS, React 19, and TypeScript

## Getting Started

### Running Ladle

Start the Ladle development server:

```bash
pnpm ladle
```

This will start Ladle at [http://localhost:61000/](http://localhost:61000/)

### Building Static Ladle

To build a static version of your component library (for deployment):

```bash
pnpm ladle:build
```

This generates a static site in the `build/` directory.

## Story Utility Components

To ensure consistency across all stories, we provide a set of reusable utility components in [components/ladle/](components/ladle/):

### StoryWrapper

Standard wrapper for all story components that provides consistent spacing and layout structure with standardized `flex flex-col gap-8` classes.

```tsx
import { StoryWrapper } from '../../ladle';

export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Examples">
      {/* Content */}
    </StorySection>
  </StoryWrapper>
);
```

**Props**:
- `children` (ReactNode, required) - Story content to wrap

**Note**: All stories must use `StoryWrapper` as the outermost wrapper element. Do not use custom wrapper divs.

### StorySection

Wraps each major section of a story with a title, optional description, and automatic horizontal divider.

```tsx
import { StorySection } from '../../ladle';

<StorySection title="Variants" description="Optional description">
  {/* Content */}
</StorySection>
```

**Props**:
- `title` (string, required) - Section heading
- `description` (string, optional) - Description text below the title
- `children` (ReactNode, required) - Section content

### StoryExampleSection

Special wrapper for "Examples" sections that adds visual distinction with a teal top border. The title is automatically set to "Examples" or can include a subtitle for multiple example sections.

```tsx
import { StoryExampleSection } from '../../ladle';

// Single Examples section
<StoryExampleSection>
  {/* Example content */}
</StoryExampleSection>

// Multiple Examples sections with subtitles
<StoryExampleSection subtitle="Button with Icons">
  {/* Example content */}
</StoryExampleSection>

<StoryExampleSection subtitle="Form Layout">
  {/* Example content */}
</StoryExampleSection>
```

**Props**:
- `subtitle` (string, optional) - Appended as "Examples - {subtitle}"
- `description` (string, optional) - Description text below the title
- `children` (ReactNode, required) - Section content

**Visual Styling**: Includes a 4px teal top border (`border-t-4 border-teal-500`) to visually distinguish example sections from regular sections.

### StorySubsection

Provides consistent labeling for subsections within a StorySection or StoryExampleSection.

```tsx
import { StorySubsection } from '../../ladle';

<StorySubsection label="Text Buttons">
  {/* Content */}
</StorySubsection>
```

**Props**:
- `label` (string, required) - Subsection label
- `children` (ReactNode, required) - Subsection content

### StoryGrid Components

Create consistent table/grid layouts for showing multi-dimensional component matrices.

```tsx
import {
  StoryGrid,
  StoryGridHeader,
  StoryGridHeaderRow,
  StoryGridHeaderCell,
  StoryGridBody,
  StoryGridRow,
  StoryGridCell
} from '../../ladle';

<StoryGrid>
  <StoryGridHeader>
    <StoryGridHeaderRow>
      <StoryGridHeaderCell />
      <StoryGridHeaderCell colSpan={2}>Group Header</StoryGridHeaderCell>
    </StoryGridHeaderRow>
    <StoryGridHeaderRow>
      <StoryGridHeaderCell size="secondary" />
      <StoryGridHeaderCell size="secondary">Column 1</StoryGridHeaderCell>
      <StoryGridHeaderCell size="secondary">Column 2</StoryGridHeaderCell>
    </StoryGridHeaderRow>
  </StoryGridHeader>
  <StoryGridBody>
    <StoryGridRow>
      <StoryGridCell isLabel>Row Label</StoryGridCell>
      <StoryGridCell>{/* Component */}</StoryGridCell>
      <StoryGridCell>{/* Component */}</StoryGridCell>
    </StoryGridRow>
  </StoryGridBody>
</StoryGrid>
```

**Grid Component Props**:
- `StoryGridHeaderCell`: `children?`, `colSpan?`, `size?: 'primary' | 'secondary'`
- `StoryGridCell`: `children?`, `isLabel?: boolean`

## Writing Stories

Stories use Component Story Format (CSF) and are placed alongside components.

### File Naming Convention

Story files should be named `ComponentName.stories.tsx`:

```
components/atoms/Button/
├── Button.tsx          # Component implementation
├── Button.stories.tsx  # Component stories
└── index.ts           # Exports
```

### Story Structure Standards

All stories should follow this consistent pattern:

```tsx
import type { Story, StoryDefault } from "@ladle/react";
import { ComponentName } from "./ComponentName";
import { StoryWrapper, StorySection, StorySubsection } from '../../ladle';

export default {
  title: "Atoms / Category"  // e.g., "Atoms / Form", "Atoms / Typography"
} satisfies StoryDefault;

/**
 * Brief description of what the component does and what the story showcases.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Section Name">
      {/* Content */}
    </StorySection>

    {/* More sections... */}

    {/* Remove trailing divider */}
    <div />
  </StoryWrapper>
);

Default.storyName = "Component Name"
```

### Standard Section Order

Organize story sections in this order (skip sections that don't apply):

1. **Basic Examples** / **Input Types** - Simple default usage
2. **Variants** - Visual style variations (primary, secondary, outline, ghost)
3. **Colors** - Color variations
4. **Shapes** - Shape variations (square, rounded, circular)
5. **Component-Specific Sections** - Sections unique to the component (e.g., "Aspect Ratios" for Image, "Common Durations" and "Format Variants" for Duration)
6. **States** - Interactive states (default, loading, disabled, success, error)
7. **Sizes** - Size variations (xs, sm, md, lg, xl, 2xl)
8. **Widths** - Width options (default, full-width)
9. **Padding** - Padding variations
10. **Examples** - Real-world usage scenarios and practical examples

**Note on Component-Specific Sections**: Some components have unique properties that don't fit into the standard categories. These sections should appear after "Shapes" and before "States". Examples include:
- **Image component**: "Aspect Ratios" section for different image aspect ratios (square, video, 4:3)
- **Duration component**: "Common Durations" and "Format Variants" sections for time display options

These sections are specific to individual components and should use clear, descriptive titles that reflect what they demonstrate.

### Section Naming Conventions

Use these standardized section names:

- ✅ "Variants" (not "All Variants", "Styles", "Types")
- ✅ "Colors" (not "Color Options", "Palettes")
- ✅ "Shapes" (not "Border Radius", "Rounded Corners")
- ✅ "States" (not "Loading States", "Disabled States" - combine them)
- ✅ "Sizes" (not "Size Options", "Dimensions")
- ✅ "Widths" (not "Width Options", "Full Width")
- ✅ "Padding" (not "Padding Options")
- ✅ "Examples" (not "Common Use Cases", "In Context", "Use Cases", "Usage")
  - For multiple example sections, use descriptive titles: "Examples - Button with Icons", "Examples - Form Layout", etc.

### Example: Simple Story

For components with simple variations (Text, Heading, Label):

```tsx
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Sizes">
      <div className="flex flex-col gap-3">
        <Text size="xs">Extra small text</Text>
        <Text size="sm">Small text</Text>
        <Text size="base">Base text</Text>
      </div>
    </StorySection>

    <StorySection title="Colors">
      <div className="flex flex-col gap-3">
        <Text color="primary">Primary color</Text>
        <Text color="secondary">Secondary color</Text>
      </div>
    </StorySection>

    {/* Remove trailing divider */}
    <div />
  </StoryWrapper>
);
```

### Example: Grid Layout Story

For components with multi-dimensional variations (Button, Checkbox, Radio):

```tsx
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Variants">
      <StoryGrid>
        <StoryGridHeader>
          <StoryGridHeaderRow>
            <StoryGridHeaderCell />
            <StoryGridHeaderCell>Primary</StoryGridHeaderCell>
            <StoryGridHeaderCell>Secondary</StoryGridHeaderCell>
          </StoryGridHeaderRow>
        </StoryGridHeader>
        <StoryGridBody>
          <StoryGridRow>
            <StoryGridCell isLabel>Checked</StoryGridCell>
            <StoryGridCell>
              <Checkbox defaultChecked aria-label="Primary checked" />
            </StoryGridCell>
            <StoryGridCell>
              <Checkbox color="secondary" defaultChecked aria-label="Secondary checked" />
            </StoryGridCell>
          </StoryGridRow>
        </StoryGridBody>
      </StoryGrid>
    </StorySection>

    {/* Remove trailing divider */}
    <div />
  </StoryWrapper>
);
```

### Example: Story with Subsections

For components with grouped variations (Button states, Input types):

```tsx
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="States">
      <div className="flex flex-col gap-6">
        <StorySubsection label="Loading">
          <div className="flex gap-3">
            <Button variant="primary" isLoading>Primary</Button>
            <Button variant="secondary" isLoading>Secondary</Button>
          </div>
        </StorySubsection>

        <StorySubsection label="Disabled">
          <div className="flex gap-3">
            <Button variant="primary" disabled>Primary</Button>
            <Button variant="secondary" disabled>Secondary</Button>
          </div>
        </StorySubsection>
      </div>
    </StorySection>

    {/* Remove trailing divider */}
    <div />
  </StoryWrapper>
);
```

### Example: Examples Sections

Use `StoryExampleSection` for all example sections. It automatically sets the title to "Examples" and adds visual distinction with a teal top border.

**Single Examples Section**:
```tsx
<StoryExampleSection>
  <div>
    <p className="text-sm font-medium mb-2">Select your interests:</p>
    <div className="flex flex-col gap-2">
      <Checkbox label="Meditation Techniques" defaultChecked />
      <Checkbox label="Guided Meditations" defaultChecked />
    </div>
  </div>
</StoryExampleSection>
```

**Single Section with Subsections**:
```tsx
<StoryExampleSection>
  <div className="flex flex-col gap-6">
    <StorySubsection label="Form Actions">
      <div className="flex gap-3">
        <Button variant="primary">Submit</Button>
        <Button variant="outline">Cancel</Button>
      </div>
    </StorySubsection>

    <StorySubsection label="Media Controls">
      <div className="flex gap-3">
        <Button icon={PlayIcon} variant="primary" aria-label="Play" />
        <Button icon={PauseIcon} variant="primary" aria-label="Pause" />
      </div>
    </StorySubsection>
  </div>
</StoryExampleSection>
```

**Multiple Example Sections with Subtitles**:
```tsx
<StoryExampleSection subtitle="Article Layout">
  <article className="max-w-2xl">
    <Heading level="h1">Article Title</Heading>
    <p>Article content...</p>
  </article>
</StoryExampleSection>

<StoryExampleSection subtitle="Card Layout">
  <div className="grid grid-cols-2 gap-4">
    <Box>Card 1</Box>
    <Box>Card 2</Box>
  </div>
</StoryExampleSection>
```

## Component Story Examples

### Gold Standard: Button Story

The [Button story](components/atoms/Button/Button.stories.tsx) demonstrates all best practices:

- Uses StoryGrid for comprehensive variant × shape × content matrix
- Groups states (loading + disabled) into single "States" section
- Uses StorySubsection for subsections within groups
- Follows standard section order
- Removes trailing divider

**Section Order**:
1. Variants (grid)
2. Sizes (with subsections)
3. States (loading + disabled)
4. Widths
5. Examples (with subsections)

### Form Components: Checkbox & Radio

[Checkbox](components/atoms/Checkbox/Checkbox.stories.tsx) and [Radio](components/atoms/Radio/Radio.stories.tsx) stories show:

- Grid layout combining color × state without text labels
- Simple "Examples" section with practical usage scenarios

**Section Order**:
1. Variants (grid: state × color)
2. Examples

### Typography: Text & Heading

[Text](components/atoms/Text/Text.stories.tsx) and [Heading](components/atoms/Heading/Heading.stories.tsx) stories demonstrate:

- Simple vertical stacking for single-dimension variations
- Combining related properties (weights) within "Examples"
- Semantic usage examples showing components in realistic contexts

## Best Practices

### DO ✅

- **Use StoryWrapper** as the outermost wrapper for all stories
- **Use utility components** for all stories (StorySection, StoryExampleSection, StorySubsection, StoryGrid)
- **Follow standard section order** consistently
- **Use standard section names** from the naming conventions
- **Combine related states** into single sections (e.g., loading + disabled = "States")
- **Use grids** for multi-dimensional variations (variant × shape, color × state)
- **Use StoryExampleSection** for all "Examples" sections (not StorySection)
- **Show realistic usage** in example sections (can use subsections or multiple sections with subtitles)
- **Remove trailing dividers** with `<div />` at the end
- **Document with JSDoc** what the story showcases

### DON'T ❌

- **Don't use custom wrapper divs** - always use StoryWrapper as the outermost element
- **Don't create separate stories** for each variant - consolidate into one comprehensive story
- **Don't use inconsistent naming** - stick to the standard section names
- **Don't separate related states** - combine loading/disabled/error into "States"
- **Don't omit the trailing divider removal** - always add `<div />` at the end
- **Don't use manual dividers** - StorySection/StoryExampleSection handle dividers automatically
- **Don't use raw HTML headings** - use StorySection/StoryExampleSection instead
- **Don't use old naming** like "Common Use Cases" or "In Context" - use StoryExampleSection instead
- **Don't use StorySection for Examples** - use StoryExampleSection for visual distinction

## Configuration

Ladle configuration is in [.ladle/config.mjs](.ladle/config.mjs):

```js
export default {
  stories: "components/**/*.stories.{js,jsx,ts,tsx}",
  port: 61000,
  title: "WeMeditate Component Library",
  viteConfig: ".ladle/vite.config.ts",
};
```

### Tailwind CSS Support

Ladle uses a custom Vite config at [.ladle/vite.config.ts](.ladle/vite.config.ts):

```ts
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

## Component Development Workflow

1. **Create Component**: Write component with TypeScript and proper props
2. **Write Story**: Create `.stories.tsx` using utility components
3. **Start Ladle**: Run `pnpm ladle` to view in isolation
4. **Iterate**: Make changes with instant HMR feedback
5. **Document**: Stories serve as living documentation

## Ladle Features

### Hot Module Replacement

Changes to components or stories update instantly without page reload.

### Dark Mode Toggle

Built-in dark mode toggle in the toolbar (top-right).

### Mobile View

Toggle to see components on smaller screens.

### Width Control

Adjust viewport width using the toolbar slider.

### Story Source

View source code by clicking the code icon.

## Troubleshooting

### Stories not appearing

- Check file pattern: `*.stories.{ts,tsx}`
- Ensure named exports
- Verify file is in `components/` directory

### Tailwind classes not working

- Check [.ladle/vite.config.ts](.ladle/vite.config.ts) includes Tailwind plugin
- Verify standard Tailwind classes are used

### Port already in use

Change port in [.ladle/config.mjs](.ladle/config.mjs):

```js
export default {
  port: 62000, // Different port
};
```

## Learn More

- [Ladle Documentation](https://ladle.dev/docs)
- [Component Story Format (CSF)](https://ladle.dev/docs/stories)
- [Ladle Configuration](https://ladle.dev/docs/config)
- [Design System Guide](DESIGN_SYSTEM.md)
