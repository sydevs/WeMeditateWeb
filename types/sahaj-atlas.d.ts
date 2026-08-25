/**
 * The `<sahaj-atlas>` custom element.
 *
 * Declared so the atlas pages can server-render their content **as children of
 * this element**, which is the whole architecture of the `/map` routes: the
 * loader adopts an existing `<sahaj-atlas>` on the page (marking it claimed)
 * rather than inserting its own, and React's `createRoot` then replaces the
 * children when the widget mounts. So a crawler, a social scraper and a no-JS
 * visitor read the server-rendered content in the real document, and a visitor
 * with JavaScript gets the interactive atlas in the same place.
 *
 * The tag name is a published contract in SahajAtlasWeb's `docs/embedding.md`;
 * it takes no attributes any more — every setting rides on the loader's script
 * URL instead.
 */

import type React from 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'sahaj-atlas': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}

export {}
