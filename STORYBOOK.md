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

### 1. Create Stories for All Component Variants

Show every possible variant/combination of props:

```tsx
export const AllVariants: Story = () => (
  <div className="flex flex-col gap-4">
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="text">Text</Button>
  </div>
);
```

### 2. Show Component States

Demonstrate loading, disabled, error states:

```tsx
export const States: Story = () => (
  <div className="flex flex-col gap-4">
    <Input state="default" placeholder="Default" />
    <Input state="error" placeholder="Error" />
    <Input state="success" placeholder="Success" />
  </div>
);
```

### 3. Include Realistic Context

Show how components work together:

```tsx
export const InContext: Story = () => (
  <form className="max-w-md">
    <Heading level="h2" className="mb-4">Login</Heading>
    <Input type="email" placeholder="Email" fullWidth className="mb-4" />
    <Input type="password" placeholder="Password" fullWidth className="mb-4" />
    <Button variant="primary" fullWidth>Sign In</Button>
  </form>
);
```

### 4. Use TypeScript

Leverage TypeScript for type-safe stories:

```tsx
import type { Story } from "@ladle/react";
import { Button, ButtonProps } from "./Button";

export const Primary: Story<ButtonProps> = () => (
  <Button variant="primary">Primary</Button>
);
```

### 5. Add Explanatory Text

Help developers understand what they're seeing:

```tsx
export const ResponsiveDemo: Story = () => (
  <div>
    <p className="text-sm text-gray-600 mb-4">
      Resize browser window to see responsive text sizing
    </p>
    <Heading level="h1">This heading scales with screen size</Heading>
  </div>
);
```

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
