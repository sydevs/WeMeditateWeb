# Design System Implementation Guide

This guide establishes best practices for implementing our design system using the **Atomic Design Methodology** with React components and Tailwind CSS.

## Table of Contents

1. [Introduction to Atomic Design](#introduction-to-atomic-design)
2. [Design Principles](#design-principles)
3. [Design Tokens](#design-tokens)
4. [Component Architecture](#component-architecture)
5. [File Organization](#file-organization)
6. [Implementation Guidelines](#implementation-guidelines)
7. [Accessibility Standards](#accessibility-standards)
8. [Testing & Documentation](#testing--documentation)

---

## Introduction to Atomic Design

Atomic Design is a methodology for creating design systems with five distinct levels:

### The Five Levels

**Atoms** are the foundational UI elements that cannot be broken down further without losing their meaning. These are the basic HTML elements and their styled variants.

**Molecules** are simple groups of atoms that function together as a unit. They follow the single responsibility principle and are reusable across contexts.

**Organisms** are more complex components composed of molecules and/or atoms. They form distinct sections of the interface that can be used independently.

**Templates** are page-level objects that place organisms into layouts, showing the content structure without final content.

**Pages** are specific instances of templates with real, representative content. These help test pattern effectiveness with actual data.

### Key Principles

- **Non-linear thinking**: Shift fluidly between abstract components and concrete interfaces
- **Separation of concerns**: Structure (templates) remains separate from content (pages)
- **Reusability**: Components should be designed for reuse across different contexts
- **Composability**: Larger components should be built from smaller, well-defined pieces
- **Single responsibility**: Each component should do one thing well

---

## Design Principles

### 1. Mobile-First Approach
Design and build for mobile screens first, then progressively enhance for larger viewports. Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`).

### 2. Performance Optimization
- Lazy load components when appropriate
- Optimize images using modern formats (WebP) with fallbacks
- Minimize bundle sizes by avoiding unnecessary dependencies
- Leverage Cloudflare Workers edge computing for fast SSR

### 3. Consistency Over Customization
Use design tokens consistently. Avoid one-off custom values. If a new value is needed frequently, add it to the design tokens.

### 4. Progressive Enhancement
Build features that work without JavaScript first, then enhance with interactivity. Server-side rendering ensures content is accessible immediately.

### 5. Semantic HTML
Use appropriate HTML elements for their intended purpose. This improves accessibility and SEO.

### 6. Animation Philosophy
**Subtle and purposeful**: Animations should enhance understanding, not distract. Use:
- Page transitions: 300ms ease-in-out
- Micro-interactions: 150-200ms ease
- Loading states: subtle pulsing or fade effects
- Avoid jarring or excessive motion

---

## Design Tokens

Design tokens are the visual design atoms of the design system. They are named entities that store visual design attributes.

### Color Palette

Based on wemeditate.com brand analysis:

#### Primary Colors
```css
--color-primary: #61aaa0        /* Teal - primary brand color, links, CTAs */
--color-primary-light: #83bcb4  /* Light teal - hover states, backgrounds */
--color-primary-lighter: #c5e0dc /* Very light teal - subtle backgrounds */
--color-primary-bg: #ebf4f3     /* Teal background tint */
```

#### Secondary Colors
```css
--color-secondary: #e08e79      /* Coral/salmon - accents, highlights */
--color-secondary-dark: #c54d2e /* Dark coral - emphasis */
--color-accent: #ff856f         /* Bright coral - strong CTAs */
```

#### Neutral Colors
```css
--color-text-primary: #555      /* Dark gray - headings, primary text */
--color-text-secondary: #7b7b7b /* Medium gray - body text */
--color-text-tertiary: #9d9d9c  /* Light gray - subtle text */

--color-border: #c6c6c6         /* Standard borders */
--color-border-light: #d7d7d6   /* Subtle borders */

--color-bg-white: #ffffff       /* Pure white backgrounds */
--color-bg-subtle: #f7fbfa      /* Off-white, subtle backgrounds */
--color-bg-light: #f6f6f6       /* Light gray backgrounds */
--color-bg-warm: #faf0e3        /* Warm beige background */
```

#### Semantic Colors
```css
--color-error: #cc5e5e          /* Error states, validation */
--color-error-dark: #8b0000     /* Dark red for critical errors */
--color-success: #4c8d84        /* Success states */
--color-info: #61aaa0           /* Info states (uses primary) */
```

### Typography

#### Font Families
```css
--font-primary: 'Raleway', sans-serif    /* Main text, UI elements */
--font-secondary: 'Futura Book', sans-serif /* Headings, special text */
```

#### Font Weights
```css
--font-weight-extralight: 200  /* Raleway Extra Light */
--font-weight-light: 300       /* Raleway Light - default body */
--font-weight-normal: 400      /* Raleway Regular */
--font-weight-medium: 500      /* Raleway Medium - headings */
--font-weight-semibold: 600    /* Raleway Semi Bold */
--font-weight-bold: 700        /* Raleway Bold - emphasis */
```

### Spacing, Typography Scale, Shadows, Animations

For spacing, font sizes, line heights, border radius, shadows, transitions, and animations, **use Tailwind CSS defaults**. This ensures consistency with the Tailwind ecosystem and reduces custom configuration maintenance.

**Tailwind provides excellent defaults for:**
- Spacing scale (0-96 in increments of 4px)
- Font size scale (xs through 9xl)
- Line heights (tight, snug, normal, relaxed, loose)
- Border radius (none, sm, md, lg, xl, 2xl, 3xl, full)
- Box shadows (sm, md, lg, xl, 2xl)
- Transitions and animations

Refer to [Tailwind CSS documentation](https://tailwindcss.com/docs) for the full default scale.

---

## Component Architecture

### Atomic Design Component Hierarchy

```
components/
├── atoms/           # Basic building blocks
├── molecules/       # Simple component groups
├── organisms/       # Complex component sections
└── templates/       # Page layout structures
```

### Atoms (components/atoms/)

Atoms are the foundational elements. Examples for wemeditate.com:

**UI Primitives**
- `Button` - Primary, secondary, text variants
- `Input` - Text input, textarea, with validation states
- `Label` - Form labels with required indicators
- `Heading` - h1-h6 with consistent styling
- `Text` - Paragraph, span with size variants
- `Link` - Internal/external links with locale handling
- `Icon` - Heroicons wrapper with size/color variants
- `Image` - Responsive image with loading states
- `Divider` - Horizontal rules, leaf decorations

**Form Elements**
- `Checkbox` - Styled checkbox input
- `Radio` - Styled radio button
- `Select` - Dropdown select
- `Toggle` - Switch/toggle input

**Feedback**
- `Spinner` - Loading indicator
- `Badge` - Count/status badge
- `Tag` - Keyword/category tag

### Molecules (components/molecules/)

Molecules combine atoms into functional units. Examples:

**Form Components**
- `FormField` - Label + Input + Error message
- `SearchBar` - Input + search Icon + Button
- `FormGroup` - Multiple related form fields
- `InputWithIcon` - Input with prefix/suffix icon

**Navigation**
- `NavItem` - Link with active state indicator
- `Breadcrumb` - Breadcrumb navigation item
- `Dropdown` - Dropdown menu trigger + menu
- `LanguageSelector` - Language dropdown with flags

**Content Display**
- `MediaCard` - Image + title (for meditation/music listings)
- `Stat` - Icon + number + label
- `Quote` - Blockquote with citation
- `Alert` - Icon + message + dismiss button

**Interactive**
- `AudioPlayer` - Play button + progress bar + time
- `VideoPlayer` - Video controls interface
- `Accordion` - Collapsible content section
- `Tooltip` - Tooltip trigger + content

### Organisms (components/organisms/)

Organisms are complex, distinct interface sections. Examples:

**Navigation**
- `Header` - Logo + main navigation + CTA + language selector
- `Footer` - Multi-column footer with links, social, copyright
- `Sidebar` - Navigation sidebar with logo and page links
- `MobileMenu` - Hamburger menu for mobile navigation

**Content Sections**
- `Hero` - Full-width hero section with background image + text + CTA
- `MeditationGrid` - Grid of meditation cards with filters
- `ArticleList` - List of article previews with pagination
- `TestimonialCarousel` - Carousel of user testimonials
- `FeatureSection` - Image + text feature block
- `CTASection` - Call-to-action with background and buttons

**Forms**
- `ContactForm` - Complete contact form with validation
- `NewsletterSignup` - Email capture form
- `SearchInterface` - Search with filters and results

**Content Display**
- `ArticleContent` - Rich text article renderer
- `AudioLibrary` - Audio player with playlist
- `VideoGallery` - Video grid with modal player
- `RelatedContent` - Grid of related articles/meditations

### Templates (components/templates/)

Templates define page layouts. Examples:

- `DefaultLayout` - Standard layout with sidebar navigation
- `FullWidthLayout` - Full-width layout for landing pages
- `ArticleLayout` - Layout optimized for long-form content
- `GridLayout` - Multi-column grid layout
- `SplitLayout` - Two-column split layout

### Pages (pages/)

Pages use templates with real content, handled by Vike's file-based routing system. The `+Page.tsx` files in each route directory represent the page level of atomic design.

---

## File Organization

### Component File Structure

Each component should live in its own directory with related files:

```
components/atoms/Button/
├── Button.tsx           # Main component
├── Button.types.ts      # TypeScript interfaces
├── index.ts            # Public exports
└── README.md           # Component documentation (optional)
```

### Component Template

```tsx
// components/atoms/Button/Button.tsx
import { ComponentProps } from 'react'

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: 'primary' | 'secondary' | 'text'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    primary: 'bg-[#61aaa0] hover:bg-[#4c8d84] text-white',
    secondary: 'bg-[#e08e79] hover:bg-[#c54d2e] text-white',
    text: 'bg-transparent hover:opacity-50 text-[#61aaa0]',
  }

  const sizeStyles = {
    sm: 'px-4 py-1 text-sm',
    md: 'px-6 py-2 text-base',
    lg: 'px-10 py-3 text-lg',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  )
}
```

### Naming Conventions

**Components**: PascalCase (e.g., `Button`, `MediaCard`, `MeditationGrid`)

**Files**: Match component name (e.g., `Button.tsx`, `MediaCard.tsx`)

**Props**: camelCase with descriptive names (e.g., `isLoading`, `onSubmit`, `variant`)

**CSS Classes**: Use Tailwind utility classes. For custom classes, use kebab-case.

**Boolean Props**: Prefix with `is`, `has`, `should`, or `can` (e.g., `isOpen`, `hasError`, `shouldValidate`)

---

## Implementation Guidelines

### 1. Component Design Checklist

Before implementing a component, ask:

- [ ] What is the single responsibility of this component?
- [ ] Is this the right atomic level (atom, molecule, organism)?
- [ ] Can this be broken into smaller components?
- [ ] Does this component already exist in a similar form?
- [ ] What props does it need to be flexible but not complex?
- [ ] What are the different states it can be in?
- [ ] How will it be used in different contexts?

### 2. Props API Design

**Good Props Design:**
- Intuitive and predictable names
- Type-safe with TypeScript
- Sensible defaults
- Compose with native HTML props when appropriate
- Use discriminated unions for mutually exclusive props

**Example:**
```tsx
// Good: Clear, type-safe, extends native props
interface ButtonProps extends ComponentProps<'button'> {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

// Bad: Unclear, not type-safe
interface ButtonProps {
  type?: string
  big?: boolean
  color?: string
}
```

### 3. Styling with Tailwind CSS

**Preferences:**
1. Use Tailwind utility classes directly in JSX
2. Use template literals for conditional classes
3. Consider `clsx` or `cn` utility for complex conditional styling
4. Extract to CSS only when Tailwind utilities are insufficient
5. Use Tailwind's `@apply` sparingly

**Example:**
```tsx
// Good: Composable utility classes
<button className={`px-6 py-2 rounded ${isPrimary ? 'bg-teal-600' : 'bg-coral-600'}`}>

// Better: With utility function
import { cn } from '@/lib/utils'

<button className={cn(
  'px-6 py-2 rounded transition-colors',
  isPrimary && 'bg-teal-600 hover:bg-teal-700',
  !isPrimary && 'bg-coral-600 hover:bg-coral-700'
)}>
```

### 4. Responsive Design

Use mobile-first approach with Tailwind's responsive prefixes:

```tsx
<div className="
  px-4 py-2          /* Mobile default */
  sm:px-6 sm:py-3    /* Small screens (640px+) */
  md:px-8 md:py-4    /* Medium screens (768px+) */
  lg:px-10 lg:py-5   /* Large screens (1024px+) */
  xl:px-12 xl:py-6   /* Extra large (1280px+) */
">
```

### 5. State Management

**Local State**: Use `useState` for component-specific state

**Server State**: Fetch in `+data.ts` files, access via `useData()` hook

**URL State**: Use Vike's routing for filters, pagination, etc.

**Shared State**: Use React Context sparingly, prefer composition

### 6. Rich Text Content Rendering

PayloadCMS content is structured as a rich text AST. Create renderer components:

```
components/organisms/RichTextRenderer/
├── RichTextRenderer.tsx         # Main renderer
├── nodes/
│   ├── HeadingNode.tsx         # Heading renderer
│   ├── ParagraphNode.tsx       # Paragraph renderer
│   ├── ImageNode.tsx           # Image renderer
│   ├── QuoteNode.tsx           # Quote renderer
│   └── ...
```

Example structure:
```tsx
export function RichTextRenderer({ content }: { content: RichTextContent }) {
  return (
    <div className="prose prose-lg">
      {content.map((node, index) => {
        switch (node.type) {
          case 'heading':
            return <HeadingNode key={index} {...node} />
          case 'paragraph':
            return <ParagraphNode key={index} {...node} />
          // ... other node types
        }
      })}
    </div>
  )
}
```

### 7. Locale-Aware Components

Always use the `Link` component from `components/Link.tsx` for internal navigation. It automatically handles locale prefixing.

```tsx
import { Link } from '@/components/Link'

// Automatically becomes /es/meditation for Spanish locale
<Link href="/meditation">Meditation</Link>
```

For custom components that need locale awareness:
```tsx
import { usePageContext } from 'vike-react/usePageContext'

export function LocaleAwareComponent() {
  const { locale } = usePageContext()

  // Use locale for content, formatting, etc.
}
```

### 8. Performance Patterns

**Image Optimization:**
```tsx
// Use next-gen formats with fallbacks
<picture>
  <source type="image/webp" srcSet={webpSrc} />
  <img src={jpgSrc} alt={alt} loading="lazy" />
</picture>
```

**Code Splitting:**
```tsx
// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'))

<Suspense fallback={<Spinner />}>
  <HeavyComponent />
</Suspense>
```

**Memoization:**
```tsx
// Memoize expensive computations
const sortedItems = useMemo(
  () => items.sort((a, b) => a.priority - b.priority),
  [items]
)

// Memoize callback functions
const handleClick = useCallback(
  () => doSomething(value),
  [value]
)
```

---

## Accessibility Standards

Target: **WCAG 2.1 Level AA** compliance

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Logical tab order (match visual flow)
- Visible focus indicators (use Tailwind's `focus:` variants)
- Escape key closes modals/dropdowns

```tsx
// Example: Accessible button with focus styles
<button className="focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2">
  Click me
</button>
```

### Semantic HTML

Use appropriate HTML elements:
- `<nav>` for navigation
- `<main>` for main content
- `<article>` for articles
- `<button>` for actions, `<a>` for navigation
- `<h1>`-`<h6>` in hierarchical order

### ARIA Attributes

Use ARIA when semantic HTML is insufficient:

```tsx
// Dropdown menu
<button
  aria-expanded={isOpen}
  aria-haspopup="true"
  aria-controls="menu-id"
>
  Menu
</button>

// Loading state
<button aria-busy={isLoading} aria-live="polite">
  {isLoading ? 'Loading...' : 'Submit'}
</button>
```

### Color Contrast

Ensure sufficient contrast ratios:
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum

Use online tools to verify contrast with brand colors.

### Alternative Text

All images must have meaningful alt text:

```tsx
// Decorative image
<img src="decoration.svg" alt="" role="presentation" />

// Informative image
<img src="meditation-pose.jpg" alt="Woman meditating in lotus position" />

// Linked image
<a href="/meditation">
  <img src="icon.svg" alt="Go to meditation page" />
</a>
```

### Form Accessibility

```tsx
<div>
  <label htmlFor="email">Email address</label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? 'email-error' : undefined}
  />
  {hasError && (
    <span id="email-error" role="alert">
      Please enter a valid email
    </span>
  )}
</div>
```

---

## Story Organization with Atomic Design

Component stories provide visual documentation and enable isolated component development. We use [Ladle](https://ladle.dev/) for our component library (see [STORYBOOK.md](STORYBOOK.md) for setup).

Our story organization follows the **Atomic Design** methodology, creating a hierarchical navigation structure that helps teams understand component relationships and complexity levels.

### Hierarchical Title Structure

Story organization varies by component complexity level:

#### Atoms & Molecules: Two-Level Hierarchy

For **atoms and molecules**, use a **two-level hierarchy** with the component name specified via the `storyName` property:

```
[Atomic Level] / [Functional Category]
```

**Example:**
```tsx
import type { Story, StoryDefault } from "@ladle/react";
import { Button } from "./Button";

export default {
  title: "Atoms / Interactive"
} satisfies StoryDefault;

export const Default: Story = () => (
  // Story implementation
);

Default.storyName = "Button"
```

This creates organized navigation in Ladle:
```
📁 Atoms
  📁 Form
    📄 Button
    📄 Input
    📄 Select
    📄 Checkbox
  📁 Media
    📄 Icon
```

**Key Pattern:**
- Remove the component name from the `title` path
- Add `Default.storyName = "Component Name"` after the story export
- Use proper title case with spaces for multi-word components (e.g., "Social Icon")

**Why this works for atoms/molecules:** These simpler components typically need only one comprehensive story, making the flatter hierarchy cleaner and easier to navigate.

#### Organisms & Templates: Three-Level Hierarchy (Optional)

For **organisms and templates**, you may use a **three-level hierarchy** when components need multiple distinct stories:

```
[Atomic Level] / [Functional Category] / [Component Name]
```

**Example:**
```tsx
export default {
  title: "Organisms / Navigation / Header"
} satisfies StoryDefault;

export const LoggedOut: Story = () => (/* ... */);
export const LoggedIn: Story = () => (/* ... */);
export const MobileMenu: Story = () => (/* ... */);
```

**Alternatively**, use an **interactive story** with Ladle's args/controls for complex organisms instead of multiple stories.

**When to use 3-level hierarchy:**
- Component has multiple distinct use cases that can't easily fit in one story
- Different stories showcase fundamentally different states or configurations
- You need to demonstrate the component in various complex contexts

**When to use interactive stories instead:**
- Component has many prop combinations
- You want to provide a "playground" for testing different configurations
- Users benefit from real-time prop manipulation

### Atom Categories

**Atoms / Typography**
- Heading, Text, Label

**Atoms / Form**
- Button (unified text, icon-only, and icon+text), Input, Textarea, Select, Checkbox, Radio

**Atoms / Media**
- Image, Icon, Avatar

**Atoms / Layout**
- Container, Box, Spacer

**Atoms / Specialty**
- LanguageFlag, SocialIcon, Spinner, Duration

### Future Hierarchy (Proposed)

**Molecules** (Proposed - not yet implemented)
- `Molecules / Forms` - FormField, SearchBar, LoginForm
- `Molecules / Cards` - MediaCard, ArticleCard, ProfileCard
- `Molecules / Navigation` - NavLink, Breadcrumb, Pagination
- `Molecules / Content` - Alert, Toast, Stat

**Organisms** (Proposed - not yet implemented)
- `Organisms / Navigation` - Header, Footer, Sidebar
- `Organisms / Content` - MeditationGrid, ArticleList, Hero
- `Organisms / Forms` - ContactForm, RegistrationForm, FilterPanel

**Templates** (Proposed - not yet implemented)
- `Templates / Page Layouts` - ArticleLayout, DashboardLayout, LandingLayout

**Pages** (Proposed - not yet implemented)
- `Pages / Home`, `Pages / Meditation Detail`, `Pages / Article`, etc.

### Story Structure Guidelines

**Atoms: One Story Per Component**

Each atom has a single comprehensive `Default` story that includes:
- All variants and sizes
- All states (loading, disabled, validation)
- Important combinations
- Usage examples in context

**Why one story?** Atoms are simple enough that all variants fit in one view. Context will be shown when atoms are composed into molecules and organisms.

**Example Atom Story:**

```tsx
import type { Story, StoryDefault } from "@ladle/react";
import { Button } from "./Button";

export default {
  title: "Atoms / Interactive"
} satisfies StoryDefault;

/**
 * Button component showcasing all variants, sizes, and states.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Variants</h3>
      {/* Show all variant options */}
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Sizes</h3>
      {/* Show all size options */}
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">States</h3>
      {/* Show loading, disabled, etc. */}
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">In Context</h3>
      {/* Show realistic usage examples */}
    </div>
  </div>
);

Default.storyName = "Button"
```

### Molecules & Organisms (Future)

When implementing molecules and organisms, follow these patterns:

**Molecules: 1 Story (Two-Level Hierarchy)**
- Follow the same pattern as atoms: use two-level hierarchy with `storyName`
- `Default` - Single comprehensive story showing all variants and configurations
- Use interactive controls (Ladle args) if you need a "playground" for complex props

**Example:**
```tsx
export default {
  title: "Molecules / Forms"
} satisfies StoryDefault;

export const Default: Story = () => (/* comprehensive story */);

Default.storyName = "Form Field"
```

**Organisms: 1-4 Stories (Three-Level Hierarchy if Multiple Stories)**
- **Option 1**: Single comprehensive story with two-level hierarchy + `storyName` (preferred)
- **Option 2**: Multiple stories using three-level hierarchy (when needed for distinct use cases)
- Show integration with templates/pages in context sections

**Example with multiple stories:**
```tsx
export default {
  title: "Organisms / Navigation / Header"
} satisfies StoryDefault;

export const LoggedOut: Story = () => (/* ... */);
export const LoggedIn: Story = () => (/* ... */);
export const Mobile: Story = () => (/* ... */);
```

**Templates: 1-3 Stories (Three-Level Hierarchy)**
- Use three-level hierarchy as templates often need multiple stories
- Show different page states and content variations

### Story Content Organization

Use semantic HTML with clear visual sections:

```tsx
<div className="flex flex-col gap-8">
  {/* Major section */}
  <div>
    <h3 className="text-lg font-semibold mb-4 text-gray-900">Section Title</h3>
    {/* Content */}
  </div>

  {/* Visual separator */}
  <hr className="border-gray-200" />

  {/* Next section */}
  <div>
    <h3 className="text-lg font-semibold mb-4 text-gray-900">Another Section</h3>
    {/* Content */}
  </div>
</div>
```

### Story Documentation

Include comprehensive JSDoc comments:

```tsx
/**
 * [ComponentName] component showcasing all [variants/sizes/states/usage patterns].
 */
export const Default: Story = () => (
  // Implementation
);
```

### File Structure

Stories remain co-located with their components:

```
components/
├── atoms/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.stories.tsx  ← Includes title metadata
│   │   └── index.ts
│   └── ...
├── molecules/           ← Future
│   └── FormField/
│       ├── FormField.tsx
│       ├── FormField.stories.tsx
│       └── index.ts
└── organisms/           ← Future
    └── Header/
        ├── Header.tsx
        ├── Header.stories.tsx
        └── index.ts
```

### Best Practices

**DO:**
- ✅ **Atoms & Molecules**: Use two-level hierarchy with `storyName` property
- ✅ **Organisms & Templates**: Use three-level hierarchy when multiple stories are needed
- ✅ Add `Default.storyName = "Component Name"` for two-level hierarchies
- ✅ Use proper title case with spaces for multi-word names (e.g., "Social Icon")
- ✅ Consolidate simple components (atoms/molecules) into one comprehensive story
- ✅ Consider interactive stories (Ladle args) for complex organisms instead of multiple stories
- ✅ Separate sections with `<hr className="border-gray-200" />`
- ✅ Use clear, descriptive section headings
- ✅ Show variants, states, and context together
- ✅ Use semantic HTML and proper accessibility attributes
- ✅ Include realistic content and labels

**DON'T:**
- ❌ Use two-level hierarchy for organisms that need multiple distinct stories
- ❌ Include component name in title path when using two-level hierarchy
- ❌ Create multiple stories for simple atoms/molecules (consolidate instead)
- ❌ Omit the title metadata or storyName (breaks navigation)
- ❌ Use string concatenation for titles (must be literals)
- ❌ Skip the `satisfies StoryDefault` check
- ❌ Create separate InContext stories for atoms (include in Default)
- ❌ Use generic placeholder text without context
- ❌ Forget to use spaces in multi-word component names ("SocialIcon" → "Social Icon")

### Benefits of This Approach

1. **Mental Model Alignment**: Matches Atomic Design philosophy
2. **Clean Navigation**: Two-level hierarchy with `storyName` avoids deep folder nesting
3. **Scalability**: Easy to add components at the right complexity level
4. **Discoverability**: Developers know exactly where to find components
5. **Complexity Chunking**: Components grouped by increasing complexity
6. **Functional Grouping**: Related components are near each other in the same category
7. **No File Restructuring**: Stories stay co-located with source code
8. **Future-Proof**: Ready for molecules, organisms, templates, and pages

---

## Testing & Documentation

### Component Documentation

Each component should have clear documentation:

**Inline JSDoc comments:**
```tsx
/**
 * Primary button component for user actions.
 *
 * @example
 * <Button variant="primary" size="lg" onClick={handleClick}>
 *   Click me
 * </Button>
 */
export function Button({ variant, size, onClick, children }: ButtonProps) {
  // ...
}
```

**README.md in component directory** (for complex components):
```markdown
# MediaCard

Displays meditation or music content with thumbnail, title, and duration.

## Usage

\`\`\`tsx
<MediaCard
  title="Morning Meditation"
  duration="10 min"
  thumbnail="/images/morning.jpg"
  href="/meditations/morning"
/>
\`\`\`

## Props

- `title` - Card title
- `duration` - Content duration
- `thumbnail` - Image URL
- `href` - Link destination
```

### Manual Testing Checklist

Before marking a component as complete:

- [ ] Renders correctly on mobile, tablet, desktop
- [ ] Works with keyboard navigation
- [ ] Has visible focus indicators
- [ ] Handles loading/error states appropriately
- [ ] Works with different content lengths (short/long text)
- [ ] Works in all supported locales
- [ ] Performs well (no unnecessary re-renders)
- [ ] Accessible (semantic HTML, ARIA, contrast)

---

## Tailwind Configuration

The project uses a minimal Tailwind configuration that extends only what's needed for brand identity. See [tailwind.config.ts](./tailwind.config.ts) for the complete configuration.

**Custom Configuration:**

- **Colors**: Full teal and coral color palettes with semantic color names (error, success, info)
- **Typography**: Raleway font family (200-700 weights) and Futura Book secondary font
- **Everything else**: Uses Tailwind CSS defaults

This approach minimizes custom configuration while ensuring brand consistency. For spacing, font sizes, shadows, and animations, use Tailwind's excellent default scales.

### Using Design Tokens

```tsx
// Brand Colors
<button className="bg-teal-500 hover:bg-teal-600 text-white">
<div className="bg-coral-500 text-gray-900">
<span className="text-error">Error message</span>

// Typography - Font Families
<h1 className="font-sans">              // Raleway (default)
<span className="font-secondary">       // Futura Book

// Typography - Font Weights
<p className="font-light">               // Raleway Light 300 (default body)
<h2 className="font-medium">             // Raleway Medium 500 (headings)
<h1 className="font-semibold">           // Raleway Semi Bold 600 (h1)
<strong className="font-bold">           // Raleway Bold 700

// Everything else uses Tailwind defaults
<div className="p-5 mb-12">              // Spacing
<div className="text-xl leading-relaxed"> // Font sizes and line heights
<div className="shadow-md rounded-lg">   // Shadows and border radius
<div className="transition duration-300"> // Transitions
```

### Font Loading

Fonts are loaded via `@font-face` declarations in [layouts/fonts.css](./layouts/fonts.css):

- **Raleway**: 6 weights (200, 300, 400, 500, 600, 700)
- **Futura Book**: Regular weight (400)

All fonts use:
- WOFF2 format (primary) for modern browsers
- WOFF format (fallback) for broader support
- `font-display: swap` for optimal loading performance

Font files are organized in `public/fonts/`:
```
public/fonts/
├── raleway/        # All Raleway weights
└── futura-book/    # Futura Book font
```

### Icons

This project uses **Heroicons** (https://heroicons.com/) by the makers of Tailwind CSS.

- Over 200+ beautiful hand-crafted SVG icons
- Two styles: outline (24x24) and solid (24x24, 20x20)
- MIT licensed, tree-shakeable
- Import directly from `@heroicons/react/24/outline` or `@heroicons/react/24/solid`

Use via the `Icon` component wrapper:
```tsx
import { HeartIcon } from '@heroicons/react/24/outline'
import { Icon } from '@/components/atoms'

<Icon icon={HeartIcon} size="lg" color="primary" />
```

See [public/fonts/README.md](./public/fonts/README.md) for detailed font documentation.

---

## Getting Started

### Implementing Your First Component

1. **Identify the atomic level**: Determine if it's an atom, molecule, organism, or template
2. **Design the API**: Define props, states, and behaviors
3. **Create the file structure**: Set up the component directory
4. **Implement with TypeScript**: Write the component with full type safety
5. **Style with Tailwind**: Use utility classes following design tokens
6. **Add accessibility**: Ensure keyboard navigation, ARIA, and semantic HTML
7. **Document**: Add JSDoc comments and usage examples
8. **Test manually**: Verify responsive behavior, accessibility, and edge cases

### Example Workflow

```bash
# 1. Create component directory
mkdir -p components/atoms/Button

# 2. Create files
touch components/atoms/Button/Button.tsx
touch components/atoms/Button/Button.types.ts
touch components/atoms/Button/index.ts

# 3. Implement component following guidelines above

# 4. Export from index
# components/atoms/Button/index.ts
export { Button } from './Button'
export type { ButtonProps } from './Button.types'

# 5. Use in your pages
import { Button } from '@/components/atoms/Button'
```

---

## Resources

### Internal References
- [CLAUDE.md](./CLAUDE.md) - Project overview and architecture
- [server/CACHING.md](./server/CACHING.md) - Caching strategy documentation

### External Resources
- [Atomic Design Methodology](https://atomicdesign.bradfrost.com/chapter-2/) - Brad Frost's original methodology
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Utility-first CSS framework
- [React Documentation](https://react.dev) - Official React docs
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - Accessibility standards
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) - TypeScript guide

---

## Maintaining the Design System

### Adding New Components

1. Discuss component need and atomic level with team
2. Check if similar component exists that can be extended
3. Design component API (props, variants, states)
4. Implement following this guide's patterns
5. Document with examples
6. Review with team before merging

### Updating Design Tokens

1. Propose token changes with rationale
2. Update this document's Design Tokens section
3. Update Tailwind configuration
4. Update affected components
5. Verify no visual regressions

### Deprecating Components

1. Mark component as deprecated in JSDoc
2. Add warning comment with migration path
3. Update documentation
4. Remove after one major version

---

## FAQ

**Q: Should I create a new atom or use an existing one?**

A: Always check existing components first. If an existing component can be extended with a prop variant, do that instead. Create new components only when the functionality is distinctly different.

**Q: When should I extract a molecule from atoms?**

A: When you find yourself combining the same atoms in the same way more than twice, extract it to a molecule.

**Q: Can I use inline styles or custom CSS?**

A: Prefer Tailwind utilities. Use custom CSS only when Tailwind is truly insufficient (complex animations, pseudo-element content, etc.).

**Q: How do I handle theme variations?**

A: Currently, only one theme is supported. If themes are needed in the future, use CSS custom properties and Tailwind's dark mode feature.

**Q: Should every component be fully generic and reusable?**

A: Balance reusability with pragmatism. Atoms and molecules should be generic. Organisms can be more specific to domain needs. Avoid premature abstraction.

---

## Conclusion

This design system guide provides the foundation for building consistent, accessible, and maintainable UI components. As you implement components:

- **Think in systems**: Every component is part of a larger whole
- **Prioritize reusability**: Build components that work in multiple contexts
- **Maintain consistency**: Use design tokens religiously
- **Focus on accessibility**: Build for all users from the start
- **Document as you go**: Future you (and your team) will thank you

Remember, the atomic design methodology is a mental model, not a strict rule. Use your judgment to create the best experience for users while maintaining a clean, scalable codebase.
