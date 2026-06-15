import type { Story, StoryDefault } from '@ladle/react'
import { RichText } from './RichText'
import { StoryWrapper, StorySection } from '../../ladle'

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

const paragraph = (children: unknown[]) => ({
  type: 'paragraph',
  children,
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const heading = (tag: 'h2' | 'h3', value: string) => ({
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
  align: 'left' | 'center' | 'right',
) => ({
  type: 'upload',
  relationTo: 'images',
  value: { id: 7, url, alt, width: 1200, height: 800 },
  fields: { align, caption },
  version: 1,
})

const unknownBlock = (blockType: string) => ({
  type: 'block',
  fields: { blockType, id: 'demo' },
  format: '',
  version: 2,
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

const IMAGE = 'https://picsum.photos/seed/richtext/1200/800'

/**
 * RichText renders PayloadCMS Lexical content with app-specific converters:
 * anchored headings, locale-aware links, Cloudflare-aware figure images, and a
 * graceful fallback for not-yet-implemented custom blocks.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection
      description="Headings get a slugified anchor id; inline bold/italic via the default converters."
      title="Text & Headings"
    >
      <RichText
        content={editorState([
          heading('h2', 'Finding Stillness'),
          paragraph([
            text('Meditation is the art of '),
            text('effortless attention', FORMAT.bold),
            text(' — not forcing the mind, but '),
            text('allowing', FORMAT.italic),
            text(' it to settle.'),
          ]),
          heading('h3', 'A Gentle Beginning'),
          paragraph([
            text('Start with just a few minutes a day and let the practice grow naturally.'),
          ]),
        ])}
      />
    </StorySection>

    <StorySection title="Lists & Quotes">
      <RichText
        content={editorState([
          list('bullet', ['Sit comfortably', 'Soften your gaze', 'Notice the breath']),
          list('number', ['Inhale slowly', 'Pause', 'Exhale fully']),
          quote('The quieter you become, the more you are able to hear.'),
        ])}
      />
    </StorySection>

    <StorySection
      description="Custom external links open in a new tab; internal links route through the relationTo→href mapper."
      title="Links"
    >
      <RichText
        content={editorState([
          paragraph([
            text('Read more on the '),
            internalLink('about page', 'about'),
            text(' or visit the '),
            customLink('official site', 'https://example.com'),
            text('.'),
          ]),
        ])}
      />
    </StorySection>

    <StorySection title="Images">
      <div className="flex flex-col gap-8">
        <StorySection title="Centered with caption" variant="subsection">
          <RichText
            content={editorState([
              uploadImage(IMAGE, 'A calm landscape', 'Morning light over the hills', 'center'),
            ])}
          />
        </StorySection>
        <StorySection title="Left aligned" variant="subsection">
          <RichText
            content={editorState([
              uploadImage(IMAGE, 'A calm landscape', 'Left-aligned figure', 'left'),
            ])}
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Text Box, Quote & Button blocks">
      <div className="flex flex-col gap-8">
        <StorySection title="Text box — image left + CTA" variant="subsection">
          <RichText
            content={editorState([
              block('textbox', {
                imagePosition: 'left',
                title: 'Get Connected',
                text: 'Meditation is even stronger when shared. Discover free collective meditations near you.',
                buttonText: 'Classes near me',
                buttonUrl: '#',
                image: imageRef('textbox', 'Group class', 900, 1200),
              }),
            ])}
          />
        </StorySection>
        <StorySection title="Quote" variant="subsection">
          <RichText
            content={editorState([
              block('quote', {
                title: 'On Kundalini',
                text: 'This Kundalini is the spiritual mother of every individual.',
                credit: 'Shri Mataji Nirmala Devi',
                caption: 'Public Program, London, 1978',
              }),
            ])}
          />
        </StorySection>
        <StorySection title="Button" variant="subsection">
          <RichText
            content={editorState([block('button', { text: 'Join a group meditation', url: '#' })])}
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Image Gallery block">
      <RichText
        content={editorState([
          block('image-gallery', {
            items: [
              imageRef('g1', 'One', 800, 600),
              imageRef('g2', 'Two', 600, 800),
              imageRef('g3', 'Three', 1200, 800),
              imageRef('g4', 'Four', 800, 800),
            ],
          }),
        ])}
      />
    </StorySection>

    <StorySection title="Layout block">
      <div className="flex flex-col gap-8">
        <StorySection title="Accordion" variant="subsection">
          <RichText
            content={editorState([
              block('layout', {
                style: 'accordion',
                title: 'Frequently asked',
                items: [
                  { id: 'q1', title: 'How much does it cost?', text: 'Classes are always free.' },
                  { id: 'q2', title: 'What do I bring?', text: 'Just an open mind.' },
                ],
              }),
            ])}
          />
        </StorySection>
        <StorySection title="Grid" variant="subsection">
          <RichText
            content={editorState([
              block('layout', {
                style: 'grid',
                items: [
                  {
                    id: 'g1',
                    title: 'Step 1',
                    text: 'Sit comfortably.',
                    image: imageRef('lg1', 'Step 1', 1200, 675),
                  },
                  {
                    id: 'g2',
                    title: 'Step 2',
                    text: 'Soften your gaze.',
                    image: imageRef('lg2', 'Step 2', 1200, 675),
                  },
                  {
                    id: 'g3',
                    title: 'Step 3',
                    text: 'Follow the breath.',
                    image: imageRef('lg3', 'Step 3', 1200, 675),
                  },
                ],
              }),
            ])}
          />
        </StorySection>
        <StorySection title="Text list" variant="subsection">
          <RichText
            content={editorState([
              block('layout', {
                style: 'textList',
                title: 'How to do it',
                items: [
                  { id: 's1', title: 'Step 1', text: 'Raise the Kundalini.' },
                  { id: 's2', title: 'Step 2', text: 'Tie a knot at the top of the head.' },
                ],
              }),
            ])}
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Showcase block">
      <RichText
        content={editorState([
          block('showcase', {
            items: [
              { relationTo: 'meditations', value: meditationRef(5, 'Morning Meditation', 10) },
              { relationTo: 'pages', value: pageRef(2, 'about', 'About Sahaja') },
              { relationTo: 'meditations', value: meditationRef(6, 'Evening Calm', 15) },
            ],
          }),
        ])}
      />
    </StorySection>

    <StorySection title="Splash block">
      <RichText
        content={editorState([
          block('splash', {
            layout: 'default',
            images: [imageRef('splash', 'Splash background', 1600, 900)],
            title: 'Meditate for better mental health',
            subtitle: 'Making a start is easier than you think.',
            actionText: 'Try it now',
            actionURL: '#',
          }),
        ])}
      />
    </StorySection>

    <StorySection
      description="The 12 page relationships map to chakra/channel SVG nodes; hover or tap a node to preview."
      title="Subtle System block"
    >
      <RichText
        content={editorState([
          block('subtle-system', {
            left: pageRef(
              61,
              'left-channel',
              'Left Channel',
              'The channel of our desires and emotions.',
            ),
            right: pageRef(
              60,
              'right-channel',
              'Right Channel',
              'The channel of action and planning.',
            ),
            center: pageRef(
              62,
              'central-channel',
              'Central Channel',
              'The channel of our evolution.',
            ),
            mooladhara: pageRef(
              52,
              'mooladhara-chakra',
              'Mooladhara Chakra',
              'Innocence and wisdom.',
            ),
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
        ])}
      />
    </StorySection>

    <StorySection
      description="Resolved server-side in +data from the block's apiEndpoint; shown here with sample items."
      title="Content Index block"
    >
      <RichText
        content={editorState([
          block('content-index', {
            type: 'pages',
            limit: 3,
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
                title: 'The Benefits',
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
        ])}
      />
    </StorySection>

    <StorySection
      description="A block with no registered converter degrades gracefully — the surrounding content still renders (a dev-only alert flags it)."
      title="Unknown blocks"
    >
      <RichText
        content={editorState([
          paragraph([text('Content before the unknown block.')]),
          unknownBlock('mystery-block'),
          paragraph([text('Content after the unknown block — nothing crashed.')]),
        ])}
      />
    </StorySection>

    <StorySection inContext={true} title="Examples">
      <RichText
        content={editorState([
          heading('h2', 'How to Meditate'),
          paragraph([
            text('This short guide covers the '),
            text('essentials', FORMAT.bold),
            text(' of a daily practice.'),
          ]),
          uploadImage(IMAGE, 'Meditation setting', 'A quiet corner is all you need', 'center'),
          heading('h3', 'The Steps'),
          list('number', [
            'Find a quiet place',
            'Set a gentle timer',
            'Return to the breath when the mind wanders',
          ]),
          quote('Meditation is not evasion; it is a serene encounter with reality.'),
          paragraph([
            text('Continue exploring on the '),
            internalLink('techniques page', 'techniques'),
            text('.'),
          ]),
        ])}
      />
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Rich Text'
