import type { Story, StoryDefault } from "@ladle/react";
import { Header } from "./Header";

export default {
  title: "Organisms"
} satisfies StoryDefault;

/**
 * Complete page header with logo, navigation menu, action link, and breadcrumbs.
 * Wrapped in a scrollable container to demonstrate sticky navigation behavior.
 */
export const Default: Story = () => (
  <div className="h-full overflow-y-auto border-4 border-gray-200 px-6">
    <Header
      logoHref="/"
      actionLinkText="Classes near me"
      actionLinkHref="/classes"
      navItems={[
        { label: 'Meditate Now', href: '/meditate' },
        { label: 'Music for Meditation', href: '/music' },
        { label: 'Inspiration', href: '/inspiration' },
        { label: 'About Meditation', href: '/about' }
      ]}
      breadcrumbs={[
        { label: 'Home Page', href: '/' },
        { label: 'About Meditation', href: '/about' },
        { label: 'Improving Your Meditation' }
      ]}
    />

    {/* Long content to demonstrate sticky navigation */}
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8 bg-white">
      <h1 className="text-4xl font-semibold text-gray-700">
        Improving Your Meditation Practice
      </h1>

      <p className="text-base text-gray-600 leading-relaxed">
        Meditation is a powerful practice that can transform your life in countless ways.
        Whether you're seeking stress relief, improved focus, or spiritual growth,
        developing a consistent meditation practice is key to experiencing its full benefits.
      </p>

      <h2 className="text-2xl font-medium text-gray-700 mt-8">
        Getting Started with Meditation
      </h2>

      <p className="text-base text-gray-600 leading-relaxed">
        Starting a meditation practice doesn't require any special equipment or extensive training.
        All you need is a quiet space, a comfortable position, and a willingness to observe your
        thoughts without judgment. Begin with just 5-10 minutes per day and gradually increase
        the duration as you become more comfortable with the practice.
      </p>

      <h2 className="text-2xl font-medium text-gray-700 mt-8">
        Common Challenges and Solutions
      </h2>

      <p className="text-base text-gray-600 leading-relaxed">
        Many beginners find their minds wandering during meditation, which is completely normal.
        The key is not to get frustrated when this happens. Instead, gently bring your attention
        back to your breath or chosen point of focus. With practice, you'll find it becomes
        easier to maintain concentration for longer periods.
      </p>

      <h2 className="text-2xl font-medium text-gray-700 mt-8">
        Building a Daily Practice
      </h2>

      <p className="text-base text-gray-600 leading-relaxed">
        Consistency is more important than duration when building a meditation habit. Try to
        meditate at the same time each day, whether it's first thing in the morning or before
        bed. This helps establish a routine and makes meditation a natural part of your daily
        schedule. Many practitioners find that morning meditation sets a positive tone for the
        entire day.
      </p>

      <h2 className="text-2xl font-medium text-gray-700 mt-8">
        Advanced Techniques
      </h2>

      <p className="text-base text-gray-600 leading-relaxed">
        As your practice deepens, you may want to explore different meditation techniques such
        as loving-kindness meditation, body scan meditation, or visualization practices. Each
        technique offers unique benefits and can help you develop different aspects of mindfulness
        and awareness. Experiment with various approaches to find what resonates most with you.
      </p>

      <h2 className="text-2xl font-medium text-gray-700 mt-8">
        The Science Behind Meditation
      </h2>

      <p className="text-base text-gray-600 leading-relaxed">
        Research has shown that regular meditation can lead to measurable changes in brain
        structure and function. Studies indicate benefits including reduced stress and anxiety,
        improved emotional regulation, enhanced focus and concentration, and even changes in
        areas of the brain associated with memory and learning. These findings provide scientific
        validation for what practitioners have known for centuries.
      </p>

      <h2 className="text-2xl font-medium text-gray-700 mt-8">
        Scroll Up to See the Sticky Navigation
      </h2>

      <p className="text-base text-gray-600 leading-relaxed">
        Notice how the navigation menu stays at the top of the page as you scroll through this
        content. This makes it easy to access different sections of the site without having to
        scroll back to the top. The subtle shadow effect helps distinguish the sticky navigation
        from the page content below it.
      </p>

      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">Additional content space for testing scroll behavior</p>
      </div>
    </div>
  </div>
);

Default.storyName = "Header"
