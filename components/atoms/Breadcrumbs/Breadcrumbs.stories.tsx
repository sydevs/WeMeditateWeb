import type { Story, StoryDefault } from "@ladle/react";
import { Breadcrumbs } from "./Breadcrumbs";
import { StoryWrapper, StorySection, StoryExampleSection, StorySubsection } from '../../ladle';

export default {
  title: "Atoms / Navigation"
} satisfies StoryDefault;

/**
 * Breadcrumbs component showcasing navigation path patterns.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Examples">
      <div className="flex flex-col gap-6">
        <StorySubsection label="Two Levels">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Current Page' }
            ]}
          />
        </StorySubsection>

        <StorySubsection label="Three Levels">
          <Breadcrumbs
            items={[
              { label: 'Home Page', href: '/' },
              { label: 'About Meditation', href: '/about' },
              { label: 'Improving Your Meditation' }
            ]}
          />
        </StorySubsection>

        <StorySubsection label="Four Levels">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Articles', href: '/articles' },
              { label: 'Meditation Tips', href: '/articles/meditation-tips' },
              { label: 'Current Article' }
            ]}
          />
        </StorySubsection>
      </div>
    </StorySection>

    <StoryExampleSection>
      <div className="flex flex-col gap-8">
        <StorySubsection label="Page Header Context">
          <div className="bg-white p-6 border border-gray-200">
            <Breadcrumbs
              items={[
                { label: 'Home Page', href: '/' },
                { label: 'About Meditation', href: '/about' },
                { label: 'Improving Your Meditation' }
              ]}
            />
            <h1 className="text-3xl font-semibold text-gray-700 mt-4">
              Improving Your Meditation
            </h1>
          </div>
        </StorySubsection>

        <StorySubsection label="With Long Labels">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Articles and Resources', href: '/articles' },
              { label: 'Meditation Techniques for Beginners', href: '/articles/techniques' },
              { label: 'A Comprehensive Guide to Mindfulness Practice' }
            ]}
          />
        </StorySubsection>
      </div>
    </StoryExampleSection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Breadcrumbs"
