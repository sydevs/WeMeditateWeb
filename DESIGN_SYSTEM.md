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
--color-primary-300: #5dd4bd    /* Light teal - dark theme contrast (teal-300) */
```

**Dark Theme Usage**: For dark backgrounds, use `teal-300` (#5dd4bd) which provides sufficient contrast while maintaining brand recognition.

#### Secondary Colors
```css
--color-secondary: #e08e79      /* Coral/salmon - accents, highlights */
--color-secondary-dark: #c54d2e /* Dark coral - emphasis */
--color-accent: #ff856f         /* Bright coral - strong CTAs */
--color-secondary-300: #f0a898  /* Light coral - dark theme contrast (coral-300) */
```

**Dark Theme Usage**: For dark backgrounds, use `coral-300` (#f0a898) which provides sufficient contrast while maintaining the warm accent color.

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
--font-sans: 'Raleway', sans-serif       /* Main text, UI elements (default) */
--font-number: 'Futura Book', sans-serif /* Numeric displays, countdowns, special text */
```

**Tailwind Usage**:
- `font-sans` (or `font-raleway`) - Raleway font (default for all text)
- `font-number` - Futura Book font (use for countdowns, large numbers, special headings)

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
- `Link` - Locale-aware links with variants (primary, secondary, neutral) and size options (inherits by default)
- `Icon` - Heroicons wrapper with size/color variants
- `Image` - Responsive image with loading states
- `Divider` - Horizontal rules, leaf decorations

**SVG Components (components/atoms/svgs/)**
- Standalone SVG graphics extracted into reusable components
- Brand icons (LogoSvg, LeafSvg, AnimatedLogoSvg)
- Illustrations (HeaderIllustrationSvg)
- Decorative elements (FloralDividerSvg, LotusDotsSvg, TriangleDecorationSvg)
- See "SVG Components" section below for implementation details

**Form Elements**
- `Checkbox` - Styled checkbox input
- `Radio` - Styled radio button
- `Select` - Dropdown select
- `Toggle` - Switch/toggle input

**Feedback**
- `Spinner` - Loading indicator
- `SplashLoader` - Full-screen/overlay loading with animated logo and optional text (supports sm/md/lg sizes)
- `Duration` - Time duration display (e.g., "10 min")
- `Badge` - Count/status badge
- `Tag` - Keyword/category tag

**Layout**
- `Container` - Content width container with responsive padding
- `Spacer` - Vertical or horizontal spacing component
- `Box` - Flexible container with variants, padding, and shadow options
- `LeafDivider` - Decorative divider with leaf SVG
- `Breadcrumbs` - Breadcrumb navigation component

**Specialty**
- `Countdown` - Countdown timer display
- `LanguageFlag` - Country flag icons for language selection
- `SocialIcon` - Social media platform icons
- `Logo` - Brand logo component
- `Avatar` - User avatar with size variants
- `PageTitle` - Page title with gradient decoration

### Molecules (components/molecules/)

Molecules combine atoms into functional units. Examples:

**Form Components**
- `FormField` - Label + Input + Error message
- `SearchBar` - Input + search Icon + Button
- `FormGroup` - Multiple related form fields
- `InputWithIcon` - Input with prefix/suffix icon
- `LocationSearch` - Mapbox-powered location autocomplete with geolocation (always uses lg size)

**Navigation**
- `NavItem` - Link with active state indicator
- `Breadcrumb` - Breadcrumb navigation item
- `Dropdown` - Dropdown menu trigger + menu (supports both uncontrolled and controlled state for autocomplete use cases)
- `LanguageSelector` - Language dropdown with flags

**Content Display**
- `ContentCard` - Content preview with thumbnail, title, and optional description (supports default and hero variants)
- `MediaCard` - Image + title (for meditation/music listings)
- `Stat` - Icon + number + label
- `Quote` - Blockquote with citation
- `Alert` - Icon + message + dismiss button

**Layout**
- `ContentGrid` - Responsive masonry grid for ContentCard components with fade-in loading
- `MasonryGrid` - Responsive masonry grid for text content with "Show More" functionality

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
- `TechniqueCard` - Meditation technique card with gradient overlay, number badge, and alternating left/right layout
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

### SVG Components

All standalone SVG graphics should be extracted into reusable components in the `components/atoms/svgs/` directory:

**Naming Convention**: Suffix with "Svg" (e.g., `LogoSvg`, `LeafSvg`, `TriangleDecorationSvg`)

**Props Pattern**:
  - Accept `className` prop for flexible sizing and styling
  - No custom size props (xs/sm/md/lg) - use Tailwind classes directly
  - Extend `ComponentProps<'svg'>` for full SVG attributes

**Color Handling**: Always use `currentColor` for fills and strokes to inherit text color

**Default Sizing**: Preserve original default `className` from the inline version

**When to Extract SVGs**:
- Extract inline SVGs found in components during refactoring
- Create new SVG components for brand icons, illustrations, or decorative elements
- Keep inline SVGs only for one-off, component-specific graphics

**When NOT to Use SVG Components**:
- For standard UI icons, use Heroicons via the `Icon` component instead
- For simple geometric shapes that can be achieved with CSS

**Example**:
```tsx
import { ComponentProps } from 'react'

export interface LogoSvgProps extends ComponentProps<'svg'> {}

export function LogoSvg({ className = 'w-5 h-5', ...props }: LogoSvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 18 14"
      className={className}
      fill="none"
      {...props}
    >
      <g fill="none" fillRule="evenodd" stroke="currentColor" strokeWidth=".75">
        {/* SVG paths */}
      </g>
    </svg>
  )
}
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

### 2. When to Create Component Wrappers vs. Using Tailwind Directly

One of the most important design decisions is determining when to create a component abstraction versus using Tailwind utilities directly. Component wrappers add abstraction layers that can improve consistency but also increase complexity and bundle size.

#### Use Direct Tailwind Classes When:

✅ **Simple, single-purpose styling** - Basic text, divs, or spans with straightforward styling
```tsx
// Good: Direct Tailwind for simple text
<div className="text-sm sm:text-base font-light text-gray-700">
  Author bio text
</div>
```

✅ **Context-specific styling** - Styling that's unique to one component or page
```tsx
// Good: Inline styles for one-off layouts
<div className="flex flex-col md:flex-row gap-8 p-6 bg-teal-50 rounded-lg">
  {/* Content */}
</div>
```

✅ **Minimal repetition** - Used in 1-2 places only
```tsx
// Good: Not worth abstracting if only used twice
<span className="text-base sm:text-lg font-normal text-gray-700">
  Share:
</span>
```

✅ **No behavioral logic** - Pure styling without state, effects, or complex interactions

**Example - Text Styling (No Component Needed)**:
The removed `Text` component demonstrated this principle. It only wrapped Tailwind classes without adding meaningful abstraction:
```tsx
// ❌ Overengineered - component wrapper adds no value
<Text as="div" size="base" weight="light">Content</Text>

// ✅ Better - direct and explicit
<div className="text-sm sm:text-base font-light">Content</div>
```

#### Extract to Component When:

✅ **Complex interactive behavior** - Components with state, effects, or event handling
```tsx
// Good: Accordion has complex open/close logic
<Accordion title="Section 1">Content</Accordion>
```

✅ **Extensive reuse (3+ locations)** - Pattern used across multiple files
```tsx
// Good: Button used throughout the app
<Button variant="primary" onClick={handleSubmit}>Submit</Button>
```

✅ **Stateful or dynamic behavior** - Loading states, validation, animations
```tsx
// Good: Spinner manages loading animation
<Spinner size="lg" />
```

✅ **Composition of multiple atoms** - Molecules combining several atoms
```tsx
// Good: FormField composes Label + Input + Error
<FormField
  label="Email"
  type="email"
  error={errors.email}
/>
```

✅ **Complex prop-based variations** - Many conditional styles or behaviors
```tsx
// Good: Icon with size/color variants and accessibility
<Icon icon={HeartIcon} size="md" color="primary" aria-label="Favorite" />
```

✅ **Polymorphic rendering needs** - Components that render as different HTML elements
```tsx
// Good: Heading can render as h1-h6
<Heading level="h2">Section Title</Heading>
```

#### Evaluation Checklist

Before creating a component wrapper, ask:

- [ ] Does this add meaningful abstraction beyond Tailwind utilities?
- [ ] Is there complex logic, state, or behavior to encapsulate?
- [ ] Will this be used in 3+ different locations?
- [ ] Does it compose multiple smaller components?
- [ ] Does it provide a clearer API than raw HTML + Tailwind?
- [ ] Does it encapsulate domain knowledge or business logic?

**If you answer "no" to all questions above, use Tailwind directly.**

#### Migration Pattern: Removing Overengineered Components

If you identify an overengineered component:

1. **Analyze usage** - Find all import locations (`grep -r "from '.*ComponentName'"`)
2. **Verify simplicity** - Confirm component only wraps styling without logic
3. **Refactor usages** - Replace with direct HTML + Tailwind classes
4. **Remove exports** - Delete from barrel exports (`components/atoms/index.ts`)
5. **Delete files** - Remove component files but consider keeping documentation stories
6. **Update docs** - Update README and design system documentation

**Example**: The `Text` component removal (2024) demonstrated this pattern - used in only 2 locations with no behavioral logic, it was successfully replaced with direct Tailwind usage.

### 3. Extracting Designs from Existing Websites

When creating components based on existing web designs (e.g., from wemeditate.com), follow this systematic approach:

#### Step 1: Visual Inspection & Documentation
1. **Take screenshots** of the design element in different states (hover, active, responsive breakpoints)
2. **Identify the component level**: Is this an atom, molecule, or organism?
3. **Note contextual usage**: Where and how is this element used on the site?

#### Step 2: Extract Design Properties

Use browser DevTools to systematically extract:

**Layout & Spacing:**
- Padding: `padding`, `paddingTop`, `paddingBottom`, `paddingLeft`, `paddingRight`
- Margin: `margin`, `marginTop`, `marginBottom`
- Width/Height: Note if fixed or responsive
- Display properties: `display`, `position`

**Typography:**
- Font family: `fontFamily`
- Font size: `fontSize`
- Font weight: `fontWeight`
- Line height: `lineHeight`
- Letter spacing: `letterSpacing`
- Text transform: `textTransform`

**Colors:**
- Text color: `color`
- Background: `background`, `backgroundColor`
- Borders: `borderColor`
- Opacity values for semi-transparent colors

**Visual Effects:**
- Gradients: `background`, `backgroundImage` (note direction, color stops, positions)
- Shadows: `boxShadow`, `textShadow`
- Borders: `border`, `borderRadius`

**Pseudo-elements:**
- Check `::before` and `::after` for decorative elements
- Note their `content`, `position`, dimensions, and styling

#### Step 3: Map to Tailwind Tokens

For each extracted CSS value, find the **closest Tailwind token**:

**Spacing** (px → Tailwind):
- 8px → `2` (0.5rem)
- 16px → `4` (1rem)
- 24px → `6` (1.5rem)
- 32px → `8` (2rem)
- 320px → `w-80` (20rem)

**Colors** (hex → Tailwind):
- \#7b7b7b → `text-gray` (custom token) or `text-gray-500`
- \#61aaa0 → `text-teal` or `bg-teal-500`
- \#c5e0dc → `bg-teal-200`

**Font Sizes** (px → Tailwind):
- 14px → `text-sm`
- 16px → `text-base`
- 18px → `text-lg`
- 32px → `text-4xl`

**Opacity** (decimal → Tailwind):
- 0.01 → `/[0.01]` (arbitrary value)
- 0.18 → `/[0.18]` (arbitrary value)
- 0.3 → `/30` (30%)

#### Step 4: Implement Responsively

Always implement with mobile-first approach:

1. **Start with mobile styles** (no prefix)
2. **Add responsive overrides** using `sm:`, `md:`, `lg:` prefixes
3. **Test at different breakpoints** to ensure proper behavior

**Common Responsive Patterns:**
```tsx
// Text alignment: center on mobile, left on desktop
className="text-center sm:text-left"

// Width: full on mobile, fixed on desktop
className="w-full sm:w-80"

// Gradient position: centered on mobile, left/right on desktop
className="before:left-0 before:w-1/2 sm:before:w-80"
```

#### Step 5: Handle Edge Cases

Consider how the component behaves with:
- **Long text** that wraps to multiple lines
- **Missing optional content** (e.g., subtitle)
- **Different content lengths** across instances
- **Various viewport sizes**

#### Step 6: Iterative Refinement

After initial implementation:
1. **Compare side-by-side** with original design
2. **Adjust values** to match visual appearance
3. **Test responsive behavior** at all breakpoints
4. **Verify accessibility** (color contrast, semantic HTML, ARIA attributes)

**Example: PageTitle Component**

Original design analysis revealed:
- Font: Raleway, 32px, weight 600
- Color: \#7b7b7b
- Letter spacing: 1.5px
- Padding: 32px all around
- Gradient: Transparent to teal, 320px wide, full height
- Alignment-dependent gradient positioning

Mapped to Tailwind:
```tsx
className="
  font-raleway text-4xl font-semibold text-gray-700
  tracking-wider p-8
  before:w-80 before:h-full
  before:from-transparent before:to-teal-200/30
"
```

### 3. Props API Design

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

### 4. Subcomponent Extraction Pattern

When building complex components, you may encounter repeated UI patterns within a single component file. Use this pattern to decide when to extract subcomponents:

#### When to Extract Subcomponents

**Extract as a subcomponent in the same file when:**
- The repeated code is used **2-3 times within the same parent component**
- The pattern is **specific to this component's context** and unlikely to be reused elsewhere
- The subcomponent is **simple and tightly coupled** to the parent's logic
- Extracting it reduces duplicate code by **30+ lines**

**Example: CarouselNavButton within ColumnCarousel**
```tsx
// Subcomponent: only used by ColumnCarousel, appears twice (prev/next)
interface CarouselNavButtonProps {
  direction: 'prev' | 'next'
  column: ColumnProps | null
  onClick: () => void
  disabled: boolean
}

function CarouselNavButton({ direction, column, onClick, disabled }: CarouselNavButtonProps) {
  // Implementation specific to carousel navigation
  return <button>...</button>
}

// Parent component uses it
export function ColumnCarousel({ columns }: ColumnCarouselProps) {
  return (
    <>
      <CarouselNavButton direction="prev" {...} />
      <CarouselNavButton direction="next" {...} />
    </>
  )
}
```

#### When to Create a Separate Atom Component

**Create a new atom component when:**
- The pattern is used in **multiple different parent components**
- The component has **generic utility** beyond the current use case
- You anticipate it will be used in **3+ different contexts**
- It represents a **fundamental UI building block**

**Example: Button atom used across multiple components**
```tsx
// components/atoms/Button/Button.tsx - separate file
export function Button({ variant, size, children }: ButtonProps) {
  return <button>...</button>
}

// Used everywhere
import { Button } from '@/components/atoms/Button'
```

#### Implementation Guidelines

**Placement**: Define subcomponents **above** the main component export in the same file:

```tsx
// 1. Imports
import { useState } from 'react'

// 2. Interfaces for subcomponents
interface SubComponentProps { ... }

// 3. Subcomponent definitions
function SubComponent({ ... }: SubComponentProps) { ... }

// 4. Main component interface
export interface MainComponentProps { ... }

// 5. Main component export
export function MainComponent({ ... }: MainComponentProps) { ... }
```

**Naming**: Use descriptive PascalCase names that indicate their specific purpose (e.g., `CarouselNavButton`, not just `NavButton`)

**TypeScript**: Always define interfaces for subcomponent props, even if they're not exported

**Documentation**: Add a brief JSDoc comment for complex subcomponents:
```tsx
/**
 * Navigation button for carousel - displays chevron and adjacent column title
 */
function CarouselNavButton({ ... }) { ... }
```

### 5. Size Variant Implementation Pattern

When components need size variations, follow this standardized pattern for consistency across the design system.

#### Standard Size Scale

Use a three-tier size system: **small (`sm`)**, **medium (`md`)**, and **large (`lg`)**

- **Small**: Compact UI elements, cards, thumbnails, inline components
- **Medium**: Default for most use cases, standard content areas
- **Large**: Hero sections, full-page elements, prominent features

#### Responsive Size Implementation

Implement sizes with **mobile-first responsive breakpoints** that scale appropriately:

```tsx
const sizeClasses = {
  sm: {
    // Component-specific classes for small size
    // Example: Logo/icon sizes, text sizes, spacing
    element: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24',
    text: 'text-sm sm:text-base md:text-lg',
    gap: 'gap-3 sm:gap-4',
  },
  md: {
    // Medium size (default) - balanced for most contexts
    element: 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28',
    text: 'text-base sm:text-lg md:text-xl',
    gap: 'gap-4 sm:gap-5',
  },
  lg: {
    // Large size - prominent, high-visibility elements
    element: 'w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40',
    text: 'text-lg sm:text-xl md:text-2xl',
    gap: 'gap-4 sm:gap-6',
  },
}
```

#### Size Prop Pattern

**Interface Definition:**
```tsx
export interface ComponentProps {
  /**
   * Size variant for the component.
   * - `sm`: Small - compact for cards/inline use
   * - `md`: Medium (default) - standard size
   * - `lg`: Large - prominent display
   */
  size?: 'sm' | 'md' | 'lg'
  // ... other props
}
```

**Default Value:**
```tsx
export function Component({
  size = 'md',  // Medium as default
  // ... other props
}: ComponentProps) {
  // Implementation
}
```

**Usage in Component:**
```tsx
<div className={sizeClasses[size].element}>
  <Icon className={sizeClasses[size].icon} />
  {text && (
    <p className={sizeClasses[size].text}>
      {text}
    </p>
  )}
</div>
```

#### Size Scaling Guidelines

**Maintain Proportional Relationships:**
- Small → Medium: ~20-25% increase
- Medium → Large: ~20-30% increase
- Gap spacing should scale proportionally with element sizes

**Responsive Breakpoints:**
- Base (mobile): Starting point, smallest size
- `sm:` (640px): Slight increase for small tablets
- `md:` (768px): Full size for tablets/desktop

**Example: SplashLoader Size Implementation**
```tsx
// Real-world example from the codebase
const sizeClasses = {
  sm: {
    logo: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24',  // 64-96px range
    text: 'text-sm sm:text-base md:text-lg',            // 14-18px range
    gap: 'gap-3 sm:gap-4',                              // 12-16px range
  },
  md: {
    logo: 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28',  // 80-112px range
    text: 'text-base sm:text-lg md:text-xl',            // 16-20px range
    gap: 'gap-4 sm:gap-5',                              // 16-20px range
  },
  lg: {
    logo: 'w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40',  // 96-160px range
    text: 'text-lg sm:text-xl md:text-2xl',             // 18-24px range
    gap: 'gap-4 sm:gap-6',                              // 16-24px range
  },
}
```

#### When to Use Each Size

Provide usage guidance in component documentation:

```tsx
/**
 * Size recommendations:
 * - `sm`: Cards, thumbnails, small modals (< 400px height)
 * - `md`: Default for most use cases, medium content areas (400-600px)
 * - `lg`: Full-page splashes, hero sections, large modals (> 600px)
 */
```

#### Consistency Rules

- **Always include all three sizes** when implementing size variants
- **Make `md` the default** unless there's a specific reason otherwise
- **Scale all child elements proportionally** (icons, text, spacing)
- **Test at all responsive breakpoints** (mobile, tablet, desktop)
- **Document size recommendations** in component README

### 6. Styling with Tailwind CSS

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

#### Width Control Patterns

When building components that default to full width, you cannot reliably override `w-full` with another `w-*` class due to CSS specificity. Both `w-full` and `w-64` have the same specificity, and whichever appears **last in the generated CSS file** wins (not necessarily the order in the HTML/className string).

**The Problem:**
```tsx
// ❌ Doesn't work reliably - both have same specificity
<Input className="w-64" />  // Component has w-full internally
// Result: May still be full width depending on CSS generation order
```

**Solution 1: Use `max-w-*` Classes (Recommended)**

The `max-w-*` utility sets `max-width` which works alongside `width: 100%` from `w-full`:

```tsx
// ✅ Works - constrains the full-width element
<Input className="max-w-xs" />   // max 20rem (320px)
<Input className="max-w-sm" />   // max 24rem (384px)
<Input className="max-w-md" />   // max 28rem (448px)
<Input className="max-w-lg" />   // max 32rem (512px)
<Input className="max-w-64" />   // max 16rem (256px)
```

**Solution 2: Container Wrapper (Alternative)**

Wrap the component in a container with the desired width:

```tsx
// ✅ Works - parent constrains child width
<div className="w-64">
  <Input />
</div>

<div className="max-w-md mx-auto">
  <Input />
</div>
```

**When to Use Each Approach:**

- **Use `max-w-*`** when you want quick, inline width control without extra markup
- **Use container wrapper** when you need centering (`mx-auto`), consistent form layouts, or multiple inputs with the same width constraint

**Component Implementation Pattern:**

When building full-width-by-default components:

```tsx
// For inputs without wrapper divs
<input className={`w-full ${className}`} />

// For inputs with wrapper divs (e.g., with icons)
<div className={`relative w-full ${className}`}>
  <input className="w-full" />
</div>
```

This pattern ensures:
- Components default to full width (common form behavior)
- Users can constrain width with `max-w-*` or containers
- No specificity conflicts with width utilities

### 7. Responsive Design

Use mobile-first approach with Tailwind's responsive prefixes:

```tsx
<div className="
  px-4 py-2          /* Mobile default (0px+) */
  sm:px-6 sm:py-3    /* Small tablets, portrait (640px+) */
  md:px-8 md:py-4    /* Tablets, landscape (768px+) */
  lg:px-10 lg:py-5   /* Laptops, desktops (1024px+) */
  xl:px-12 xl:py-6   /* Large desktops (1280px+) */
">
```

**Device Type Reference**:
- **Mobile**: Default styles (no prefix) - 0px and up
- **Small tablets**: `sm:` prefix - 640px and up (portrait orientation)
- **Tablets**: `md:` prefix - 768px and up (landscape orientation)
- **Laptops/Desktops**: `lg:` prefix - 1024px and up
- **Large desktops**: `xl:` and `2xl:` prefixes - 1280px and 1536px and up

### 8. State Management

**Local State**: Use `useState` for component-specific state

**Server State**: Fetch in `+data.ts` files, access via `useData()` hook

**URL State**: Use Vike's routing for filters, pagination, etc.

**Shared State**: Use React Context sparingly, prefer composition

### 9. Rich Text Content Rendering

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

### 10. Locale-Aware Components

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

### 11. ContentGrid Layout Component

**ContentGrid** is a molecule that displays ContentCard components in a responsive masonry layout. It's designed for content-heavy pages like meditation libraries, article grids, and mixed content sections.

**Key Features:**
- **Fade-in on load**: Cards fade in after their images load for smooth progressive loading
- **Unified variant control**: `cardVariant` prop applies to all cards (default or hero)
- **Responsive gaps**: Column spacing adapts to viewport size and variant
- **Centered layout**: Grid centers itself with fixed-width columns (no stretching)
- **Always displays all items**: No pagination (unlike MasonryGrid)

**When to use:**
- Content library pages (meditations, articles, music)
- Mixed content grids with varying aspect ratios
- Anywhere ContentCard components need masonry layout

**Usage:**
```tsx
import { ContentGrid } from '@/components/molecules'

// Basic usage - default variant
<ContentGrid
  items={[
    {
      id: 1,
      title: "Morning Meditation",
      href: "/meditations/morning",
      thumbnailSrc: "/images/morning.jpg",
      playButton: true,
      durationMinutes: 10,
      aspectRatio: "square"
    }
  ]}
/>

// Hero variant - larger cards with increased spacing
<ContentGrid
  items={contentItems}
  cardVariant="hero"
/>

// Custom column breakpoints
<ContentGrid
  items={contentItems}
  breakpointCols={{
    default: 4,  // 4 columns desktop
    1280: 3,     // 3 columns large tablets
    768: 2,      // 2 columns tablets
    640: 1       // 1 column mobile
  }}
/>
```

**Column Gaps:**
- **Default variant**: 16px mobile, 20px tablet, 24px desktop
- **Hero variant**: 24px mobile, 30px tablet, 36px desktop (50% larger)

**Item Structure:**
Each item extends `ContentCardProps` (without `className` and `variant`):
- `id` (required): Unique identifier
- `title` (required): Card title
- `href` (required): Link URL
- `thumbnailSrc` (required): Image URL
- `thumbnailAlt`: Image alt text (defaults to title)
- `description`: Optional description text
- `aspectRatio`: Image aspect ratio (square, video, 4/3, 3/2, 16/9, 21/9)
- `playButton`: Show play button overlay
- `durationMinutes`: Duration badge (e.g., "10 min")
- `badge`: Category/difficulty badge
- `badgeUrl`: Optional link for badge

**vs MasonryGrid:**
- **ContentGrid**: For ContentCard components, always shows all items, supports card variants
- **MasonryGrid**: For text content items, has "Show More" pagination

### 12. Performance Patterns

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

Our atom components are organized into five functional categories in Ladle:

**Atoms / Typography** (2 components)
- Heading, Label

> **Note**: Typography patterns (text sizing, weights, colors) are documented in `Typography.stories.tsx` but do not require a component wrapper. Use Tailwind utilities directly for text styling.

**Atoms / Form** (6 components)
- Button, Checkbox, Radio, Input, Textarea, Select

**Atoms / Media** (5 components)
- Avatar, Icon, Image, LanguageFlag, SocialIcon

**Atoms / Layout** (4 components)
- Box, Container, LeafDivider, Spacer

**Atoms / Specialty** (2 components)
- Duration, Spinner

**Total**: 19 atom components across 5 categories

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
import { StoryWrapper, StorySection } from '../../ladle';

export default {
  title: "Atoms / Form"  // Category, not including component name
} satisfies StoryDefault;

/**
 * Button component showcasing all variants, sizes, and states.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Variants">
      {/* Show all variant options */}
    </StorySection>

    <StorySection title="Sizes">
      {/* Show all size options */}
    </StorySection>

    <StorySection title="States">
      {/* Show loading, disabled, etc. */}
    </StorySection>

    <StorySection title="Examples" inContext={true}>
      {/* Show realistic usage examples */}
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Button"  // Component name set here
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

**Organisms: 1 Story (Two-Level Hierarchy Preferred)**
- Follow same pattern as molecules: use two-level hierarchy with `storyName`
- Create separate sections for each major variant or configuration option
- Within each section, use subsections for "Minimal" and "Maximal" configurations
- Use horizontal subsection layouts (`flex flex-wrap gap-8`) for side-by-side comparisons
- Show integration with templates/pages in "In Context" sections

**Story Structure Pattern:**
```tsx
export default {
  title: "Organisms / Forms"
} satisfies StoryDefault;

export const Default: Story = () => (
  <StoryWrapper>
    {/* Section for each major variant */}
    <StorySection title="Variants">
      <div className="flex flex-wrap gap-8">
        <div className="min-w-2/5">
          <StorySection title="Default Variant" variant="subsection">
            {/* Show default configuration */}
          </StorySection>
        </div>

        <div className="min-w-2/5">
          <StorySection title="Minimal Variant" variant="subsection">
            {/* Show minimal configuration */}
          </StorySection>
        </div>
      </div>
    </StorySection>

    {/* Section for configuration options */}
    <StorySection title="Alignments">
      <div className="flex flex-col gap-8">
        <StorySection title="Left Aligned" variant="subsection">
          {/* Show left alignment */}
        </StorySection>

        <StorySection title="Center Aligned" variant="subsection">
          {/* Show center alignment */}
        </StorySection>
      </div>
    </StorySection>

    {/* Real-world examples */}
    <StorySection title="Contact Form" inContext={true}>
      {/* Practical usage example */}
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Form Builder"
```

**When to use multiple stories (rare):**
- Complex organisms with fundamentally different states (LoggedOut vs LoggedIn)
- Use three-level hierarchy: `title: "Organisms / Navigation / Header"`
- Generally prefer single comprehensive story with sections/subsections instead

**Example with multiple stories (use sparingly):**
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

**Always use story utility components** from `components/ladle/` for consistent structure:

```tsx
import { StoryWrapper, StorySection } from '../../ladle';

export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Section Title">
      {/* Content */}
    </StorySection>

    <StorySection title="Another Section">
      {/* Content */}
    </StorySection>

    <StorySection title="Examples" inContext={true}>
      {/* Real-world usage examples with bold top border */}
    </StorySection>

    {/* Remove trailing divider */}
    <div />
  </StoryWrapper>
);
```

**Key components:**
- `StoryWrapper` - Required outermost wrapper for all stories
- `StorySection` - Unified component for all section types with props:
  - `variant` - 'section' (default), 'subsection', or 'scrollable'
  - `theme` - 'light' (default) or 'dark' for dark content backgrounds
  - `background` - 'none' (default), 'neutral', or 'gradient'
  - `inContext` - When true, adds "In Context - " prefix and bold top border
- `StoryGrid` family - Create multi-dimensional component matrices

See [STORYBOOK.md](STORYBOOK.md) for complete utility component documentation and API reference.

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
- ✅ Use the unified `StorySection` component with appropriate props for all sections
- ✅ Use `inContext={true}` for example sections (adds bold border and "In Context - " prefix)
- ✅ Use `variant="subsection"` for nested sections within major sections
- ✅ Use `theme="dark"` with `background="neutral"` for dark theme showcases
- ✅ Use clear, descriptive section headings
- ✅ Show variants, states, and context together
- ✅ Use semantic HTML and proper accessibility attributes
- ✅ Include realistic content and labels
- ✅ End stories with `<div />` to remove trailing dividers

**DON'T:**
- ❌ Use two-level hierarchy for organisms that need multiple distinct stories
- ❌ Include component name in title path when using two-level hierarchy
- ❌ Create multiple stories for simple atoms/molecules (consolidate instead)
- ❌ Omit the title metadata or storyName (breaks navigation)
- ❌ Use string concatenation for titles (must be literals)
- ❌ Skip the `satisfies StoryDefault` check
- ❌ Use deprecated components (StoryExampleSection, StorySubsection, StoryDarkSection)
- ❌ Use manual dividers (`<hr />`) - StorySection handles dividers automatically
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

### Component Stories with Ladle

All components should have accompanying Ladle stories for visual documentation and development. **See [STORYBOOK.md](STORYBOOK.md) for comprehensive guidelines** on writing consistent, well-organized stories.

**Quick Reference**:
- Stories are created in `ComponentName.stories.tsx` files alongside components
- **Always use** story utility components (`StoryWrapper`, `StorySection`, `StoryExampleSection`, `StoryGrid`, `StorySubsection`)
- Section order varies by category (see [STORYBOOK.md](STORYBOOK.md) for patterns)
- Run `pnpm ladle` to view all component stories at [http://localhost:61000/](http://localhost:61000/)

**Current Status**: 20 atom components with comprehensive stories across 5 categories

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

### Tailwind CSS v4 Syntax

**This project uses Tailwind CSS v4**, which introduced syntax changes from v3. The most notable change affects gradient utilities.

#### Gradient Syntax Change

In Tailwind v4, gradient direction utilities have been renamed for consistency:

**❌ Tailwind v3 Syntax (Incorrect)**:
```tsx
// Old syntax - will cause IDE warnings
className="bg-gradient-to-b from-white to-transparent"
className="bg-gradient-to-t from-white to-transparent"
className="bg-gradient-to-r from-teal-100 to-transparent"
```

**✅ Tailwind v4 Syntax (Correct)**:
```tsx
// New syntax - use bg-linear-to-* instead
className="bg-linear-to-b from-white to-transparent"
className="bg-linear-to-t from-white to-transparent"
className="bg-linear-to-r from-teal-100 to-transparent"
```

**Real-World Example** from [Playlist.tsx](components/molecules/Playlist/Playlist.tsx):
```tsx
{/* Top fade - appears when scrolled down */}
<div
  className={`absolute top-0 left-0 right-0 h-12 bg-linear-to-b from-white to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
    showTopFade ? 'opacity-100' : 'opacity-0'
  }`}
/>

{/* Bottom fade - appears when more content below */}
<div
  className={`absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-white to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
    showBottomFade ? 'opacity-100' : 'opacity-0'
  }`}
/>
```

#### Other Gradient Directions

The naming pattern applies to all gradient directions:
- `bg-linear-to-b` - Top to bottom
- `bg-linear-to-t` - Bottom to top
- `bg-linear-to-r` - Left to right
- `bg-linear-to-l` - Right to left
- `bg-linear-to-br` - Top-left to bottom-right
- `bg-linear-to-bl` - Top-right to bottom-left
- `bg-linear-to-tr` - Bottom-left to top-right
- `bg-linear-to-tl` - Bottom-right to top-left

#### Why the Change?

Tailwind v4 renamed these utilities to be more consistent with CSS gradient syntax. The `linear` prefix clarifies that these are linear gradients, distinguishing them from potential future gradient types (radial, conic, etc.).

**Key Takeaway**: Always use `bg-linear-to-*` for gradients in this project, not `bg-gradient-to-*`.

### Using Design Tokens

```tsx
// Brand Colors
<button className="bg-teal-500 hover:bg-teal-600 text-white">
<div className="bg-coral-500 text-gray-900">
<span className="text-error">Error message</span>

// Typography - Font Families
<h1 className="font-sans">              // Raleway (default)
<span className="font-number">       // Futura Book

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
