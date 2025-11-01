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

## Writing Stories

Stories are written using the Component Story Format (CSF) and placed alongside your components.

### File Naming Convention

Story files should be named `ComponentName.stories.tsx` and placed in the same directory as the component:

```
components/atoms/Button/
├── Button.tsx          # Component implementation
├── Button.stories.tsx  # Component stories
└── index.ts           # Exports
```

### Basic Story Example

```tsx
import type { Story } from "@ladle/react";
import { Button, ButtonProps } from "./Button";

// Simple story - default export name becomes the story name
export const Primary: Story<ButtonProps> = () => (
  <Button variant="primary">Primary Button</Button>
);

export const Secondary: Story<ButtonProps> = () => (
  <Button variant="secondary">Secondary Button</Button>
);
```

### Story with Multiple Examples

```tsx
export const AllSizes: Story = () => (
  <div className="flex flex-col gap-4">
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button size="lg">Large</Button>
  </div>
);
```

### Story Naming

- Export names are converted to story titles (e.g., `AllSizes` becomes "All Sizes")
- Use descriptive names that explain what the story demonstrates
- Common patterns:
  - `Default` - The default/most common usage
  - `Variants` - Show all visual variants
  - `States` - Show different states (loading, disabled, etc.)
  - `Sizes` - Show different size options
  - `InContext` - Show component in a realistic context

## Configuration

Ladle configuration is in [.ladle/config.mjs](.ladle/config.mjs):

```js
export default {
  // Where to find stories
  stories: "components/**/*.stories.{js,jsx,ts,tsx}",

  // Dev server port
  port: 61000,

  // Component library title
  title: "WeMeditate Component Library",

  // Custom Vite config
  viteConfig: ".ladle/vite.config.ts",
};
```

### Tailwind CSS Support

Ladle is configured to use Tailwind CSS via a custom Vite config at [.ladle/vite.config.ts](.ladle/vite.config.ts):

```ts
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

This ensures all your Tailwind classes work correctly in stories.

## Existing Stories

The following components already have stories:

- **[Button](components/atoms/Button/Button.stories.tsx)** - All variants, sizes, states
- **[Text](components/atoms/Text/Text.stories.tsx)** - Sizes, weights, colors, elements
- **[Heading](components/atoms/Heading/Heading.stories.tsx)** - All heading levels, semantic vs visual
- **[Input](components/atoms/Input/Input.stories.tsx)** - Types, states, validation

## Best Practices

### Story Organization by Component Type

**See [DESIGN_SYSTEM.md - Writing Component Stories](DESIGN_SYSTEM.md#writing-component-stories) for comprehensive guidelines.**

Quick reference:

- **Atoms**: 1-3 stories (Default, States, InContext)
- **Molecules**: 2-4 stories (Default, States, InContext, Playground)
- **Organisms**: 3-5 stories (Default, variants, InContext)

### 1. Consolidate Atom Variants

For atoms, combine related variants into organized sections within a single story:

```tsx
/**
 * Button component showcasing all variants and sizes.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Variants</h3>
      <div className="flex gap-4 flex-wrap items-center">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="text">Text</Button>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Sizes</h3>
      <div className="flex gap-4 flex-wrap items-center">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Variant × Size</h3>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">Primary</p>
          <div className="flex gap-3 items-center">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>
        </div>
        {/* More combinations... */}
      </div>
    </div>
  </div>
);
```

### 2. Separate States Story (Optional)

Create a dedicated `States` story for interactive/validation states:

```tsx
/**
 * Button states including loading, disabled, and full-width variants.
 */
export const States: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Loading State</h3>
      <div className="flex gap-4 flex-wrap">
        <Button variant="primary" isLoading>Loading</Button>
        <Button variant="secondary" isLoading>Loading</Button>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Disabled State</h3>
      <div className="flex gap-4 flex-wrap">
        <Button variant="primary" disabled>Disabled</Button>
        <Button variant="secondary" disabled>Disabled</Button>
      </div>
    </div>
  </div>
);
```

### 3. InContext Stories for Realistic Usage

Show components in real-world scenarios:

```tsx
/**
 * Heading component shown in realistic article context.
 */
export const InContext: Story = () => (
  <article className="max-w-2xl">
    <Heading level="h1" className="mb-4">Guide to Meditation</Heading>
    <p className="text-gray-700 mb-6">
      Meditation is a practice of focused attention...
    </p>

    <Heading level="h2" className="mb-3">Getting Started</Heading>
    <p className="text-gray-700 mb-6">
      Begin with just a few minutes each day...
    </p>

    <Heading level="h3" className="mb-2">Finding a Quiet Space</Heading>
    <p className="text-gray-700 mb-6">
      Choose a comfortable location...
    </p>
  </article>
);
```

### 4. Use TypeScript and JSDoc

Always include types and documentation:

```tsx
import type { Story } from "@ladle/react";
import { Button } from "./Button";

/**
 * Button component showcasing all variants and sizes.
 * Buttons are used for user actions and come in multiple visual styles.
 */
export const Default: Story = () => (
  // ...
);
```

### 5. Organize with Semantic HTML

Use headings, labels, and clear structure:

```tsx
<div className="flex flex-col gap-8">
  {/* Use h3 for section titles */}
  <div>
    <h3 className="text-lg font-semibold mb-4 text-gray-900">Section Title</h3>
    {/* Content */}
  </div>

  {/* Use descriptive labels for subsections */}
  <div>
    <p className="text-sm text-gray-600 mb-1">Descriptive label</p>
    {/* Component */}
  </div>
</div>
```

### What NOT to Do

- ❌ Don't create separate stories for each minor variant
- ❌ Don't duplicate content across multiple stories
- ❌ Don't create `Responsive` stories (components should be responsive by default)
- ❌ Don't create `Accessibility` stories (components should be accessible by default)
- ❌ Don't use names like `AllVariants`, `Demo`, `Example` (use `Default`, `States`, `InContext`)

## Component Development Workflow

1. **Create Component**: Write your component in TypeScript with proper types
2. **Write Stories**: Create a `.stories.tsx` file with examples of all variants
3. **Start Ladle**: Run `pnpm ladle` to see your component in isolation
4. **Iterate**: Make changes and see instant updates via HMR
5. **Document**: Use stories as living documentation for other developers

## Ladle Features

### Hot Module Replacement

Ladle supports instant HMR - changes to components or stories update immediately without page reload.

### Dark Mode Toggle

Ladle includes a built-in dark mode toggle in the toolbar (top-right).

### Mobile View

Use the mobile view toggle to see how components look on smaller screens.

### Width Control

Adjust the viewport width using the width slider in the toolbar.

### Story Source

View the source code of any story by clicking the code icon.

## Differences from Storybook

If you're familiar with Storybook:

- **No addons ecosystem** - Ladle is intentionally minimal
- **No docs addon** - Stories ARE the documentation
- **Simpler configuration** - Just one config file
- **Faster builds** - Vite-powered, no webpack
- **Smaller bundle** - Significantly lighter than Storybook

## Deployment (Optional)

While Ladle is primarily a development tool, you can deploy the static build:

1. Build static Ladle: `pnpm ladle:build`
2. Deploy the `build/` directory to any static host (Cloudflare Pages, Netlify, Vercel, etc.)

This creates a browsable component library for designers, stakeholders, and other teams.

## Troubleshooting

### Stories not appearing

- Check that your story file matches the pattern: `*.stories.{ts,tsx}`
- Ensure stories are exported as named exports
- Verify the file is in the `components/` directory

### Tailwind classes not working

- Ensure [.ladle/vite.config.ts](.ladle/vite.config.ts) includes the Tailwind plugin
- Check that your component uses standard Tailwind classes

### Port already in use

Change the port in [.ladle/config.mjs](.ladle/config.mjs):

```js
export default {
  port: 62000, // Use a different port
  // ...
};
```

## Learn More

- [Ladle Documentation](https://ladle.dev/docs)
- [Component Story Format (CSF)](https://ladle.dev/docs/stories)
- [Ladle Configuration](https://ladle.dev/docs/config)

## Next Steps

Continue building out stories for the remaining atoms:

- [ ] Avatar
- [ ] Box
- [ ] Checkbox
- [ ] Container
- [ ] Duration
- [ ] Icon
- [ ] IconButton
- [ ] Image
- [ ] Label
- [ ] LanguageFlag
- [ ] Radio
- [ ] Select
- [ ] SocialIcon
- [ ] Spacer
- [ ] Spinner
- [ ] Textarea

Then move on to molecules and organisms as they're developed!
