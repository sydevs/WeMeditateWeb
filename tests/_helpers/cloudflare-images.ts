/**
 * The one spelling of a SahajCloud image URL that component specs assert on.
 *
 * SahajCloud builds every image URL with a `public` variant segment already on
 * it (sydevs/SahajCloud `src/plugins/storage/cloudflareImagesAdapter.ts`), so a
 * fixture without that segment tests a shape no read produces — which is how
 * #141 kept the whole responsive-image pipeline green while it was dead
 * (`docs/rules/testing.md`).
 *
 * `CF_PUBLIC_URL` derives from `CF_BASE`, so the two cannot drift: a spec
 * asserting `${CF_BASE}/width=200` is asserting about the URL it passed in.
 *
 * `lib/cloudflare-images.test.ts` and `components/atoms/Image/Image.test.tsx`
 * keep their own copies on purpose — a spec for the resolver must not take its
 * input from a helper the resolver's own callers share.
 */

/** A Cloudflare Images URL with no variant segment. */
export const CF_BASE = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123'

/** The same image as SahajCloud sends it. */
export const CF_PUBLIC_URL = `${CF_BASE}/public`

/**
 * Sources the pipeline must hand through untouched. A bundled asset, a story
 * placeholder, and the `/api/<collection>/file/<filename>` URL a SahajCloud
 * dev server returns in place of a Cloudflare one.
 */
export const PASSTHROUGH_SOURCES = [
  ['a bundled asset', '/assets/smnd.webp'],
  ['a story placeholder', 'https://picsum.photos/seed/fixture/400/400'],
  ['the SahajCloud dev fallback', '/api/media/file/photo.jpg'],
] as const
