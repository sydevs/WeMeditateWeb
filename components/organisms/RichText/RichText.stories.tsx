import type { Story, StoryDefault } from '@ladle/react'
import { RichText } from './RichText'

export default {
  title: 'Organisms',
} satisfies StoryDefault

// --- Lexical node builders (mirror the serialized shape PayloadCMS emits) ---

const FORMAT = { bold: 1, italic: 2 } as const

const text = (value: string, format = 0) => ({
  type: 'text',
  text: value,
  format,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

const paragraph = (children: unknown[], format = '') => ({
  type: 'paragraph',
  children,
  direction: 'ltr',
  format,
  indent: 0,
  version: 1,
})

const heading = (tag: 'h2' | 'h3' | 'h4', value: string) => ({
  type: 'heading',
  tag,
  children: [text(value)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const listItem = (value: string) => ({
  type: 'listitem',
  value: 1,
  checked: undefined,
  children: [text(value)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const list = (listType: 'bullet' | 'number', items: string[]) => ({
  type: 'list',
  listType,
  tag: listType === 'bullet' ? 'ul' : 'ol',
  start: 1,
  children: items.map(listItem),
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const quote = (value: string) => ({
  type: 'quote',
  children: [text(value)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const customLink = (label: string, url: string, newTab = true) => ({
  type: 'link',
  fields: { linkType: 'custom', url, newTab },
  children: [text(label)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const internalLink = (label: string, slug: string) => ({
  type: 'link',
  fields: {
    linkType: 'internal',
    newTab: false,
    doc: { relationTo: 'pages', value: { id: 1, slug } },
  },
  children: [text(label)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const uploadImage = (
  url: string,
  alt: string,
  caption: string,
  align: 'left' | 'center' | 'right' | 'wide',
) => ({
  type: 'upload',
  relationTo: 'images',
  value: { id: 7, url, alt, width: 1200, height: 800 },
  fields: { align, caption },
  version: 1,
})

const relationshipNode = (relationTo: string, value: Record<string, unknown>) => ({
  type: 'relationship',
  relationTo,
  value,
  version: 1,
})

// --- Custom Page block builders ---

const block = (blockType: string, fields: Record<string, unknown>) => ({
  type: 'block',
  fields: { blockType, id: blockType, ...fields },
  format: '',
  version: 2,
})

const imageRef = (seed: string, alt = 'Image', w = 1200, h = 800) => ({
  id: seed,
  url: `https://picsum.photos/seed/${seed}/${w}/${h}`,
  alt,
  width: w,
  height: h,
})

const pageRef = (id: number, slug: string, title: string, description = '') => ({
  id,
  slug,
  title,
  meta: { image: imageRef(slug, title), description },
})

const meditationRef = (id: number, title: string, durationMinutes: number) => ({
  id,
  title,
  durationMinutes,
  thumbnail: imageRef(`med-${id}`, title, 800, 800),
})

const editorState = (children: unknown[]) => ({
  root: {
    type: 'root',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
})

const FIGURE_IMAGE = 'https://picsum.photos/seed/richtext-figure/1200/800'

/**
 * A single page simulating every node and custom block RichText can render,
 * each at its maximal configuration: standard typography (headings, formatted
 * paragraphs, links, lists, blockquote, figure image) plus all ten custom
 * blocks (splash, textbox, quote, image-gallery, every layout style, showcase,
 * subtle-system, table-of-contents, content-index, button).
 */
const pageContent = editorState([
  // Full-bleed hero
  block('splash', {
    layout: 'countdown',
    images: [
      imageRef('splash-a', 'Splash A', 1600, 900),
      imageRef('splash-b', 'Splash B', 1600, 900),
    ],
    title: 'Meditate for Better Mental Health',
    subtitle: 'Making a start is easier than you think.',
    actionText: 'Try it now',
    actionURL: '#',
  }),

  // Headings + formatted body + links
  heading('h2', 'What is Meditation?'),
  paragraph([
    text('Meditation is the art of '),
    text('effortless attention', FORMAT.bold),
    text(' — not forcing the mind, but '),
    text('allowing', FORMAT.italic),
    text(' it to settle. Read more on the '),
    internalLink('about page', 'about'),
    text(' or the '),
    customLink('official site', 'https://example.com'),
    text('.'),
  ]),

  // Text alignment (AlignFeature) + an inline relationship to another document
  paragraph([text('This paragraph is centered to demonstrate AlignFeature.')], 'center'),
  paragraph([text('And this one is right-aligned.')], 'right'),
  relationshipNode('pages', { id: 9, slug: 'techniques', title: 'Meditation Techniques' }),

  // Table of contents (anchors resolve to the headings on this page)
  block('table-of-contents', {
    title: 'In this article',
    headings: [
      { slug: 'what-is-meditation', text: 'What is Meditation?', level: 2 },
      { slug: 'how-to-begin', text: 'How to Begin', level: 2 },
      { slug: 'finding-a-quiet-space', text: 'Finding a Quiet Space', level: 3 },
      { slug: 'going-deeper', text: 'Going Deeper', level: 2 },
    ],
  }),

  heading('h2', 'How to Begin'),
  paragraph([text('Start with just a few minutes a day and let the practice grow naturally.')]),
  list('number', [
    'Find a quiet place',
    'Set a gentle timer',
    'Return to the breath when it wanders',
  ]),
  heading('h3', 'Finding a Quiet Space'),
  paragraph([text('A calm corner is all you need to begin.')]),
  list('bullet', ['Sit comfortably', 'Soften your gaze', 'Notice the breath']),
  quote('The quieter you become, the more you are able to hear.'),
  uploadImage(FIGURE_IMAGE, 'A calm landscape', 'Morning light over the hills', 'center'),
  uploadImage(FIGURE_IMAGE, 'A meadow at dawn', 'A right-aligned figure', 'right'),
  uploadImage(FIGURE_IMAGE, 'A wide vista', 'A wide (full-width) figure', 'wide'),

  // Text box (overlay variant exercises every conditional field)
  block('textbox', {
    imagePosition: 'overlay',
    textPosition: 'center',
    textColor: 'light',
    wisdomStyle: true,
    title: 'Get Connected',
    subtitle: 'Collective meditation',
    text: 'Meditation is even stronger when shared. Discover free collective meditations near you.',
    buttonText: 'Classes near me',
    buttonUrl: '#',
    image: imageRef('textbox', 'Group class', 1600, 900),
  }),

  // Quote block → HeroQuote
  block('quote', {
    title: 'On Kundalini',
    text: 'This Kundalini is the spiritual mother of every individual.',
    credit: 'Shri Mataji Nirmala Devi',
    caption: 'Public Program, London, 1978',
  }),

  // Image gallery
  block('image-gallery', {
    items: [
      imageRef('g1', 'Gallery one', 800, 600),
      imageRef('g2', 'Gallery two', 600, 800),
      imageRef('g3', 'Gallery three', 1200, 800),
      imageRef('g4', 'Gallery four', 800, 800),
      imageRef('g5', 'Gallery five', 900, 1200),
      imageRef('g6', 'Gallery six', 1200, 675),
    ],
  }),

  heading('h2', 'Going Deeper'),

  // Layout — every style
  block('layout', {
    style: 'accordion',
    title: 'Frequently asked',
    items: [
      {
        id: 'q1',
        title: 'How much does it cost?',
        text: 'Classes are always 100% free of charge.',
      },
      {
        id: 'q2',
        title: 'What do I bring?',
        text: 'No equipment is required — just an open mind.',
      },
      { id: 'q3', title: 'Do I need experience?', text: 'None at all. Everyone is welcome.' },
    ],
  }),
  block('layout', {
    style: 'tabs',
    title: 'The three channels',
    useColumnsOnDesktop: true,
    items: [
      {
        id: 't1',
        title: 'Left',
        titleUrl: '#left',
        text: 'Emotions and desires.',
        image: imageRef('tab1', 'Left', 1200, 675),
      },
      {
        id: 't2',
        title: 'Center',
        titleUrl: '#center',
        text: 'Our evolution.',
        image: imageRef('tab2', 'Center', 1200, 675),
      },
      {
        id: 't3',
        title: 'Right',
        titleUrl: '#right',
        text: 'Action and planning.',
        image: imageRef('tab3', 'Right', 1200, 675),
      },
    ],
  }),
  block('layout', {
    style: 'grid',
    title: 'Explore the chakras',
    items: [
      {
        id: 'gr1',
        title: 'Mooladhara',
        titleUrl: '#',
        text: 'Innocence and wisdom.',
        image: imageRef('grid1', 'Mooladhara', 1200, 675),
      },
      {
        id: 'gr2',
        title: 'Swadisthan',
        titleUrl: '#',
        text: 'Creativity.',
        image: imageRef('grid2', 'Swadisthan', 1200, 675),
      },
      {
        id: 'gr3',
        title: 'Nabhi',
        titleUrl: '#',
        text: 'Satisfaction.',
        image: imageRef('grid3', 'Nabhi', 1200, 675),
      },
    ],
  }),
  block('layout', {
    style: 'list',
    title: 'Steps of the practice',
    items: [
      {
        id: 'l1',
        title: 'Raise the Kundalini',
        text: 'Place your left hand in front of your body and raise it.',
        image: imageRef('list1', 'Step 1', 1200, 675),
      },
      {
        id: 'l2',
        title: 'Tie a knot',
        text: 'When you reach the top of your head, tie a knot.',
        image: imageRef('list2', 'Step 2', 1200, 675),
      },
    ],
  }),
  block('layout', {
    style: 'textList',
    title: 'How to do it',
    items: [
      { id: 'tl1', title: 'Step 1', text: 'Raise the Kundalini energy.' },
      { id: 'tl2', title: 'Step 2', text: 'Tie a knot at the top of the head.' },
      { id: 'tl3', title: 'Step 3', text: 'Repeat three times in total.' },
    ],
  }),

  // Showcase — populated relationships
  block('showcase', {
    items: [
      { relationTo: 'meditations', value: meditationRef(5, 'Morning Meditation', 10) },
      { relationTo: 'pages', value: pageRef(2, 'about', 'About Sahaja') },
      { relationTo: 'meditations', value: meditationRef(6, 'Evening Calm', 15) },
      { relationTo: 'pages', value: pageRef(3, 'techniques', 'Techniques') },
    ],
  }),

  // Subtle system — all twelve relationships
  block('subtle-system', {
    left: pageRef(61, 'left-channel', 'Left Channel', 'The channel of our desires and emotions.'),
    right: pageRef(60, 'right-channel', 'Right Channel', 'The channel of action and planning.'),
    center: pageRef(62, 'central-channel', 'Central Channel', 'The channel of our evolution.'),
    mooladhara: pageRef(52, 'mooladhara-chakra', 'Mooladhara Chakra', 'Innocence and wisdom.'),
    swadhistan: pageRef(
      53,
      'swadhistan-chakra',
      'Swadhistan Chakra',
      'Creativity and pure attention.',
    ),
    nabhi: pageRef(54, 'nabhi-chakra', 'Nabhi Chakra', 'Satisfaction and generosity.'),
    void: pageRef(55, 'void-chakra', 'Void', 'The ocean of illusion.'),
    anahat: pageRef(56, 'heart-chakra', 'Anahata Chakra', 'Love and security.'),
    vishuddhi: pageRef(
      57,
      'vishuddhi-chakra',
      'Vishuddhi Chakra',
      'Communication and collectivity.',
    ),
    agnya: pageRef(58, 'agnya-chakra', 'Agnya Chakra', 'Forgiveness and humility.'),
    sahasrara: pageRef(
      59,
      'sahasrara-chakra',
      'Sahasrara Chakra',
      'Integration and self-realisation.',
    ),
    kundalini: pageRef(63, 'kundalini', 'Kundalini', 'The maternal spiritual energy.'),
  }),

  // Content index — pre-resolved live list
  block('content-index', {
    type: 'pages',
    limit: 6,
    resolvedItems: [
      {
        id: 1,
        title: 'What is Meditation?',
        href: '#',
        thumbnailSrc: 'https://picsum.photos/seed/ci1/800/450',
        aspectRatio: 'video',
      },
      {
        id: 2,
        title: 'The Benefits of Daily Practice',
        href: '#',
        thumbnailSrc: 'https://picsum.photos/seed/ci2/800/450',
        aspectRatio: 'video',
      },
      {
        id: 3,
        title: 'Getting Started',
        href: '#',
        thumbnailSrc: 'https://picsum.photos/seed/ci3/800/450',
        aspectRatio: 'video',
      },
    ],
  }),

  // Standalone CTA
  block('button', { text: 'Join a group meditation', url: '#' }),
])

/**
 * Full-page simulation of every RichText node and custom block at maximal
 * configuration. Rendered full-bleed (no padding/max-width) so it fills the
 * available space.
 */
export const Default: Story = () => <RichText debug content={pageContent} />

Default.storyName = 'Rich Text'
