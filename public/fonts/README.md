# Web Fonts

This directory holds the web fonts for the WeMeditate project.

## Directory map

```
fonts/
├── raleway/           # Primary font family
│   ├── RalewayExtraLight.woff2/.woff   # Weight 200
│   ├── RalewayLight.woff2/.woff        # Weight 300 (default body text)
│   ├── RalewayRegular.woff2/.woff      # Weight 400
│   ├── RalewayMedium.woff2/.woff       # Weight 500 (headings)
│   ├── RalewaySemiBold.woff2/.woff     # Weight 600 (h1)
│   └── RalewayBold.woff2/.woff         # Weight 700 (emphasis)
└── futura-book/       # Secondary font family
    └── FuturaBook.woff2/.woff
```

Each weight ships as WOFF2 (primary, better compression) and WOFF (fallback for older browsers).

## Where fonts load

[layouts/fonts.css](../../layouts/fonts.css) declares every `@font-face` rule, each with
`font-display: swap`. The browser shows a fallback font immediately, then shows the real font
once it loads. The page never blocks on a font download.

[tailwind.config.ts](../../tailwind.config.ts) maps these fonts to Tailwind's `fontFamily` and
`fontWeight` tokens. See [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md) for the full token list and
usage examples.

## Update the fonts

1. Add the new font files to the matching directory here.
2. Add or update the `@font-face` rule in `layouts/fonts.css`.
3. Update `tailwind.config.ts` if you add a new weight or family.
4. Test the change in Chrome, Firefox, and Safari.
