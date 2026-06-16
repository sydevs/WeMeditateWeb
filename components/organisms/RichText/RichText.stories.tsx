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

const listItem = (value: string, ordinal: number) => ({
  type: 'listitem',
  value: ordinal,
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
  // value is the item's ordinal — each item must increment or an ordered list
  // renders every number as "1".
  children: items.map((item, index) => listItem(item, index + 1)),
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const quote = (value: string, format = '') => ({
  type: 'quote',
  children: [text(value)],
  direction: 'ltr',
  format,
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

// Filler body copy used to surround the blocks with flowing prose (so floated
// blockquotes have text to wrap and block spacing reads realistically).
const FILLER = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident.',
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
  'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur quis autem vel eum iure reprehenderit.',
  'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga et harum quidem rerum facilis est et expedita distinctio nam libero tempore.',
  'Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae itaque earum rerum hic tenetur a sapiente delectus.',
]

let fillerCursor = 0

/** Build `count` filler paragraphs, cycling through the pool deterministically. */
const fillerParagraphs = (count: number) =>
  Array.from({ length: count }, () => paragraph([text(FILLER[fillerCursor++ % FILLER.length])]))

/** Nodes that warrant surrounding prose: custom blocks, images, and (floated)
 * blockquotes — so the float has body text to wrap. */
const isBlock = (node: unknown): boolean => {
  const type = (node as { type?: string }).type

  return type === 'block' || type === 'upload' || type === 'quote'
}

/**
 * Surround each block with 1–3 filler paragraphs (deterministic, varied).
 * Filler is only inserted adjacent to a block — consecutive typographic nodes
 * (headings, paragraphs, lists, blockquotes) keep their own natural flow.
 */
const withFiller = (nodes: unknown[]): unknown[] =>
  nodes.flatMap((node, index) => {
    const next = nodes[index + 1]

    if (next === undefined || (!isBlock(node) && !isBlock(next))) {
      return [node]
    }

    return [node, ...fillerParagraphs((index % 3) + 1)]
  })

/**
 * A single page simulating every node and custom block RichText can render,
 * each at its maximal configuration: standard typography (headings, formatted
 * paragraphs, links, lists, blockquote, figure image) plus all ten custom
 * blocks (splash, textbox, quote, image-gallery, every layout style, showcase,
 * subtle-system, table-of-contents, content-index, button).
 */
const pageContent = editorState(
  withFiller([
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
    quote(
      'The quieter you become, the more you are able to hear. In the stillness between thoughts there is a patient awareness that was never disturbed by the noise, and it is always available the moment we stop reaching for it. Rest there for even a few breaths and the day rearranges itself around a calmer center.',
    ),
    quote(
      'Stillness is where creativity and solutions are found. When the surface of the mind settles, what was murky becomes clear, and answers that striving could never force arrive on their own — quietly, unhurried, and complete — as though they had been waiting all along for us to stop and listen.',
      'left',
    ),
    uploadImage(FIGURE_IMAGE, 'A misty forest', 'A left-aligned figure', 'left'),
    paragraph([text(FILLER[1])]),
    uploadImage(FIGURE_IMAGE, 'A meadow at dawn', 'A right-aligned figure', 'right'),
    paragraph([text(FILLER[1])]),
    uploadImage(FIGURE_IMAGE, 'A wide vista', 'A wide (full-width) figure', 'wide'),
    paragraph([text(FILLER[0])]),
    paragraph([text(FILLER[1])]),
    uploadImage(FIGURE_IMAGE, 'A calm landscape', 'A centered figure', 'center'),

    // Text box — all three image positions (left / right side layouts + overlay)
    block('textbox', {
      imagePosition: 'left',
      title: 'Get Connected',
      text: 'Meditation is even stronger when shared. Discover free collective meditations near you.',
      buttonText: 'Classes near me',
      buttonUrl: '#',
      image: imageRef('textbox-left', 'Group class', 900, 1200),
    }),
    block('textbox', {
      imagePosition: 'right',
      title: 'Learn the Technique',
      text: 'A few minutes a day is enough to begin a steady practice.',
      buttonText: 'Start now',
      buttonUrl: '#',
      image: imageRef('textbox-right', 'Meditating', 900, 1200),
    }),
    // Overlay variant also exercises every conditional field
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

    // Content index — production fetches `apiEndpoint` server-side in +data (see
    // server/content-index.ts) and attaches the results. Ladle has no backend, so
    // `resolvedItems` here is a fixture standing in for the fetched list; the rest
    // of the block is shown fully configured.
    block('content-index', {
      type: 'pages',
      limit: 6,
      pageFilters: ['wisdom', 'lifestyle'],
      apiEndpoint: '/api/pages?where[tags][in]=wisdom,lifestyle&limit=6',
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
  ]),
)

/**
 * Full-page simulation of every RichText node and custom block at maximal
 * configuration. Rendered full-bleed (no padding/max-width) so it fills the
 * available space.
 */
export const Default: Story = () => <RichText debug content={pageContent} />

Default.storyName = 'Rich Text'
