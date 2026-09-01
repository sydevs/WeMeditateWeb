---
paths:
  - "components/**"
  - "layouts/**"
---

# Design System

This project uses the **Atomic Design Methodology** to build a consistent, scalable component library.

**IMPORTANT**: Before creating any UI component, you MUST:
1. Read [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md) for component architecture, implementation guidelines, and accessibility standards
2. Read [STORYBOOK.md](../../STORYBOOK.md) before writing component stories
3. Follow these documents as the source of truth for all component development

See [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md) for comprehensive guidelines on:

- **Design Principles**: Mobile-first, performance-focused, accessible development
- **Design Tokens**: Colors, typography, spacing scales from wemeditate.com brand
- **Component Architecture**: Atoms, molecules, organisms, templates, and pages structure
- **Implementation Guidelines**: Best practices for building components with React + Tailwind CSS
- **Accessibility Standards**: WCAG 2.1 Level AA compliance requirements
- **File Organization**: How to structure component directories and exports

## Atomic Design Classification Guide

**IMPORTANT**: Before classifying any component, read [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md) for complete component architecture and implementation guidelines.

Use this decision tree to classify components correctly:

- **Atom**: Single, indivisible UI element that cannot be broken down further
  - Examples: Button, Input, Icon, Label, Text, Checkbox
  - Test: Can this be divided into smaller functional pieces? If no → Atom

- **Molecule**: 2-3 atoms combined into a simple functional group
  - Examples: FormField (Label + Input + Error), SearchBar (Input + Button), Author (Avatar + Text)
  - Test: Does this combine multiple atoms into a single purpose? If yes → Molecule

- **Organism**: Complex section with multiple molecules and/or atoms
  - Examples: Header (Logo + Navigation + Search), Footer, Card Grid, Form
  - Test: Is this a complete section of a page? If yes → Organism

- **Template**: Page layout structure without real content
  - Examples: Article Layout, Dashboard Layout, Landing Page Template
  - Test: Does this define page-level structure? If yes → Template

**When in doubt**: Start with the smallest classification and move up if needed. It's easier to promote an atom to a molecule than demote a molecule to an atom.

**Quick Reference**:
- All UI components live in `components/` organized by atomic level (atoms/, molecules/, organisms/, templates/)
- See [components/atoms/README.md](../../components/atoms/README.md) for complete atoms documentation and usage examples
- Use design tokens consistently - avoid one-off custom values
- **ALWAYS implement mobile-first responsive design** - see responsive requirements below
- Maintain WCAG 2.1 AA accessibility standards
- Document components with JSDoc and usage examples

## Mobile-First Responsive Design Requirements

**CRITICAL**: All UI components MUST be implemented with mobile-first responsive design. This is not optional.

**Core Principles**:
1. **Start with mobile styles** (no breakpoint prefix) - design for the smallest screen first
2. **Progressively enhance** for larger screens using Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`)
3. **Test at all breakpoints** before considering a component complete
4. **Consider touch targets** on mobile (minimum 44×44px for interactive elements)

**Tailwind Breakpoints**:
```css
/* Default (mobile): 0px and up */
sm:   /* 640px and up (small tablets) */
md:   /* 768px and up (tablets) */
lg:   /* 1024px and up (laptops) */
xl:   /* 1280px and up (desktops) */
2xl:  /* 1536px and up (large desktops) */
```

**Common Responsive Patterns**:

**Text Alignment**:
```tsx
// Center on mobile, left-aligned on desktop
className="text-center sm:text-left"

// Center on mobile, right-aligned on desktop
className="text-center sm:text-right"
```

**Layout**:
```tsx
// Stack vertically on mobile, horizontal on desktop
className="flex flex-col sm:flex-row"

// Full width on mobile, fixed width on desktop
className="w-full sm:w-auto"

// Hide on mobile, show on desktop
className="hidden sm:block"

// Show on mobile, hide on desktop
className="block sm:hidden"
```

**Spacing**:
```tsx
// Smaller padding on mobile, larger on desktop
className="px-4 py-2 sm:px-6 sm:py-4"

// Tighter spacing on mobile, more breathing room on desktop
className="gap-2 sm:gap-4 lg:gap-6"
```

**Typography**:
```tsx
// Smaller text on mobile, larger on desktop
className="text-2xl sm:text-4xl"

// Adjust line height responsively
className="leading-tight sm:leading-normal"
```

**Gradients and Visual Effects**:
```tsx
// Simpler effect on mobile, enhanced on desktop
className="before:w-1/2 sm:before:w-80"

// Centered gradient on mobile, positioned on desktop
className="before:left-0 sm:before:right-0 sm:before:left-auto"
```

**When to Apply Responsive Design**:
- ✅ **Always** for molecules and organisms (they must adapt to different contexts)
- ✅ **Frequently** for atoms when they have layout implications (containers, spacers, complex buttons)
- ⚠️ **Sometimes** for simple atoms (basic text, icons) - use judgment based on usage
- ❌ **Never skip** for page-level components (templates, organisms in layouts)

**Testing Checklist**:
Before marking a component as complete, verify:
- [ ] Renders correctly on mobile (< 640px)
- [ ] Transitions properly at `sm` breakpoint (640px)
- [ ] Looks good on tablets (`md`: 768px)
- [ ] Works well on desktop (`lg`: 1024px+)
- [ ] Touch targets are adequate on mobile (44×44px minimum)
- [ ] Text is readable at all sizes
- [ ] No horizontal scrolling on any breakpoint

## Common Components Reference

This project has specific patterns for frequently-used components. Always use these correctly:

### Icon Component

The `Icon` component wraps Heroicons and uses the **`icon` prop** (not `name`):

```tsx
import { Icon } from '../atoms/Icon'
import { HeartIcon, CheckIcon } from '@heroicons/react/24/outline'

// ✅ Correct
<Icon icon={HeartIcon} size="md" />
<Icon icon={CheckIcon} size="sm" color="primary" />

// ❌ Wrong - don't use name prop
<Icon name="heart" size="md" />
```

**Heroicons Version**: This project uses **Heroicons v2**. Some icons were renamed:
- `ArrowRightOnRectangleIcon` → Use `ArrowRightStartOnRectangleIcon` (for logout/sign-out)
- Check [Heroicons v2 migration guide](https://github.com/tailwindlabs/heroicons/releases/tag/v2.0.0) for other changes

### Button Component

The `Button` component can render as either a button or a link using the **`href` prop**:

```tsx
import { Button } from '../atoms/Button'
import { PlayIcon } from '@heroicons/react/24/outline'

// ✅ Correct - Button as link (renders as Link component)
<Button href="/meditations" variant="primary">View Meditations</Button>

// ✅ Correct - Button with action
<Button onClick={handleClick} variant="primary">Submit</Button>

// ✅ Correct - Button with icon
<Button icon={PlayIcon} variant="primary" aria-label="Play" />

// ❌ Wrong - Don't nest Link inside Button
<Button variant="primary">
  <Link href="/meditations">View Meditations</Link>
</Button>
```

**Props**:
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'text'
  size?: 'sm' | 'md' | 'lg'
  href?: string           // When provided, renders as Link
  locale?: string         // For locale-aware navigation
  icon?: HeroIcon         // Heroicon component
  isLoading?: boolean
  disabled?: boolean
}
```

**Key Features**:
- **Link rendering**: When `href` is provided, Button automatically renders as a Link component internally
- **Locale-aware navigation**: Supports `locale` prop for non-English routes
- **Icon support**: Can render icon-only buttons with proper accessibility
- **Loading states**: Built-in loading state with `isLoading` prop
- **No nested interactive elements**: Using `href` prop avoids semantic HTML issues with nested buttons/links

**When to use href prop**:
- ✅ Navigation to other pages or routes
- ✅ Downloading files or external resources
- ❌ Triggering JavaScript actions (use `onClick` instead)

### Link Component

The `Link` component is locale-aware and located at **`components/atoms/Link/`**:

```tsx
import { Link } from '../../atoms'         // ✅ Preferred: from barrel export
import { Link } from '../../atoms/Link'    // ✅ Alternative: direct import
import { Link } from '../Link'             // ✅ Correct from atoms/

// ❌ Wrong - outdated path
import { Link } from '../../Link'
```

**Props**:
```tsx
interface LinkProps {
  href: string
  locale?: string
  variant?: 'default' | 'primary' | 'secondary' | 'neutral' | 'unstyled'
  size?: 'sm' | 'base' | 'lg' | 'inherit'  // Default: 'inherit'
  external?: boolean
}
```

**Usage**:
```tsx
// Basic usage (inherits parent size)
<Link href="/about" locale="es">About Us</Link>

// With explicit size
<Link href="/contact" size="sm">Contact</Link>

// With variant (avoids custom className)
<Link href="/home" variant="primary">Home</Link>

// External link (opens in new tab)
<Link href="https://example.com" external>External Site</Link>
```

**Key Features**:
- **Locale-aware**: Automatically prefixes non-English locales (`/es/about`, `/fr/contact`)
- **Size inheritance**: Default `size="inherit"` makes links inherit parent font size
- **Variants**: Use built-in variants (`primary`, `secondary`, `neutral`) instead of custom className where possible
- **Accessibility**: External links include screen reader text "(opens in new tab)"

### Divider Patterns

When creating decorative dividers (like LeafDivider or Footer divider), use this pattern:

```tsx
<div className="relative w-full text-center pt-[height]">
  {/* Full-width horizontal line */}
  <div className="w-full border-t border-gray-200 absolute bottom-0" />

  {/* Decorative element centered over the line */}
  <div className="absolute left-1/2 -translate-x-1/2 bottom-0 bg-white px-4">
    <DecorativeElement />
  </div>
</div>
```

This creates the effect where the decorative element sits in the middle of the line with a white background "breaking" the line.

## Refactoring to Use Component Variants

When refactoring existing components, look for opportunities to replace custom `className` styling with built-in component variants for better consistency and maintainability.

**When to Use Variants**:
- ✅ When the styling matches (or is close to) an existing variant
- ✅ When minor color/weight differences are acceptable for consistency
- ✅ When it reduces custom className complexity
- ❌ When the component needs very specific custom styling
- ❌ When the variant doesn't have the required properties

**Refactoring Pattern**:

1. **Identify candidates**: Look for components using Link (or other atoms) with custom className
2. **Match to variant**: Find the closest built-in variant
3. **Extract size to prop**: Use `size` prop instead of `text-*` className
4. **Keep necessary custom styles**: Retain className only for styles not covered by variant
5. **Test visual differences**: Verify minor changes are acceptable

**Example: Breadcrumbs Link**

Before:
```tsx
<Link
  href={item.href}
  className="text-teal-500 hover:text-teal-600 transition-colors no-underline"
>
  {item.label}
</Link>
```

After:
```tsx
<Link
  href={item.href}
  variant="primary"
  size="inherit"
  className="no-underline"
>
  {item.label}
</Link>
```

**Changes**: Slightly darker teal color (500→600) and medium font weight from primary variant. Custom `no-underline` retained.

**Example: Footer Links**

Before:
```tsx
<Link
  className={`text-gray-600 hover:text-teal-600 transition-colors ${
    isHero ? 'text-lg font-normal' : 'text-sm font-light'
  }`}
>
```

After:
```tsx
<Link
  variant="neutral"
  size={isHero ? 'lg' : 'sm'}
  className={`hover:text-teal-600 ${
    isHero ? 'font-normal' : 'font-light'
  }`}
>
```

**Changes**: Base color slightly darker (gray-600→gray-700), size controlled by prop. Custom hover color and font weights retained.

**Benefits**:
- More semantic (intent is clear from props)
- Easier to maintain (fewer inline styles)
- Better consistency across codebase
- Leverages design system tokens

