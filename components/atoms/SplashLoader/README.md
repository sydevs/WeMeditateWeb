# SplashLoader

Overlays the entire containing element with a blended background image and color, featuring a centered animated logo with optional text. Automatically fades out when loading completes.

## Features

- **Full overlay**: Covers entire parent container using absolute positioning
- **Blend modes**: Combines background image with color using CSS `multiply` blend mode
- **Color variants**: Primary (teal), Secondary (coral), Neutral (gray), or None
- **Optional text**: Display loading messages or status text below the logo
- **Smooth transitions**: Fades out with 500ms transition when loading completes
- **Responsive sizing**: Logo and text scale for different viewport sizes
- **Auto-unmount**: Component removes itself from DOM after fade-out completes

## Usage

```tsx
import { SplashLoader } from '@/components/atoms'

// Basic usage with default size (medium)
<div className="relative h-screen">
  <SplashLoader color="primary" isLoading={isLoading} />
</div>

// Small size for cards or smaller containers
<div className="relative h-64">
  <SplashLoader
    size="sm"
    color="primary"
    text="Loading..."
    isLoading={isLoading}
  />
</div>

// Large size for full-page splashes
<div className="relative h-screen">
  <SplashLoader
    size="lg"
    color="primary"
    text="Loading your meditation..."
    isLoading={isLoading}
  />
</div>

// With background image and text
<div className="relative h-screen">
  <SplashLoader
    size="md"
    color="secondary"
    backgroundImage="/images/splash-bg.jpg"
    text="Please wait while we prepare your experience"
    isLoading={isLoading}
  />
</div>

// Transparent overlay on custom background
<div className="relative h-96 bg-gradient-to-br from-teal-100 to-coral-100">
  <SplashLoader size="sm" color="none" text="Loading..." isLoading={isLoading} />
</div>
```

## Props

### size
- Type: `'sm' | 'md' | 'lg'`
- Default: `'md'`
- Description: Size variant for the logo and text
  - `sm`: Small - 16/20/24 units (mobile/tablet/desktop), text sm/base/lg
  - `md`: Medium - 20/24/28 units (mobile/tablet/desktop), text base/lg/xl
  - `lg`: Large - 24/32/40 units (mobile/tablet/desktop), text lg/xl/2xl

### color
- Type: `'primary' | 'secondary' | 'neutral' | 'none'`
- Default: `'primary'`
- Description: Background color that blends with image using multiply mode
  - `primary`: Dark teal (`bg-teal-900`)
  - `secondary`: Dark coral (`bg-coral-900`)
  - `neutral`: Dark gray (`bg-gray-900`)
  - `none`: No color overlay (transparent)

### backgroundImage
- Type: `string`
- Optional
- Description: URL of background image to display. Blended with color using multiply mode.

### isLoading
- Type: `boolean`
- Default: `true`
- Description: Controls loading state. When set to `false`, triggers fade-out animation and unmounts component after transition completes.

### text
- Type: `string`
- Optional
- Description: Optional text to display below the animated logo. Responsive sizing (base/lg/xl) and centered. White color for visibility on dark overlays.

## Important Notes

### Parent Container
The parent element **must** have positioning context (`relative`, `absolute`, or `fixed`) for the overlay to work correctly:

```tsx
// ✅ Correct
<div className="relative">
  <SplashLoader />
</div>

// ❌ Wrong - overlay will position relative to nearest positioned ancestor
<div>
  <SplashLoader />
</div>
```

### Blend Mode
The background image and color are combined using CSS `mix-blend-multiply`, creating a darkened, tinted effect. This works best with:
- Light to medium-toned images
- Images with good contrast
- Dark color variants (teal-900, coral-900, gray-900)

### Loading State Management
The component handles unmounting automatically:
1. When `isLoading` changes to `false`, fade-out begins
2. After 500ms (transition duration), component unmounts
3. No need to manually remove from DOM

```tsx
const [isLoading, setIsLoading] = useState(true)

// Trigger fade-out and auto-unmount
setIsLoading(false)
```

## Examples

### Full-Page Splash (Large Size)
Use `size="lg"` for full-screen loading experiences:
```tsx
<div className="relative h-screen">
  <SplashLoader
    size="lg"
    color="primary"
    backgroundImage="/splash/hero.jpg"
    text="Preparing your meditation journey..."
    isLoading={isAppLoading}
  />
  <main>
    {/* App content */}
  </main>
</div>
```

### Card Loading State (Small Size)
Use `size="sm"` for smaller containers like cards:
```tsx
<div className="relative rounded-lg shadow-md overflow-hidden">
  <img src={cardImage} alt="Card" />
  <div className="p-6">
    <h3>Card Title</h3>
    <p>Card content...</p>
  </div>
  <SplashLoader size="sm" color="secondary" text="Loading..." isLoading={isCardLoading} />
</div>
```

### Video Player Loading (Medium Size)
Use `size="md"` (default) for medium-sized content areas:
```tsx
<div className="relative aspect-video bg-black rounded-lg overflow-hidden">
  <SplashLoader
    size="md"
    color="neutral"
    backgroundImage={videoThumbnail}
    text="Buffering video..."
    isLoading={isVideoLoading}
  />
  <video ref={videoRef} />
</div>
```

### Size Recommendations
- **Small (`sm`)**: Cards, thumbnails, small modals (< 400px height)
- **Medium (`md`)**: Default for most use cases, medium modals, content areas (400-600px height)
- **Large (`lg`)**: Full-page splashes, hero sections, large modals (> 600px height)

## Accessibility

- The animated logo inherits `currentColor`, defaulting to white for visibility
- No ARIA attributes needed as this is a visual loading indicator
- Component removes itself when loading completes, ensuring no DOM pollution

## Related Components

- [AnimatedLogoSvg](../svgs/AnimatedLogoSvg.tsx) - The animated logo used in this component
- [Spinner](../Spinner) - Alternative loading indicator for inline contexts
