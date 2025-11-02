import type { Story, StoryDefault } from '@ladle/react'
import { Footer } from './Footer'

export default {
  title: 'Organisms',
} satisfies StoryDefault

const heroLinks = [
  { text: 'Meditate Now', href: '/meditate' },
  { text: 'Music for meditation', href: '/music' },
  { text: 'Inspiration', href: '/inspiration' },
]

const learnMoreSection = {
  title: 'Learn more',
  links: [
    { text: 'The First Experience', href: '/first-experience' },
    { text: 'Chakras & Channels', href: '/chakras' },
    { text: 'Founder of Sahaja Yoga', href: '/founder' },
    { text: 'About Sahaja Yoga', href: '/about' },
  ],
}

const comeMeditateSection = {
  title: 'Come meditate',
  links: [
    { text: 'Classes Near Me', href: '/classes' },
    { text: 'Guided Meditations Online', href: '/guided' },
    { text: 'Live Online Classes', href: '/live' },
    { text: 'Privacy Notice', href: '/privacy' },
    { text: 'Contact Us', href: '/contact' },
  ],
}

const socialLinks = [
  { platform: 'instagram' as const, href: 'https://instagram.com/wemeditate' },
  { platform: 'facebook' as const, href: 'https://facebook.com/wemeditate' },
]

const languages = [
  { code: 'en' as const, label: 'English', href: '/about' },
  { code: 'es' as const, label: 'Español', href: '/es/about' },
  { code: 'de' as const, label: 'Deutsch', href: '/de/about' },
  { code: 'it' as const, label: 'Italiano', href: '/it/about' },
  { code: 'fr' as const, label: 'Français', href: '/fr/about' },
  { code: 'ru' as const, label: 'Русский', href: '/ru/about' },
  { code: 'ro' as const, label: 'Română', href: '/ro/about' },
  { code: 'cs' as const, label: 'Čeština', href: '/cs/about' },
  { code: 'uk' as const, label: 'Українська', href: '/uk/about' },
  { code: 'bg' as const, label: 'Български', href: '/bg/about' },
]

/**
 * Footer organism - Complete website footer based on wemeditate.com design.
 */
export const Default: Story = () => (
  <Footer
    heroLinks={heroLinks}
    sections={[learnMoreSection, comeMeditateSection]}
    socialLinks={socialLinks}
    currentLanguage="en"
    languages={languages}
    copyrightText="© WeMeditate, 2025"
    locale="en"
  />
)

Default.storyName = 'Footer'
