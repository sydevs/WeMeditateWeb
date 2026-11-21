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
| `color` | `'primary' \| 'secondary' \| 'neutral' \| 'warm' \| 'none'` | `'primary'` | Background color, blended with `backgroundImage` in multiply mode. `warm` is the light warm background, for a light image, and draws the logo dark. `none` shows no color overlay. |
| `backgroundImage` | `string` | — | URL of a background image, blended with `color`. |
| `isLoading` | `boolean` | `true` | Set to `false` to start the fade-out. The component unmounts once the transition ends. |
| `autoExit` | `boolean` | `false` | Fades the overlay out in CSS three seconds after it paints, whatever `isLoading` says. Set it on a loader the server renders: without JavaScript nothing else ends it. |
| `text` | `string` | — | Optional text below the logo, centered, in the surface's `text-fg`: white over the dark colors, gray over `warm`. |

## Important notes

- **The parent element needs a positioning context.** Give it `relative`, `absolute`, or `fixed`,
  or the overlay positions against the nearest positioned ancestor instead.
- **Blend mode**: `mix-blend-multiply` combines the image and color into a darkened, tinted
  effect. It works best with a light-to-medium image, paired with a dark color variant (teal-900,
  coral-900, gray-900). The root isolates the blend, so the tint never reaches what lies behind.
- **Loading state**: when `isLoading` becomes `false`, the component fades out, then unmounts
  after 500ms. You do not need to remove it from the DOM yourself.

## Size recommendations

| Size | Use for |
| --- | --- |
| `sm` | Cards, thumbnails, small modals (under 400px tall) |
| `md` | Most content areas, medium modals (400–600px tall) — the default |
| `lg` | Full-page splashes, hero sections, large modals (over 600px tall) |

## Accessibility

The animated logo draws in the surface's `text-fg`: white over the dark colors, gray over `warm`.

A loader laid over content that is already on the page is decoration, and owes a visitor a way
out of it — see `Splash`'s `loader` for the worked one.

## Related components

- [AnimatedLogoSvg](../graphics/svgs/AnimatedLogoSvg.tsx) — the animated logo this component uses
- [Spinner](../Spinner) — an alternative loading indicator for inline contexts
