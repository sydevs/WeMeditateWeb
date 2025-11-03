import type { Story, StoryDefault } from "@ladle/react";
import { MasonryGrid, MasonryGridItem } from "./MasonryGrid";
import { StoryWrapper, StorySection, StoryExampleSection } from '../../ladle';

export default {
  title: "Molecules / Sections"
} satisfies StoryDefault;

// Sample data based on Shri Mataji timeline from wemeditate.com
const sampleItems: MasonryGridItem[] = [
  {
    id: 1,
    heading: "Italy, 1986",
    content: "The Italian government proclaims Shri Mataji as the Personality of the Year."
  },
  {
    id: 2,
    heading: "Moscow, Russia, 1989",
    content: "Succeeding Shri Mataji's meeting with the Minister for Health of the USSR, Sahaja Yoga receives full government support, including funding of scientific research."
  },
  {
    id: 3,
    heading: "St. Petersburg, Russia, 1993",
    content: "Elected as an honorary member of the Petrovsky Academy of Arts and Science. Shri Mataji opens the International Conference on Medicine and Self-knowledge, which subsequently becomes an annual conference."
  },
  {
    id: 4,
    heading: "Brasilia, Brazil, 1994",
    content: "Shri Mataji is welcomed at the airport by the Mayor of Brasilia, who presents her with the key to the city and sponsors all of her programs."
  },
  {
    id: 5,
    heading: "New York, USA, 1994",
    content: "26th September is declared 'Shri Mataji Nirmala Devi Day'. Shri Mataji is offered a police escort for a parade in her honour."
  },
  {
    id: 6,
    heading: "Bucharest, Romania, 1995",
    content: "Granted an Honorary Doctorate in Cognitive Science by Prof D Drime, head of the Ecological University Bucharest."
  },
  {
    id: 7,
    heading: "Beijing, China 1995",
    content: "The Chinese government invites Shri Mataji to be an official guest speaker at the 4th UN Conference on Women."
  },
  {
    id: 8,
    heading: "British Columbia, Canada, 1994",
    content: "On behalf of the people of Canada, the Premier of the Province of British Columbia, Mr Mike Harcourt, extends a letter of welcome to Shri Mataji."
  },
  {
    id: 9,
    heading: "Pune, India, 1996",
    content: "Shri Mataji addresses the 'World Philosophers Meet '96 - A Parliament of Science, Religion and Philosophy', where she is celebrated for the establishment of Sahaja Yoga."
  },
  {
    id: 10,
    heading: "USA, 105th Congress, 1997 and 106th Congress, 2000",
    content: "Honorarium read into the Congressional Record by Congressman Eliot Engle, who commends Shri Mataji for her dedicated and tireless work for humanity."
  },
  {
    id: 11,
    heading: "Cabella Ligure, Italy, 2006",
    content: "The Italian government awards Shri Mataji with honorary citizenship, succeeded by the presentation of the foundation stone for the 'Shri Mataji Nirmala Devi World Foundation of Sahaja Yoga' in Cabella Ligure."
  }
];

// Sample data with links for demonstrating linked items
const linkedItems: MasonryGridItem[] = [
  {
    id: 1,
    heading: "Introduction to Meditation",
    content: "Learn the fundamental techniques and benefits of meditation practice for beginners.",
    href: "/meditations/introduction"
  },
  {
    id: 2,
    heading: "Advanced Meditation Techniques",
    content: "Explore deeper meditation practices and how to overcome common obstacles in your practice.",
    href: "/meditations/advanced"
  },
  {
    id: 3,
    heading: "Meditation for Stress Relief",
    content: "Discover specific meditation techniques designed to reduce stress and promote inner calm.",
    href: "/meditations/stress-relief"
  },
  {
    id: 4,
    heading: "Daily Meditation Practice",
    content: "Build a sustainable daily meditation routine with practical tips and guided exercises.",
    href: "/meditations/daily-practice"
  }
];

/**
 * MasonryGrid component showcasing responsive masonry layout with "Show More" functionality.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Example">
      <MasonryGrid items={sampleItems} />
    </StorySection>

    <StorySection
      title="Linked Items"
      description="Grid items with href property display as clickable links with arrow indicators"
    >
      <MasonryGrid items={linkedItems} initialItemCount={linkedItems.length} />
    </StorySection>

    <StorySection
      title="Custom Initial Count"
      description="Showing 6 items initially with Show More button"
    >
      <MasonryGrid items={sampleItems} initialItemCount={6} />
    </StorySection>

    <StorySection
      title="Custom Breakpoints"
      description="1 column on mobile, 3 on tablet, 4 on desktop"
    >
      <MasonryGrid
        items={sampleItems}
        initialItemCount={8}
        breakpointCols={{
          default: 4,  // Desktop: 4 columns
          1023: 3,     // Tablet: 3 columns
          767: 1,      // Mobile: 1 column
        }}
      />
    </StorySection>

    <StoryExampleSection subtitle="Compact Layout">
      <div className="max-w-4xl mx-auto">
        <MasonryGrid
          items={sampleItems.slice(0, 6)}
          initialItemCount={4}
          breakpointCols={{
            default: 2,  // Desktop: 2 columns
            767: 1,      // Mobile: 1 column
          }}
        />
      </div>
    </StoryExampleSection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Masonry Grid"
