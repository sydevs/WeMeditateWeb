import type { Story, StoryDefault } from '@ladle/react'
import { Accordion, AccordionItemData } from './Accordion'
import {
  StoryWrapper,
  StorySection,
  StoryExampleSection,
} from '../../ladle'

export default {
  title: 'Molecules / Interactive',
} satisfies StoryDefault

// Sample data for stories
const faqItems: AccordionItemData[] = [
  {
    id: '1',
    title: 'How much does it cost?',
    content:
      'Sahaja Yoga Meditation classes are always 100% free of charge. Why? Because to know your True Self is the right of every human being. Self-Realisation is not a man-made thing. It is a living, spontaneous process. Anyone leading a Sahaja Yoga class is there as a volunteer, simply out of their desire to share the knowledge which has lead them towards a better life.',
  },
  {
    id: '2',
    title: 'What do I bring?',
    content:
      'No equipment is required, and seating will be provided. All you need is an open mind and the desire to go within.',
  },
  {
    id: '3',
    title: 'Do I need to have meditated before?',
    content:
      "No! Sahaja Yoga meditation classes are usually suitable for first-timers, unless clearly stated in the class title e.g. 'Advanced Class'.",
  },
]

/**
 * Accordion molecule showcasing collapsible content sections for FAQs and hierarchical information.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Example">
      <Accordion items={faqItems} />
    </StorySection>

    <StorySection title="First Item Open">
      <Accordion items={faqItems} defaultOpenItems={['1']} />
    </StorySection>

    <StorySection title="Allow Multiple Open">
      <Accordion items={faqItems} allowMultiple defaultOpenItems={['1', '2']} />
    </StorySection>

    <StoryExampleSection subtitle="Rich HTML Content">
      <Accordion
        items={[
          {
            id: '1',
            title: 'What are the benefits of meditation?',
            content: (
              <div>
                <p className="mb-4">Regular meditation practice offers numerous benefits:</p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Reduced stress and anxiety</li>
                  <li>Improved focus and concentration</li>
                  <li>Enhanced emotional well-being</li>
                  <li>Better sleep quality</li>
                </ul>
                <p>
                  <strong>Scientific research</strong> has shown that meditation can lead to
                  lasting positive changes in brain structure and function.
                </p>
              </div>
            ),
          },
          {
            id: '2',
            title: 'How do I get started?',
            content: (
              <div>
                <p className="mb-3">Getting started with meditation is simple:</p>
                <ol className="list-decimal list-inside space-y-2 mb-4">
                  <li>Find a quiet, comfortable space</li>
                  <li>Sit in a relaxed but upright position</li>
                  <li>Close your eyes and focus on your breath</li>
                  <li>Start with just 5-10 minutes per day</li>
                </ol>
                <p className="mb-2">
                  For guided sessions, visit our{' '}
                  <a href="#" className="text-teal-600 underline hover:text-teal-700">
                    meditation library
                  </a>
                  .
                </p>
              </div>
            ),
          },
          {
            id: '3',
            title: 'When is the best time to meditate?',
            content: (
              <div>
                <p className="mb-3">
                  The best time to meditate is whenever works for your schedule, but many people
                  find these times particularly effective:
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-gray-800">Early Morning</p>
                    <p className="text-sm">
                      Sets a peaceful tone for the day and your mind is naturally quiet
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Before Bed</p>
                    <p className="text-sm">Helps you unwind and can improve sleep quality</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Midday Break</p>
                    <p className="text-sm">Provides a mental reset during busy workdays</p>
                  </div>
                </div>
              </div>
            ),
          },
        ]}
        allowMultiple
        defaultOpenItems={['1']}
      />
    </StoryExampleSection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Accordion'
