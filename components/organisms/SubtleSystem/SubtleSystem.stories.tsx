import type { Story, StoryDefault } from "@ladle/react";
import { SubtleSystem } from "./SubtleSystem";
import type { SubtleSystemItem } from "./SubtleSystem";
import { StoryWrapper, StorySection } from '../../ladle';

export default {
  title: "Organisms"
} satisfies StoryDefault;

/**
 * Realistic article data for chakras and channels
 */
const storyItems: SubtleSystemItem[] = [
  // Chakras (8 items)
  {
    id: 'chakra_1',
    title: 'Mooladhara Chakra',
    description: 'The foundation of the subtle system, governing our sense of innocence, wisdom, and connection to Mother Earth. Located at the base of the spine.',
    linkHref: '#'
  },
  {
    id: 'chakra_2',
    title: 'Swadisthan Chakra',
    description: 'The center of creativity and pure attention. It governs our capacity to think, plan for the future, and express creative energy.',
    linkHref: '#'
  },
  {
    id: 'chakra_3',
    title: 'Nabhi Chakra',
    description: 'The center of sustenance and righteousness. It governs our sense of satisfaction, generosity, and evolution. Also called the Void.',
    linkHref: '#'
  },
  {
    id: 'chakra_3b',
    title: 'The Void',
    description: 'The ocean of illusion surrounding the Nabhi. Represents the principle of the Guru or Master within us, our capacity to seek and find truth.',
    linkHref: '#'
  },
  {
    id: 'chakra_4',
    title: 'Heart Chakra',
    description: 'The center of love, compassion, and pure relationships. It governs our sense of security and our ability to give and receive love unconditionally.',
    linkHref: '#'
  },
  {
    id: 'chakra_5',
    title: 'Vishuddhi Chakra',
    description: 'The center of communication and collective consciousness. Located at the throat, it governs our sense of diplomacy and integration with others.',
    linkHref: '#'
  },
  {
    id: 'chakra_6',
    title: 'Agnya Chakra',
    description: 'The center of forgiveness and humility. Located at the optic chiasma, it controls our thoughts and enables us to forgive ourselves and others.',
    linkHref: '#'
  },
  {
    id: 'chakra_7',
    title: 'Sahasrara Chakra',
    description: 'The crown chakra, representing our integration and connection to the divine. It is the culmination of the entire subtle system.',
    linkHref: '#'
  },
  // Kundalini
  {
    id: 'kundalini',
    title: 'Kundalini',
    description: 'The dormant spiritual energy that resides at the base of the spine. Through meditation, it awakens and rises through the central channel.',
    linkHref: '#'
  },
  // Channels (3 items)
  {
    id: 'channel_left',
    title: 'Left Channel (Ida Nadi)',
    description: 'The channel of emotions, desires, and our past. It governs our subconscious mind and our capacity for introspection and feeling.',
    linkHref: '#'
  },
  {
    id: 'channel_right',
    title: 'Right Channel (Pingala Nadi)',
    description: 'The channel of action, thinking, and planning. It governs our conscious mind and our capacity for physical and mental activity.',
    linkHref: '#'
  },
  {
    id: 'channel_center',
    title: 'Central Channel (Sushumna Nadi)',
    description: 'The path of spiritual ascent. When the Kundalini awakens, it rises through this central channel, piercing each chakra and bringing balance.',
    linkHref: '#'
  }
];

/**
 * Interactive subtle system visualization showcasing chakras, channels,
 * idle animations, hover interactions, and fullscreen mode.
 *
 * **Interactive Features:**
 * - Toggle between "Chakras" and "Channels" views
 * - Hover over colored areas in the SVG to see article previews
 * - Idle animations play when no element is selected
 * - Click fullscreen button to expand component
 *
 * **Mobile Behavior:**
 * - Previews appear below the chart
 * - Auto-scroll to preview when node is selected
 * - Touch to interact with chakras/channels
 *
 * **Desktop Behavior:**
 * - Previews positioned absolutely on left/right sides
 * - Smooth fade-in transitions
 * - 100ms delay for nested chakras to prevent accidental selections
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Example">
      <SubtleSystem items={storyItems} />
    </StorySection>

    <StorySection title="With Title and Background" inContext={true}>
      <div className="bg-gradient-to-b from-teal-50 to-white py-12 px-4">
        <h2 className="font-raleway text-4xl sm:text-5xl font-normal tracking-wide text-center mb-8">
          The Subtle System
        </h2>
        <SubtleSystem items={storyItems} />
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Subtle System"
