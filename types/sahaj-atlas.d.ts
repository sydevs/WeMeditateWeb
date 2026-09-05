/**
 * The `<sahaj-atlas>` custom element.
 *
 * Declared so the atlas pages can server-render their content as children of
 * this element. That is the whole architecture of the `/map` routes. The
 * loader adopts an existing `<sahaj-atlas>` on the page. It marks the
 * element claimed and does not insert its own. React's `createRoot` then
 * replaces the children when the widget mounts. A crawler, a social
 * scraper, and a no-JS visitor all read the server-rendered content in the
 * real document. A visitor with JavaScript gets the interactive atlas in
 * the same place.
 *
 * The tag name is a published contract in SahajAtlasWeb's `docs/embedding.md`.
 * It takes no attributes. Every setting rides on the loader's script URL
 * instead.
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
