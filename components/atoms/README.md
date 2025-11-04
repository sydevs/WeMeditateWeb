# Atoms

Foundational UI elements that form the basic building blocks of the WeMeditate design system. Atoms are the smallest functional components that cannot be broken down further without losing their meaning.

## Overview

This directory contains 19 atomic components organized into 7 categories:

### Typography (2)
- **Heading** - Semantic headings (h1-h6) with consistent visual hierarchy
- **Label** - Form labels with required field indicators

> **Note**: Typography patterns (text sizing, weights, colors) are documented in [Typography.stories.tsx](./Typography.stories.tsx). Use Tailwind utilities directly rather than wrapping text in a component.

### Interactive (1)
- **Button** - Unified button component supporting text, icon-only, and icon+text combinations with multiple variants (primary, secondary, outline, ghost)

### Form Inputs (5)
- **Input** - Text inputs with validation states
- **Textarea** - Multi-line text inputs with auto-resize option
- **Checkbox** - Styled checkbox with optional label
- **Radio** - Radio button with optional label
- **Select** - Dropdown select with custom styling

### Media (3)
- **Image** - Responsive images with aspect ratios and loading states
- **Icon** - Icon wrapper for Heroicons SVG icons with size/color variants
- **Avatar** - Circular/rounded profile images with fallback initials

### Feedback (3)
- **Spinner** - Loading indicator
- **Duration** - Time display (e.g., "10 min")
- **Badge** - Labels, counts, and status indicators with color and shape variants

### Layout (3)
- **Container** - Content width containers with responsive padding
- **Spacer** - Vertical/horizontal spacing utility
- **Box** - Generic container with padding/background/border options

### Specialty (2)
- **LanguageFlag** - Country flag icons for language selection
- **SocialIcon** - Branded social media icons

## Usage

Import atoms from the barrel export:

```tsx
import { Button, Heading, Input, Image } from '@/components/atoms'

function MyComponent() {
  return (
    <div>
      <Heading level="h1">Welcome</Heading>
      <Input placeholder="Enter your name" />
      <Button variant="primary">Submit</Button>
    </div>
  )
}
```

Or import individually:

```tsx
import { Button } from '@/components/atoms/Button'
import { Heading } from '@/components/atoms/Heading'
```

## Design Principles

All atoms follow these principles:

1. **Single Responsibility** - Each component does one thing well
2. **Composability** - Can be combined to build larger components
3. **Accessibility** - WCAG 2.1 AA compliant with proper ARIA attributes
4. **Type Safety** - Full TypeScript support with comprehensive prop types
5. **Tailwind First** - Built entirely with Tailwind utility classes
6. **Mobile First** - Responsive by default

## Component Guidelines

### Props Design
- Extend native HTML element props when appropriate
- Use discriminated unions for mutually exclusive props
- Provide sensible defaults for all optional props
- Use descriptive prop names (e.g., `isLoading`, `hasError`)

### Styling
- Use Tailwind utility classes directly
- Follow design tokens from `tailwind.config.ts`
- Support `className` prop for customization
- Include focus states for keyboard navigation

### Accessibility
- Semantic HTML elements
- ARIA attributes where needed
- Keyboard navigation support
- Screen reader friendly labels

## Examples

### Button
```tsx
import { PlayIcon, CheckIcon } from '@heroicons/react/24/outline'

// Text button
<Button variant="primary" size="lg" onClick={handleClick}>
  Click me
</Button>

// Icon-only button (circular - default)
<Button icon={PlayIcon} aria-label="Play" />

// Icon-only button (square)
<Button icon={PlayIcon} shape="square" aria-label="Play" />

// Icon + text button
<Button icon={CheckIcon} variant="primary">Save</Button>

// Loading state
<Button isLoading>Saving...</Button>

// Ghost variant (replaces text variant)
<Button variant="ghost" size="sm">Cancel</Button>
```

### Heading
```tsx
<Heading level="h1">Page Title</Heading>
<Heading level="h2" styleAs="h1">Visually large h2</Heading>
<Heading level="h3" className="text-teal-600">Custom color</Heading>
```

### Input
```tsx
<Input type="email" placeholder="Enter email" />
<Input state="error" />
<Input state="success" fullWidth />
```

### Image
```tsx
<Image src="/photo.jpg" alt="Description" />
<Image src="/banner.jpg" alt="Banner" aspectRatio="16/9" />
<Image src="/profile.jpg" alt="Profile" aspectRatio="square" />
```

### Container
```tsx
<Container>
  Default content width
</Container>

<Container maxWidth="lg">
  Narrower content
</Container>

<Container maxWidth="full" padding={false}>
  Full width, no padding
</Container>
```

### Duration
```tsx
<Duration minutes={10} />
<Duration seconds={900} format="long" />
<Duration minutes={15} variant="badge" />
```

### Icon
```tsx
import { HeartIcon, StarIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'

<Icon icon={HeartIcon} size="lg" />
<Icon icon={StarIcon} color="primary" />
<Icon icon={HeartIconSolid} color="secondary" />
```

### SocialIcon
```tsx
<SocialIcon platform="instagram" href="https://instagram.com/wemeditate" />
<SocialIcon platform="facebook" href="https://facebook.com/wemeditate" size="lg" />
```

## Related Documentation

- [Design System Guide](../../DESIGN_SYSTEM.md) - Complete design system documentation
- [Tailwind Config](../../tailwind.config.ts) - Brand colors and typography tokens
- [Project Overview](../../CLAUDE.md) - Architecture and development guide

## Contributing

When adding new atoms:

1. Follow the component template in `DESIGN_SYSTEM.md`
2. Create component directory with `Component.tsx` and `index.ts`
3. Add comprehensive JSDoc comments
4. Export from `atoms/index.ts`
5. Add usage examples to this README
6. Test across breakpoints and accessibility
