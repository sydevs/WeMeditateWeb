// https://vike.dev/Head

//# BATI.has("mantine")
import logoUrl from '../assets/logo.svg'
import { useOptionalPageContext } from '../hooks/useT'

export default function HeadDefault() {
  // ⚠ **The analytics script is omitted entirely under a live preview**, and
  // this is what keeps the token out of Plausible — not the address-bar scrub,
  // which cannot win the race.
  //
  // Measured on the deployed preview: this `defer` tag is the FIRST script in
  // the document, so it executes the moment parsing ends. Vike's client entry
  // is `<script type="module" async>` at the end of `<body>`, and its body is
  // a dynamic `import()` of a hashed chunk — so `pages/+client.ts` cannot
  // evaluate until that chunk has been fetched, strictly after Plausible has
  // already read and posted `location.href`.
  //
  // Not emitting the tag is also correct on its own terms: an editor in the
  // CMS admin's preview iframe is not a visitor, and their draft URL is not a
  // pageview anyone wants counted.
  const livePreview = useOptionalPageContext()?.livePreview

  return (
    <>
      <link rel="preconnect" href="https://assets.sydevelopers.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://cloud.sydevelopers.com" />
      <link rel="icon" href={logoUrl} />

      {/* See https://plausible.io/docs/plausible-script */}
      {/* TODO: update data-domain */}
      {!livePreview?.active && (
        <script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
      )}
    </>
  )
}
