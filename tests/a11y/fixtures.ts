/**
 * The pages `page-types.test.tsx` runs axe over.
 *
 * Each fixture is the smallest document that still renders the real chrome:
 * the header nav with its mega dropdown, the three footer link lists, the
 * social row and the language control. Stubbing those away would leave the
 * gate measuring the fixture instead of the site — three of the four defects
 * this gate was built for live in exactly that chrome.
 *
 * **Pre-mortem.** These assume a `WebConfig` whose `featuredPages`,
 * `knowledgePages`, `classPages`, `infoPages` and `featuredArticles` are
 * arrays of pages carrying `title` and `slug`, and that the chrome reads only
 * those five plus `availableLocales`, a list of locale codes the language
 * control offers. Checked against `layouts/useSiteNav.ts`,
 * `layouts/headerDropdown.ts` and `layouts/LayoutChrome.tsx`, which are the
 * only readers; `types/sahajcloud.ts` types each page field as a page
 * relationship. The content fixtures assume the
 * serialized-Lexical shape `components/organisms/RichText/blockConverters.tsx`
 * reads — a root whose `block` children carry `fields.blockType` — checked
 * against the `splash` and `layout` converters there.
 */

import type { AtlasSeoResponse } from '@/types/atlas'
import type { Lecture, Meditation, Page, WebConfig } from '@/types/sahajcloud'

const IMAGE = {
  url: 'https://imagedelivery.net/acct/fixture-image/public',
  alt: 'Meditators in a garden',
  width: 1600,
  height: 900,
}

const page = (slug: string, title: string) => ({ id: slug.length, slug, title })

/** Every nav surface configured, so the header dropdown and all three footer lists render. */
export const webConfig = {
  homePage: page('index', 'Home'),
  availableLocales: ['en', 'fr'],
  featuredPages: [page('meditate-now', 'Meditate Now'), page('music', 'Music')],
  knowledgePages: [page('about-meditation', 'About Meditation'), page('chakras', 'Chakras')],
  classPages: [page('classes', 'Classes Near Me')],
  infoPages: [page('contact', 'Contact')],
  featuredArticles: [
    { ...page('history', 'The History Of Meditation'), meta: { image: IMAGE } },
    { ...page('breathing', 'Breathing And Attention'), meta: { image: IMAGE } },
  ],
} as unknown as WebConfig

const root = (children: unknown[]) => ({
  root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 },
})

const block = (blockType: string, fields: Record<string, unknown>) => ({
  type: 'block',
  fields: { blockType, ...fields },
})

const paragraph = (text: string) => ({
  type: 'paragraph',
  children: [{ type: 'text', text, version: 1, detail: 0, format: 0, mode: 'normal', style: '' }],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const heading = (tag: string, text: string) => ({ ...paragraph(text), type: 'heading', tag })

/**
 * The home page: a lead splash, then a `layout` grid whose section carries no
 * heading of its own. That second half is the shape `heading-order` fired on.
 */
export const homePage = {
  ...page('index', 'We Meditate'),
  content: root([
    block('splash', {
      layout: 'default',
      images: [IMAGE],
      title: 'Meditation is your own discovery',
      subtitle: 'Free, guided, and yours to keep',
      actionText: 'Start now',
      actionURL: '/meditate-now',
      textColor: 'light',
    }),
    block('layout', {
      style: 'grid',
      items: [
        { id: 'a', title: 'Learn', text: 'Begin with the basics.' },
        { id: 'b', title: 'Practice', text: 'Sit with it daily.' },
      ],
    }),
  ]),
  author: null,
  featuredVideo: null,
  meta: null,
} as unknown as Page

/** An article: a title banner, a byline, body copy and a titled `layout` section. */
/**
 * A `meditations` block's resolved library.
 *
 * **Pre-mortem.** This assumes a choice carries a `kind` of `mood` or
 * `duration`, a nullable `iconUrl` and `color`, and `slots` keyed by time of
 * day; and that a listing carries a required `durationMinutes`, because every
 * card label names the meditation by its length. Checked against the
 * interfaces in `lib/content/blocks.ts` and what `server/meditation-library.ts`
 * builds.
 *
 * Two moods and one duration, with one meditation named by two choices, so the
 * gate sees a chip row, both question rows and a deduped grid.
 */
export const MEDITATION_LIBRARY = {
  choices: [
    {
      id: 1,
      kind: 'mood' as const,
      title: 'Excited for the day!',
      iconUrl: 'https://assets.invalid/choice-1.svg',
      color: '#FFD591',
      slots: { morning: 69, evening: 89 },
    },
    {
      id: 8,
      kind: 'mood' as const,
      title: 'Need to focus',
      iconUrl: null,
      color: '#F5B9A8',
      slots: { afternoon: 85 },
    },
    {
      id: 25,
      kind: 'duration' as const,
      title: '5 min',
      iconUrl: 'https://assets.invalid/choice-25.svg',
      color: '#A4D9D1',
      slots: { morning: 69 },
    },
  ],
  meditations: [
    {
      id: 69,
      href: '/meditations/69',
      durationMinutes: 15,
      thumbnail: { ...IMAGE, aspectRatio: 'video' as const },
      choiceIds: [1, 25],
    },
    {
      id: 89,
      href: '/meditations/89',
      durationMinutes: 13,
      thumbnail: { ...IMAGE, aspectRatio: 'video' as const },
      choiceIds: [1],
    },
    {
      id: 85,
      href: '/meditations/85',
      durationMinutes: 20,
      thumbnail: { ...IMAGE, aspectRatio: 'video' as const },
      choiceIds: [8],
    },
  ],
}

export const articlePage = {
  ...page('best-time-to-meditate', 'The Best Time To Meditate'),
  content: root([
    paragraph('Morning and evening both work. What matters is that you return.'),
    heading('h2', 'Why the morning helps'),
    paragraph('Attention is quietest before the day asks anything of it.'),
    block('layout', {
      style: 'grid',
      title: 'Two ways to begin',
      items: [
        { id: 'a', title: 'Guided', text: 'Follow a voice.' },
        { id: 'b', title: 'Silent', text: 'Follow the breath.' },
      ],
    }),
    // The `meditations` block, so the axe gate covers `MeditationLibrary` on
    // the route that really carries it. It has no route of its own: it is a
    // block an editor adds to a page.
    block('content-index', { type: 'meditations', limit: 20, resolvedLibrary: MEDITATION_LIBRARY }),
  ]),
  author: {
    id: 3,
    name: 'Shri Mataji Nirmala Devi',
    countryCode: 'IN',
    yearsMeditating: 40,
    photo: IMAGE,
  },
  featuredVideo: null,
  meta: { title: 'The Best Time To Meditate', description: 'When to sit, and why.', image: null },
} as unknown as Page

export const meditation = {
  id: 105,
  title: 'Letting The Day Settle',
  url: 'https://example.invalid/audio/105.mp3',
  durationMinutes: 12,
  thumbnail: IMAGE,
  frames: null,
} as unknown as Meditation

/**
 * The raw lecture both lecture routes carry, as a SahajCloud read returns one.
 *
 * **Pre-mortem.** Checked against `LECTURE_SELECT` in
 * `server/sahajcloud/` and `parseLectureMetadata` in
 * `lib/content/lecture-shape.ts`.
 */
export const lecture = {
  id: 42,
  type: 'full',
  title: 'Attention And Awareness',
  thumbnail: IMAGE,
  metadata: {
    hlsUrl: 'https://example.invalid/hls/42.m3u8',
    duration: 900,
  },
} as unknown as Lecture

/**
 * `/map`'s landing document — the body a crawler reads before the widget mounts.
 *
 * **Pre-mortem.** `AtlasContent` dispatches on `type`, not on a `kind` field,
 * and the `root` variant carries `id: null` and a `content.paragraphs` list.
 * Checked against the `AtlasSeoResponse` union in `types/atlas.ts` and
 * the switch in `pages/map/_components/AtlasContent.tsx` — an unrecognised
 * discriminator renders nothing at all, which is how this fixture first served
 * a `/map` with no heading.
 */
export const atlasSeo: AtlasSeoResponse = {
  type: 'root',
  id: null,
  route: '/',
  locale: 'en',
  title: 'Find a free meditation class near you',
  description: 'Classes run by volunteers, everywhere.',
  canonical: 'https://wemeditate.com/map',
  alternates: [],
  openGraph: { 'og:image': IMAGE.url } as AtlasSeoResponse['openGraph'],
  jsonLd: '{}',
  breadcrumbs: [],
  content: {
    paragraphs: [
      'Every class on this map is free.',
      'Search by place, or open the map and look around.',
    ],
  },
}
