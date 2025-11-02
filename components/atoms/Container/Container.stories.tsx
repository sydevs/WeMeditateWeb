import type { Story, StoryDefault } from "@ladle/react";
import { Container } from "./Container";
import { StoryWrapper, StorySection,
  StoryExampleSection, StorySubsection } from '../../ladle';

export default {
  title: "Atoms / Layout"
} satisfies StoryDefault;

/**
 * Container component showcasing all max widths, padding options, and usage in context.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Sizes">
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-600 mb-2">Small (max-w-3xl)</p>
          <Container maxWidth="sm">
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-gray-700">Small container - ideal for focused content like forms</p>
            </div>
          </Container>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Medium (max-w-5xl)</p>
          <Container maxWidth="md">
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-gray-700">Medium container - perfect for articles and blog posts</p>
            </div>
          </Container>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Large (max-w-7xl)</p>
          <Container maxWidth="lg">
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-gray-700">Large container - great for dashboards and grids</p>
            </div>
          </Container>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Full (no max-width)</p>
          <Container maxWidth="full">
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-gray-700">Full width container - spans the entire viewport</p>
            </div>
          </Container>
        </div>
      </div>
    </StorySection>

    <StorySection title="Padding">
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-600 mb-2">Small padding</p>
          <Container padding="sm">
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-gray-700">Container with small horizontal padding</p>
            </div>
          </Container>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Medium padding (default)</p>
          <Container padding="md">
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-gray-700">Container with medium horizontal padding</p>
            </div>
          </Container>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Large padding</p>
          <Container padding="lg">
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-gray-700">Container with large horizontal padding</p>
            </div>
          </Container>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">No padding</p>
          <Container padding="none">
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-gray-700">Container with no horizontal padding</p>
            </div>
          </Container>
        </div>
      </div>
    </StorySection>

    <StoryExampleSection>
      <StorySubsection label="Article">
        <div className="bg-gray-50 py-8">
          <Container maxWidth="md">
            <article>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                The Benefits of Daily Meditation
              </h1>
              <p className="text-gray-700 mb-4">
                Meditation is a powerful practice that can transform your life in many ways.
                Regular practice has been shown to reduce stress, improve focus, and enhance
                overall well-being.
              </p>
              <p className="text-gray-700 mb-4">
                Starting a meditation practice doesn't have to be complicated. Just a few
                minutes each day can make a significant difference in how you feel and how
                you respond to life's challenges.
              </p>
              <p className="text-gray-700">
                The key is consistency. Find a quiet time and place, sit comfortably, and
                simply focus on your breath. Over time, you'll discover the profound benefits
                that meditation can bring.
              </p>
            </article>
          </Container>
        </div>
      </StorySubsection>

      <StorySubsection label="Form">
        <div className="bg-gray-50 py-8">
          <Container maxWidth="sm">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Sign Up for Free
              </h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900">Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="you@example.com"
                  />
                </div>
                <button className="w-full bg-teal-500 text-white py-2 px-4 rounded hover:bg-teal-600">
                  Get Started
                </button>
              </form>
            </div>
          </Container>
        </div>
      </StorySubsection>

      <StorySubsection label="Dashboard">
        <div className="bg-gray-50 py-8">
          <Container maxWidth="lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Meditation Journey</h2>
            <div className="grid grid-cols-3 gap-6">
              {[
                { title: "Sessions", value: "127", subtitle: "Total meditations" },
                { title: "Streak", value: "15", subtitle: "Days in a row" },
                { title: "Minutes", value: "1,840", subtitle: "Time practiced" },
              ].map((stat) => (
                <div key={stat.title} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">{stat.title}</h3>
                  <p className="text-3xl font-bold text-teal-600 mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.subtitle}</p>
                </div>
              ))}
            </div>
          </Container>
        </div>
      </StorySubsection>
    </StoryExampleSection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Container"
