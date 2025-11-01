# Web Fonts

This directory contains the web fonts used in the WeMeditate project.

## Font Structure

```
fonts/
├── raleway/           # Primary sans-serif font family
│   ├── RalewayExtraLight.woff2    # Weight: 200
│   ├── RalewayExtraLight.woff
│   ├── RalewayLight.woff2         # Weight: 300 (default body text)
│   ├── RalewayLight.woff
│   ├── RalewayRegular.woff2       # Weight: 400
│   ├── RalewayRegular.woff
│   ├── RalewayMedium.woff2        # Weight: 500 (headings)
│   ├── RalewayMedium.woff
│   ├── RalewaySemiBold.woff2      # Weight: 600 (h1 tags)
│   ├── RalewaySemiBold.woff
│   ├── RalewayBold.woff2          # Weight: 700 (emphasis)
│   └── RalewayBold.woff
└── futura-book/       # Secondary font family
    ├── FuturaBook.woff2
    └── FuturaBook.woff
```

## Font Formats

- **WOFF2** (Web Open Font Format 2): Modern, highly compressed format with excellent browser support
- **WOFF** (Web Open Font Format): Fallback for older browsers

## Font Face Declarations

Font faces are declared in `/layouts/fonts.css` with the following properties:

- `font-display: swap` - Shows fallback font immediately, swaps when custom font loads
- WOFF2 format listed first for optimal performance
- WOFF format as fallback

## Usage in Tailwind

Configure in `tailwind.config.ts`:

```typescript
fontFamily: {
  sans: ['Raleway', 'sans-serif'],      // Primary font
  secondary: ['Futura Book', 'sans-serif'], // Secondary font
}

fontWeight: {
  extralight: '200',  // Raleway Extra Light
  light: '300',       // Raleway Light (default)
  normal: '400',      // Raleway Regular
  medium: '500',      // Raleway Medium (headings)
  semibold: '600',    // Raleway Semi Bold (h1)
  bold: '700',        // Raleway Bold
}
```

## CSS Classes

Use Tailwind utility classes:

```html
<!-- Default body text (Raleway Light 300) -->
<p class="text-base">Body text</p>

<!-- Heading (Raleway Medium 500) -->
<h2 class="text-2xl font-medium">Heading</h2>

<!-- Emphasized text (Raleway Semi Bold 600) -->
<h1 class="text-4xl font-semibold">Main Heading</h1>

<!-- Secondary font -->
<p class="font-secondary">Special text in Futura Book</p>
```

## Icons

For icons, this project uses **Heroicons** (https://heroicons.com/), a set of beautiful hand-crafted SVG icons by the makers of Tailwind CSS.

See the [Icon component documentation](../../components/atoms/Icon/) for usage examples.

```tsx
import { HeartIcon } from '@heroicons/react/24/outline'
import { Icon } from '@/components/atoms'

<Icon icon={HeartIcon} size="lg" />
```

## Performance Considerations

1. **Preload Critical Fonts**: Add to `<head>` for fonts used above the fold
2. **Font Display Swap**: Ensures text remains visible during font load
3. **WOFF2 Format**: Provides ~30% better compression than WOFF
4. **Subsetting**: Consider creating font subsets for production to reduce file size

## Browser Support

- **WOFF2**: Chrome 36+, Firefox 39+, Safari 10+, Edge 14+
- **WOFF**: IE 9+, all modern browsers

Fallback to system sans-serif font if custom fonts fail to load.

## Maintenance

When updating fonts:

1. Add new font files to the appropriate directory
2. Update `@font-face` declarations in `/layouts/fonts.css`
3. Update `tailwind.config.ts` if new weights or families are added
4. Test in multiple browsers to ensure proper loading
5. Update this README with any changes
