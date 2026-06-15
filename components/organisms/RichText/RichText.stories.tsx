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

    <StorySection
      description="Custom blocks (implemented in a later ticket) degrade gracefully — the surrounding content still renders."
      title="Unknown blocks"
    >
      <RichText
        content={editorState([
          paragraph([text('Content before the unknown block.')]),
          unknownBlock('showcase'),
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
