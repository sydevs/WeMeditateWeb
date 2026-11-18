// https://vike.dev/Head

//# BATI.has("mantine")
import logoUrl from '../assets/logo.svg'
import { useOptionalPageContext, useOrigin } from '../hooks/usePageContext'
import { isIndexableHost } from '../server/sitemap'

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
  // production, so only the host tells a real pageview from one of ours.
  // Reusing `/robots.txt`'s own answer stops analytics and indexing
  // disagreeing about which host counts.
  const origin = useOrigin()
  const isRealSite = origin !== null && isIndexableHost(new URL(origin).hostname)

  return (
    <>
      <link rel="preconnect" href="https://assets.sydevelopers.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://cloud.sydevelopers.com" />
      <link rel="icon" href={logoUrl} />

      {/* `data-spa="auto"` is load-bearing: Fathom counts one pageview per
          document load, and Vike's client routing swaps the page without one. */}
      {!livePreview?.active && isRealSite && (
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
