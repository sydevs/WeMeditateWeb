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

**Unified component** that replaces StorySection, StoryDarkSection, StorySubsection, and StoryExampleSection with a single flexible component.

Wraps sections of a story with a title, optional description, and automatic horizontal divider. Supports light/dark themes, different background styles, and special "In Context" sections.

```tsx
import { StorySection } from '../../ladle';

// Regular section (renders as h2)
<StorySection title="Variants" description="Optional description">
  {/* Content */}
</StorySection>

// Subsection (renders as p tag)
<StorySection title="Explicit Sizes" variant="subsection">
  {/* Content */}
</StorySection>

// Dark theme section with neutral background
<StorySection
  title="Dark Theme"
  theme="dark"
  background="neutral"
  description="Lightened colors for contrast on dark backgrounds"
>
  {/* Content - text-white is applied automatically */}
</StorySection>

// "In Context" section with bold top border
<StorySection title="Examples" inContext={true}>
  {/* Real-world usage examples */}
</StorySection>

// Scrollable section
<StorySection title="Light Theme (Default)" variant="scrollable">
  {/* Content with 600px height and overflow */}
</StorySection>
```

**Props**:
- `title` (string, required) - Section title (renders as h2 for sections, p for subsections)
- `description` (string, optional) - Description text below the title
- `children` (ReactNode, required) - Section content
- `theme` ('light' | 'dark', default: 'light') - Text color theme
  - `light`: Dark text (gray-900) - for light backgrounds
  - `dark`: White text - for dark backgrounds (applied to children)
- `background` ('none' | 'neutral' | 'gradient', default: 'none') - Background style
  - `none`: No background
  - `neutral`: Light gray (light theme) or dark gray (dark theme)
  - `gradient`: Light teal gradient (light theme) or dark teal gradient (dark theme)
- `variant` ('section' | 'subsection' | 'scrollable', default: 'section')
  - `section`: Regular section with h2 title
  - `subsection`: Nested section with p tag title (smaller font, no divider)
  - `scrollable`: Fixed 600px height with overflow-y-auto
- `inContext` (boolean, default: false) - Adds "In Context - " prefix to title and bold top border for visual separation

**Important Notes**:
- **Title/Description Colors**: Always use light theme colors (gray-900, gray-600) for non-subsection titles/descriptions, even when `theme="dark"`, because they appear on the light wrapper background
- **Children Text Color**: The `text-white` class is applied to children when `theme="dark"` so content inherits the correct color
- **Subsections**: Use within regular sections for nested organization - they don't show dividers
- **In Context Sections**: Use `inContext={true}` for example/usage sections - adds bold border and "In Context - " prefix

#### When to Use Subsections

Use `variant="subsection"` when you need to organize content within a major section:

**✅ DO use subsections for:**
- **Grouped variations within a section** - e.g., "Minimal" and "Maximal" configurations within a "Default Variant" section
- **Categorizing examples** - e.g., "Button with Icons" and "List Items with Icons" within an "Examples" section
- **Organizing complex state matrices** - e.g., "Loading States" and "Disabled States" within a "States" section
- **Multiple related demonstrations** - e.g., "Vertical Spacing" and "Horizontal Spacing" within a "Sizes" section

**❌ DON'T use subsections for:**
- **Top-level sections** - Always use regular sections (default variant) for major divisions
- **Single items** - If there's only one thing to show, don't wrap it in a subsection
- **Flat hierarchies** - Don't nest subsections within subsections (only one level of nesting)

**Visual Hierarchy**:
- **Section** (h2, large font, shows divider) → Major topic division
- **Subsection** (p, medium font, no divider) → Sub-topic within major section
- **Content** → The actual component demonstrations

**Example Pattern for Molecules**:
```tsx
<StorySection title="Default Variant">
  <div className="flex flex-col gap-8">
    <StorySection title="Minimal" variant="subsection">
      {/* Only required props */}
    </StorySection>

    <StorySection title="Maximal" variant="subsection">
      {/* All optional props */}
    </StorySection>
  </div>
</StorySection>
```

**Example Pattern for Complex States**:
```tsx
<StorySection title="States">
  <div className="flex flex-col gap-6">
    <StorySection title="Loading" variant="subsection">
      {/* Loading state demonstrations */}
    </StorySection>

    <StorySection title="Disabled" variant="subsection">
      {/* Disabled state demonstrations */}
    </StorySection>
  </div>
</StorySection>
```

### StorySubsection (Deprecated)

**DEPRECATED**: Use `<StorySection variant="subsection">` instead.

### StoryExampleSection (Deprecated)

**DEPRECATED**: Use `<StorySection inContext={true}>` instead.

**Old Props (Removed)**:
- `subtitle` (string, optional) - Appended as "Examples - {subtitle}"
- `description` (string, optional) - Description text below the title
- `children` (ReactNode, required) - Section content

**Migration**: Replace `<StoryExampleSection>` with `<StorySection title="Examples" inContext={true}>`. The new component uses a bold dark border (`border-t-4 border-gray-900`) instead of the teal border.

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

**Mobile-First Responsive Behavior**:

StoryGrid automatically adapts to mobile viewports using a vertical stacking layout:

- **Mobile (< 640px)**:
  - Table header is hidden (table data is self-explanatory when stacked)
  - Each row becomes a stacked vertical block with spacing
  - Cells display vertically within each row
  - Label cells are bold for prominence
  - Bottom border separates each row

- **Desktop (≥ 640px)**:
  - Normal horizontal table layout with headers
  - Standard grid display
  - Center-aligned cells
  - Regular table spacing

This ensures story grids remain readable on mobile devices without horizontal scrolling.

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

    <div />
  </StoryWrapper>
);

Default.storyName = "Component Name"
```

### Placeholder Content Best Practices

When creating stories, use consistent, high-quality placeholder content:

#### Placeholder Images

Use **[picsum.photos](https://picsum.photos)** for placeholder images with seeded URLs for consistency:

```tsx
// ✅ Good - Seeded URLs provide consistent images across reloads
thumbnailSrc: "https://picsum.photos/seed/meditation1/400/400"
thumbnailSrc: "https://picsum.photos/seed/article2/640/360"

// ❌ Bad - Random images change on every reload
thumbnailSrc: "https://picsum.photos/400/400"

// ❌ Bad - Generic placeholder services with text
thumbnailSrc: "https://placehold.co/400x400/e08e79/ffffff?text=Image"
```

**Pattern**: `https://picsum.photos/seed/{descriptive-name}/{width}/{height}`
- Use descriptive seed names: `meditation1`, `article2`, `hero-banner`, etc.
- Match dimensions to aspect ratio needs
- Different seeds provide variety while staying consistent

**Examples:**
```tsx
const storyItems = [
  {
    id: 1,
    thumbnailSrc: "https://picsum.photos/seed/meditation1/400/400", // Square 1:1
    title: "Morning Meditation"
  },
  {
    id: 2,
    thumbnailSrc: "https://picsum.photos/seed/article1/640/360", // Video 16:9
    title: "What is Meditation?"
  },
  {
    id: 3,
    thumbnailSrc: "https://picsum.photos/seed/nature1/400/300", // 4:3 ratio
    title: "Nature Walk"
  }
]
```

#### Interactive Elements

For links, buttons, and other interactive elements in stories, use **hash hrefs** to prevent navigation:

```tsx
// ✅ Good - Prevents navigation in Ladle
<ContentCard
  href="#"
  title="Example Card"
/>

<Button href="#">Click Me</Button>

<Link href="#">About Us</Link>

// ❌ Bad - Causes unwanted navigation
<ContentCard
  href="/meditations/morning"
  title="Example Card"
/>
```

**Why hash hrefs?**
- Prevents accidental navigation when clicking around in Ladle
- Keeps you in the story view for faster development
- Still demonstrates interactive behavior (hover states, etc.)

**When to use real URLs:**
- Never in Ladle stories (always use `#`)
- Use real URLs only in actual application pages

#### Text Content

Use realistic, contextually appropriate text:

```tsx
// ✅ Good - Realistic content
description: "Start your day with clarity and peace through this guided morning practice."

// ❌ Bad - Lorem ipsum or generic placeholder
description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."

// ❌ Bad - Too generic
description: "This is a description."
```

### Standard Section Order

The section order varies by component category, but generally follows these patterns:

#### General Pattern (Most Components)
1. **Basic Examples** / **Variants** / **Input Types** - Initial demonstration of core functionality
2. **Sizes** - Size variations (xs, sm, md, lg, xl, 2xl)
3. **Colors** - Color variations
4. **Shapes** - Shape variations (square, rounded, circular)
5. **Component-Specific Sections** - Unique properties (see examples below)
6. **States** - Interactive states (default, loading, disabled, success, error)
7. **Widths** - Width options (default, full-width)
8. **Padding** - Padding variations
9. **Examples** - Real-world usage scenarios

#### Category-Specific Patterns

**Form Components** (Button, Checkbox, Radio, Input, Select, Textarea):
- Variants/Input Types → Sizes → Colors → States → Widths → Examples

**Media Components** (Avatar, Image, Icon, SocialIcon):
- Sizes → Colors → Shapes → States → Examples

**Typography Components** (Text, Heading, Label):
- Sizes → Weights → Colors → Examples

**Layout Components** (Box, Container, Spacer):
- Variants/Sizes → Padding → Shadows → Examples

**Molecule Components** (Author, FormField, SocialShare, etc.):
- Each major variant gets its own section → Examples
- Within each variant section, use subsections for "Minimal" and "Maximal" configurations
- Minimal = component with only required props
- Maximal = component with all optional props populated
- Don't use grids for molecules - use simple vertical layouts with subsections
- Typically 2-3 variant sections, each with Minimal/Maximal subsections

**Component-Specific Sections**: Some components have unique properties that don't fit standard categories. These typically appear after basic variants/sizes and before States. Examples:
- **Image**: "Aspect Ratios" for image dimensions (square 1:1, video 16:9, 4:3)
- **Duration**: "Common Durations" and "Format Variants" for time display
- **Icon**: "Outline Style" and "Solid Style" for icon collections
- **LeafDivider**: "With Line" and "Without Line" for decoration options

**Note**: Not all components need all sections. Skip sections that don't apply to your component.

### Section Naming Conventions

Use these standardized section names:

- ✅ **"Variants"** - Visual style variations (primary, secondary, outline, etc.)
- ✅ **"Basic Examples"** - Initial feature demonstrations (use for components with multiple basic features)
- ✅ **"Input Types"** - HTML input type variations (text, email, password, etc.)
- ✅ **"Colors"** - Color variations across the palette
- ✅ **"Shapes"** - Geometric variations (square, rounded, circular)
- ✅ **"States"** - Interactive states (combine loading, disabled, error, success into one section)
- ✅ **"Sizes"** - Size scale variations (xs, sm, md, lg, xl, 2xl)
- ✅ **"Weights"** - Font weight variations (extralight through bold)
- ✅ **"Widths"** - Width options (default, full-width)
- ✅ **"Padding"** - Spacing variations
- ✅ **"Shadows"** - Shadow depth variations
- ✅ **"Examples"** - Real-world usage scenarios (via StoryExampleSection)

**Don't use these alternatives:**
- ❌ "All Variants", "Styles", "Types" → Use "Variants"
- ❌ "Color Options", "Palettes" → Use "Colors"
- ❌ "Border Radius", "Rounded Corners" → Use "Shapes"
- ❌ "Loading States", "Disabled States" (separate sections) → Combine into "States"
- ❌ "Size Options", "Dimensions" → Use "Sizes"
- ❌ "Common Use Cases", "In Context", "Use Cases" → Use "Examples" with StoryExampleSection

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

    <div />
  </StoryWrapper>
);
```

### Example: Story with Subsections (Vertical Layout)

For components with grouped variations (Button states, Input types):

```tsx
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="States">
      <div className="flex flex-col gap-6">
        <StorySection title="Loading" variant="subsection">
          <div className="flex gap-3">
            <Button variant="primary" isLoading>Primary</Button>
            <Button variant="secondary" isLoading>Secondary</Button>
          </div>
        </StorySection>

        <StorySection title="Disabled" variant="subsection">
          <div className="flex gap-3">
            <Button variant="primary" disabled>Primary</Button>
            <Button variant="secondary" disabled>Secondary</Button>
          </div>
        </StorySection>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);
```

### Example: Story with Subsections (Horizontal Layout)

For side-by-side comparisons (default vs minimal variants, alignment options):

```tsx
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Variants">
      <div className="flex flex-wrap gap-8">
        <div className="min-w-2/5">
          <StorySection title="Default Variant" variant="subsection">
            <FormBuilder variant="default" {...props} />
          </StorySection>
        </div>

        <div className="min-w-2/5">
          <StorySection title="Minimal Variant" variant="subsection">
            <FormBuilder variant="minimal" {...props} />
          </StorySection>
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);
```

**Key Pattern for Horizontal Subsections**:
- Use `flex flex-wrap gap-8` on the container div
- Wrap each subsection in a div with `min-w-2/5` (allows responsive wrapping)
- Each subsection uses `<StorySection variant="subsection">`
- Works for 2-3 side-by-side items; wraps to vertical on smaller screens

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

### Gold Standard Examples

#### Button - Complex Grid Story
[Button.stories.tsx](components/atoms/Button/Button.stories.tsx) demonstrates advanced grid usage:
- Multi-dimensional grid with two-level headers (variant × content × shape)
- Extensive use of subsections to organize content within major sections
- States section combines loading and disabled states
- Examples section with 7 practical subsections

**Structure**: Variants (grid) → Sizes (subsections) → States (subsections) → Widths → Examples (subsections)

#### Checkbox & Radio - Simple Grid Stories
[Checkbox.stories.tsx](components/atoms/Checkbox/Checkbox.stories.tsx) and [Radio.stories.tsx](components/atoms/Radio/Radio.stories.tsx):
- Clean color × state matrix grids
- Minimal text, focus on visual comparison
- Single comprehensive Examples section

**Structure**: Variants (grid) → Examples

#### Box - Multi-Purpose Grid
[Box.stories.tsx](components/atoms/Box/Box.stories.tsx):
- Grid showing color × decoration combinations
- Separate sections for functional variations (Padding, Shadows)
- Rich examples with real use cases (cards, tips, feature grids)

**Structure**: Variants (grid) → Padding → Shadows → Examples

#### SocialIcon - Large Matrix Grid
[SocialIcon.stories.tsx](components/atoms/SocialIcon/SocialIcon.stories.tsx):
- Programmatically generated 10×4 grid (platform × color)
- Demonstrates efficient grid generation with map
- Interactive examples with hover states

**Structure**: Colors (grid) → Sizes → Examples

#### Typography - Documentation-Only Story
[Typography.stories.tsx](components/atoms/Typography.stories.tsx):
- Pure documentation story with no component (demonstrates using Tailwind directly)
- Shows typography patterns: sizes, weights, colors
- Includes practical examples section with real-world usage patterns
- Demonstrates when NOT to create component wrappers

**Structure**: Sizes → Weights → Colors → Examples

**Note**: This story documents typography options without requiring a component wrapper, demonstrating the principle that simple styling doesn't need abstraction.

#### Spacer - Extensive Subsection Usage
[Spacer.stories.tsx](components/atoms/Spacer/Spacer.stories.tsx):
- Demonstrates heavy subsection usage (6 total subsections)
- Sizes section split into 3 subsections (Vertical, Horizontal, All Sizes)
- Examples section split into 3 subsections (Article, Card, Form layouts)

**Structure**: Sizes (subsections) → Examples (subsections)

#### Author - Molecule with Variant Sections
[Author.stories.tsx](components/molecules/Author/Author.stories.tsx):
- Each major variant (Mini, Hero) gets its own section
- Within each variant section, subsections for "Minimal" and "Maximal" configurations
- Minimal shows required props only, Maximal shows all optional props
- No grids - simple vertical layout with subsections
- Single Examples section showing realistic usage

**Structure**: Mini Variant (subsections) → Hero Variant (subsections) → Examples

## Best Practices

### DO ✅

- **Use StoryWrapper** as the outermost wrapper for all stories
- **Use utility components** for all stories (StorySection, StoryExampleSection, StoryGrid)
- **ALWAYS use `<StorySection variant="subsection">`** for subsections - never use raw HTML headings or deprecated components
- **Follow standard section order** consistently
- **Use standard section names** from the naming conventions
- **Combine related states** into single sections (e.g., loading + disabled = "States")
- **Use grids** for multi-dimensional variations in atoms (variant × shape, color × state)
- **For molecules/organisms**, use separate sections per variant with Minimal/Maximal subsections (no grids)
- **Use horizontal subsection layout** (`flex flex-wrap gap-8`) for side-by-side comparisons
- **Use `<StorySection inContext={true}>`** for all "Examples" sections (not regular StorySection)
- **Show realistic usage** in example sections (can use subsections or multiple sections with subtitles)
- **Remove trailing dividers** with `<div />` at the end
- **Document with JSDoc** what the story showcases

### DON'T ❌

- **Don't use custom wrapper divs** - always use StoryWrapper as the outermost element
- **Don't create separate stories** for each variant - consolidate into one comprehensive story
- **Don't use inconsistent naming** - stick to the standard section names
- **Don't separate related states** - combine loading/disabled/error into "States"
- **Don't omit the trailing divider removal** - always add `<div />` at the end
- **Don't use manual dividers** - StorySection handles dividers automatically
- **Don't use raw HTML headings** (`<h2>`, `<h3>`, `<p>`) - ALWAYS use `<StorySection>` or `<StorySection variant="subsection">`
- **Don't use deprecated components** - no StorySubsection or StoryExampleSection (they're now unified in StorySection)
- **Don't use old naming** like "Common Use Cases" or "In Context" - use `<StorySection inContext={true}>` instead
- **Don't use regular StorySection for Examples** - use `inContext={true}` prop for visual distinction

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
