import type { Story, StoryDefault } from "@ladle/react";
import { Breadcrumbs } from "./Breadcrumbs";
import { StoryWrapper, StorySection } from '../../ladle';

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
        <StorySection title="Two Levels" variant="subsection">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Current Page' }
            ]}
          />
        </StorySection>

        <StorySection title="Three Levels" variant="subsection">
          <Breadcrumbs
            items={[
              { label: 'Home Page', href: '/' },
              { label: 'About Meditation', href: '/about' },
              { label: 'Improving Your Meditation' }
            ]}
          />
        </StorySection>

        <StorySection title="Four Levels" variant="subsection">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Articles', href: '/articles' },
              { label: 'Meditation Tips', href: '/articles/meditation-tips' },
              { label: 'Current Article' }
            ]}
          />
        </StorySection>
      </div>
    </StorySection>

    <StorySection title="Dark Theme" theme="dark" background="neutral">
      <Breadcrumbs
        theme="dark"
        items={[
          { label: 'Home Page', href: '/' },
          { label: 'About Meditation', href: '/about' },
          { label: 'Current Page' }
        ]}
      />
    </StorySection>

    <StorySection title="Examples" inContext={true}>
      <div className="flex flex-col gap-8">
        <StorySection title="Page Header Context" variant="subsection">
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
        </StorySection>

        <StorySection title="With Long Labels" variant="subsection">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Articles and Resources', href: '/articles' },
              { label: 'Meditation Techniques for Beginners', href: '/articles/techniques' },
              { label: 'A Comprehensive Guide to Mindfulness Practice' }
            ]}
          />
        </StorySection>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Breadcrumbs"
