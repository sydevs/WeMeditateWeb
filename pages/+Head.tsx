// https://vike.dev/Head

//# BATI.has("mantine")
import logoUrl from '@/assets/logo.svg'
import { useLocale, useOptionalPageContext, useOrigin } from '@/hooks/usePageContext'
import { isCanonicalOrigin } from '@/server/routes/sitemap.xml/sitemap'
import { APP_ICON, THEME_COLOR } from '@/lib/seo/site-identity'
import { localeHref } from '@/lib/urls/urls'

export default function HeadDefault() {
  // ⚠ **The analytics script is omitted entirely under a live preview**, and
  // this is what keeps the token out of Fathom — not the `location.href`
  // scrub, which cannot win the race.
  //
  // Measured on the deployed preview: this `defer` tag is the FIRST script in
  // the document, so it executes the moment parsing ends. Vike's client entry
  // is `<script type="module" async>` at the end of `<body>`, and its body is
  // a dynamic `import()` of a hashed chunk — so `pages/+client.ts` cannot
  // evaluate until that chunk has been fetched, strictly after Fathom has
  // already read and posted `location.href`.
  //
  // Not emitting the tag is also correct on its own terms: an editor in the
  // SahajCloud admin's preview iframe is not a visitor, and their draft URL is not a
  // pageview anyone wants counted.
  const livePreview = useOptionalPageContext()?.livePreview

  // A preview Worker and the dev server render the same documents as
  // production, so only the host tells a real pageview from one of ours —
  // the same answer `/robots.txt` and `/sitemap.xml` already give.
  const origin = useOrigin()
  const locale = useLocale()

  return (
    <>
      <link crossOrigin="anonymous" href="https://assets.sydevelopers.com" rel="preconnect" />
      <link href="https://cloud.sydevelopers.com" rel="preconnect" />
      <link href={logoUrl} rel="icon" />
      {/* The home-screen icon and the manifest. The manifest is a route, not
          a file in `public/`, because both builds ship `public/` and the
          Ladle playground is not this app. */}
      <link href={APP_ICON} rel="apple-touch-icon" />
      <link href={localeHref(locale, '/manifest.webmanifest')} rel="manifest" />
      <meta content={THEME_COLOR} name="theme-color" />

      {/* Vike's client routing swaps the page with no document load, and a
          document load is all Fathom counts by default. */}
      {!livePreview?.active && origin !== null && isCanonicalOrigin(origin) && (
        <script
          defer
          data-site="PFPCDAMQ"
          data-spa="auto"
          src="https://cdn.usefathom.com/script.js"
        />
      )}
    </>
  )
}
