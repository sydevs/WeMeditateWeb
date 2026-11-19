'use client'

import { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { Heading } from '../../atoms/Heading'
import { Icon } from '../../atoms/Icon'

export interface AccordionItemData {
  /** Unique identifier for the accordion item */
  id: string
  /** Title/question text displayed in the header */
  title: string
  /** Content displayed when expanded (can be text or JSX) */
  content: React.ReactNode
}

export interface AccordionProps {
  /** Array of accordion items to display */
  items: AccordionItemData[]

  /**
   * Allow multiple items to be open simultaneously
   * @default false
   */
  allowMultiple?: boolean

  /**
   * IDs of items that should be open by default
   * @default []
   */
  defaultOpenItems?: string[]

  /** Callback when an item is toggled */
  onToggle?: (itemId: string, isOpen: boolean) => void

  /**
   * The level each item's title takes: one under the section heading above
   * the accordion, or `h2` where there is none.
   * @default 'h3'
   */
  headingLevel?: 'h2' | 'h3'

  /** Additional CSS classes for the accordion container */
  className?: string
}

/**
 * Accordion component for collapsible content sections.
 *
 * Displays a list of items with clickable headers that expand/collapse content.
 * Commonly used for FAQs, documentation sections, or any hierarchical content.
 *
 * Features:
 * - Single or multiple items can be open at once
 * - Each header is a native `<button>`, so Enter and Space toggle it
 * - A closed panel is `hidden`: out of the accessibility tree and the tab
 *   order, not merely collapsed to no height
 *
 * @example
 * const items = [
 *   { id: '1', title: 'How much does it cost?', content: 'It is completely free.' },
 *   { id: '2', title: 'What do I bring?', content: 'No equipment needed.' }
 * ]
 * <Accordion items={items} />
 *
 * @example
 * // Allow multiple open items
 * <Accordion items={items} allowMultiple defaultOpenItems={['1', '2']} />
 */
export function Accordion({
  items,
  allowMultiple = false,
  defaultOpenItems = [],
  onToggle,
  headingLevel = 'h3',
  className = '',
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(() => new Set(defaultOpenItems))

  // The callback stays out of a state updater: React may run an updater
  // twice, and the caller would hear one click as two toggles.
  const toggleItem = (itemId: string) => {
    const isOpening = !openItems.has(itemId)
    const next = new Set(isOpening && !allowMultiple ? [] : openItems)

    if (isOpening) {
      next.add(itemId)
    } else {
      next.delete(itemId)
    }

    setOpenItems(next)
    onToggle?.(itemId, isOpening)
  }

  return (
    <div className={`mx-auto max-w-full sm:max-w-3xl ${className}`}>
      {items.map((item, index) => {
        const isOpen = openItems.has(item.id)
        const isLastItem = index === items.length - 1

        return (
          <article key={item.id} className={`${!isLastItem ? 'border-b border-gray-300' : ''}`}>
            <Heading level={headingLevel} styleAs="none">
              <button
                aria-controls={`accordion-content-${item.id}`}
                aria-expanded={isOpen}
                className="relative w-full text-left py-3 sm:py-4 pr-6 sm:pr-8 cursor-pointer group flex items-center justify-between"
                id={`accordion-header-${item.id}`}
                type="button"
                onClick={() => toggleItem(item.id)}
              >
                <span
                  className={`text-xl font-medium transition-colors ${
                    isOpen ? 'text-gray-800' : 'text-gray-700 group-hover:text-gray-800'
                  }`}
                >
                  {item.title}
                </span>
                <Icon
                  aria-hidden="true"
                  className={`transition-transform duration-300 shrink-0 ${
                    isOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                  color="neutral"
                  icon={ChevronDownIcon}
                  size="md"
                />
              </button>
            </Heading>

            <div
              aria-labelledby={`accordion-header-${item.id}`}
              hidden={!isOpen}
              id={`accordion-content-${item.id}`}
              role="region"
            >
              <div className="pb-4 sm:pb-6 pr-6 sm:pr-8 text-base leading-relaxed text-gray-700">
                {item.content}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
