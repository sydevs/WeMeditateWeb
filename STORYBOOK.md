# Component Storybook with Ladle

This project uses [Ladle](https://ladle.dev/) — a lightweight, Vite-powered alternative to
Storybook — to develop and document components in isolation. It supports Component Story Format
(CSF), Tailwind CSS, React 19, and TypeScript.

Run `pnpm ladle` to start it at [http://localhost:61000/](http://localhost:61000/). Run
`pnpm ladle:build` to build a static copy into `build/`.

**The component library is light-theme only.** [.ladle/config.mjs](.ladle/config.mjs) sets
`theme.enabled: false` and `defaultState: 'light'` — the toolbar has no dark-mode toggle, and
nothing in this library needs one.

## Story utility components

[components/ladle/](components/ladle/) holds the utility components every story must use, so
stories stay structurally consistent.

### StoryWrapper

The required outermost wrapper for every story. It applies `flex flex-col gap-8`.

```tsx
import { StoryWrapper, StorySection } from '../../ladle';

export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Examples">{/* Content */}</StorySection>
  </StoryWrapper>
);
```

Do not add a custom wrapper `div` around it.

### StorySection

One component that replaces the old `StorySection`, `StoryDarkSection`, `StorySubsection`, and
`StoryExampleSection`.

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `title` | `string` (required) | — | Renders as `<h2>` for a section, `<p>` for a subsection |
| `description` | `string` | — | Text below the title |
| `theme` | `'light' \| 'dark'` | `'light'` | `dark` applies `text-white` to the children |
| `background` | `'none' \| 'neutral' \| 'gradient'` | `'none'` | Section background style |
| `variant` | `'section' \| 'subsection' \| 'scrollable'` | `'section'` | `subsection` drops the divider and uses a smaller title. `scrollable` fixes the height at 600px with `overflow-y-auto` |
| `inContext` | `boolean` | `false` | Adds an "In Context – " title prefix and a bold top border, for an Examples section |

Always keep the title and description in light-theme colors (`gray-900`/`gray-600`), even inside
a `theme="dark"` section. They render on the light page background, not inside the dark content
area.

Use `variant="subsection"` to group related content inside one major section. For example: nest
"Minimal" and "Maximal" configurations inside a "Default Variant" section, or "Loading" and
"Disabled" inside a "States" section. Do not use a subsection for a top-level section, for a
single item, or nested inside another subsection.

```tsx
<StorySection title="Default Variant">
  <div className="flex flex-col gap-8">
    <StorySection title="Minimal" variant="subsection">{/* Required props only */}</StorySection>
    <StorySection title="Maximal" variant="subsection">{/* All optional props */}</StorySection>
  </div>
</StorySection>
```

For a side-by-side layout, wrap each subsection in a `min-w-2/5` div inside a
`flex flex-wrap gap-8` container — it wraps to vertical on a small screen.

`StorySubsection` and `StoryExampleSection` are deprecated. Use
`<StorySection variant="subsection">` and `<StorySection inContext={true}>` in their place.

### StoryGrid

Renders a table-style matrix for a multi-dimensional set of variants (for example, color ×
state).

```tsx
import { StoryGrid, StoryGridHeader, StoryGridHeaderRow, StoryGridHeaderCell,
         StoryGridBody, StoryGridRow, StoryGridCell } from '../../ladle';

<StoryGrid>
  <StoryGridHeader>
    <StoryGridHeaderRow>
      <StoryGridHeaderCell />
      <StoryGridHeaderCell>Column 1</StoryGridHeaderCell>
    </StoryGridHeaderRow>
  </StoryGridHeader>
  <StoryGridBody>
    <StoryGridRow>
      <StoryGridCell isLabel>Row Label</StoryGridCell>
      <StoryGridCell>{/* Component */}</StoryGridCell>
    </StoryGridRow>
  </StoryGridBody>
</StoryGrid>
```

`StoryGridHeaderCell` takes `colSpan` and `size` (`'primary' | 'secondary'`).
`StoryGridCell` takes `isLabel`. Below 640px, the grid drops its header and stacks each row
vertically with a bold label, so it stays readable with no horizontal scroll. At 640px and above
it renders as a normal table.

## Writing a story

Name the file `ComponentName.stories.tsx`, alongside the component.

```tsx
import type { Story, StoryDefault } from "@ladle/react";
import { ComponentName } from "./ComponentName";
import { StoryWrapper, StorySection } from '../../ladle';

export default {
  title: "Atoms / Category" // for example "Atoms / Form", "Atoms / Typography"
} satisfies StoryDefault;

/**
 * Brief description of what the component does and what the story shows.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Section Name">{/* Content */}</StorySection>
    <div /> {/* Removes the trailing divider */}
  </StoryWrapper>
);

Default.storyName = "Component Name"
```

**Placeholder content**:
- Use a seeded [picsum.photos](https://picsum.photos) URL for a placeholder image —
  `https://picsum.photos/seed/{name}/{width}/{height}` — so the image stays the same across
  reloads. A bare `picsum.photos/{width}/{height}` URL changes on every reload. Do not use one.
- Give an interactive element a hash `href` (`href="#"`), never a real URL — a real URL navigates
  away from the story.
- Write realistic text ("Start your day with clarity and peace…"), not lorem ipsum or a generic
  placeholder sentence.

## Standard section order

Most components follow this order, and skip any section that does not apply:

Basic Examples/Variants/Input Types → Sizes → Colors → Shapes → component-specific sections →
States → Widths → Padding → Examples

| Category | Typical order |
| --- | --- |
| Form (Button, Checkbox, Input, Select) | Variants/Input Types → Sizes → Colors → States → Widths → Examples |
| Media (Avatar, Image, Icon) | Sizes → Colors → Shapes → States → Examples |
| Typography (Heading, Label) | Sizes → Weights → Colors → Examples |
| Layout (Box, Container, Spacer) | Variants/Sizes → Padding → Shadows → Examples |
| Molecule | One section per major variant, each with Minimal/Maximal subsections → Examples |

Use the standard section names: Variants, Basic Examples, Input Types, Colors, Shapes, States
(combine loading/disabled/error here, not as separate sections), Sizes, Weights, Widths, Padding,
Shadows, Examples. Do not invent a synonym ("Styles", "Color Options", "Rounded Corners") for one
of these.

## Atoms and molecules: one story

Give each atom or molecule a single `Default` story covering every variant, size, and state. Set
`title` to `"[Level] / [Category]"`, and set `Default.storyName` to the component's name. A
simple component fits every variant in one view, so it needs no second story.

## Organisms: one story, sectioned

Prefer one comprehensive story with a section per major variant (each with Minimal/Maximal
subsections), over several separate stories. Reach for a three-level title
(`"Organisms / Navigation / Header"`) and multiple story exports only for fundamentally different
states, like `LoggedOut` vs. `LoggedIn`.

## Reference examples

| Component | Pattern |
| --- | --- |
| [Button](components/atoms/Button/Button.stories.tsx) | A two-axis grid (variant × shape), with subsections for sizes, states, and a 7-part Examples section |
| [Checkbox](components/atoms/form/Checkbox/Checkbox.stories.tsx), [Radio](components/atoms/form/Radio/Radio.stories.tsx) | A clean color × state grid, minimal text |
| [Box](components/atoms/Box/Box.stories.tsx) | A color × decoration grid, plus separate Padding and Shadows sections |
| [SocialIcon](components/atoms/graphics/SocialIcon/SocialIcon.stories.tsx) | A generated 10×4 grid (platform × color) |
| [Typography](components/atoms/Typography.stories.tsx) | A documentation-only story with no component — shows when *not* to wrap Tailwind classes in a component |
| [Spacer](components/atoms/Spacer/Spacer.stories.tsx) | Heavy subsection use — 6 subsections across Sizes and Examples |
| [Author](components/molecules/Author/Author.stories.tsx) | A molecule pattern: one section per variant (Mini, Hero), each with Minimal/Maximal subsections, no grid |

## Configuration

[.ladle/config.mjs](.ladle/config.mjs) sets the story glob, port 61000, the title, and disables
the theme toggle (see above). [.ladle/vite.config.ts](.ladle/vite.config.ts) adds the Tailwind
Vite plugin, so Tailwind classes resolve inside Ladle the same way they do in the app.

## Toolbar features

Hot module replacement applies instantly to a component or story edit. The toolbar also offers a
mobile-width preview, a viewport-width slider, and a source-code view for the current story.

## Troubleshooting

- **A story does not appear**: check the file matches `*.stories.{ts,tsx}`, uses a named export,
  and sits under `components/`.
- **Tailwind classes do not apply**: check `.ladle/vite.config.ts` includes the Tailwind
  plugin, and that the class name is a real Tailwind utility.
- **Port 61000 is in use**: change `port` in `.ladle/config.mjs`.

## Learn more

- [Ladle Documentation](https://ladle.dev/docs)
- [Component Story Format (CSF)](https://ladle.dev/docs/stories)
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
