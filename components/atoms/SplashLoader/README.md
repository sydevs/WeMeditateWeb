# SplashLoader

Overlays the entire containing element with a blended background image and color, centered on an
animated logo with optional text. It fades out automatically when loading finishes.

Covers the parent container with absolute positioning, and scales the logo and text for the
viewport.

## Usage

```tsx
import { SplashLoader } from '..'

<div className="relative h-screen">
  <SplashLoader
    size="lg"
    color="primary"
    backgroundImage="/images/splash-bg.jpg"
    text="Preparing your meditation journey…"
    isLoading={isLoading}
  />
</div>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Sets the logo and text scale. |
| `color` | `'primary' \| 'secondary' \| 'neutral' \| 'none'` | `'primary'` | Background color, blended with `backgroundImage` in multiply mode. `none` shows no color overlay. |
| `backgroundImage` | `string` | — | URL of a background image, blended with `color`. |
| `isLoading` | `boolean` | `true` | Set to `false` to start the fade-out. The component unmounts once the transition ends. |
| `text` | `string` | — | Optional text below the logo. Renders in white, centered. |

## Important notes

- **The parent element needs a positioning context.** Give it `relative`, `absolute`, or `fixed`,
  or the overlay positions against the nearest positioned ancestor instead.
- **Blend mode**: `mix-blend-multiply` combines the image and color into a darkened, tinted
  effect. It works best with a light-to-medium image, paired with a dark color variant (teal-900,
  coral-900, gray-900).
- **Loading state**: when `isLoading` becomes `false`, the component fades out, then unmounts
  after 500ms. You do not need to remove it from the DOM yourself.

## Size recommendations

| Size | Use for |
| --- | --- |
| `sm` | Cards, thumbnails, small modals (under 400px tall) |
| `md` | Most content areas, medium modals (400–600px tall) — the default |
| `lg` | Full-page splashes, hero sections, large modals (over 600px tall) |

## Accessibility

The animated logo inherits `currentColor`, and defaults to white for visibility. The component
needs no ARIA attributes — it is a visual loading indicator that removes itself once loading
completes.

## Related components

- [AnimatedLogoSvg](../graphics/svgs/AnimatedLogoSvg.tsx) — the animated logo this component uses
- [Spinner](../Spinner) — an alternative loading indicator for inline contexts
