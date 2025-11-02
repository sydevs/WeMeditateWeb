'use client'

import { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
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
  /**
   * Array of accordion items to display
   */
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

  /**
   * Callback when an item is toggled
   */
  onToggle?: (itemId: string, isOpen: boolean) => void

  /**
   * Additional CSS classes for the accordion container
   */
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
 * - Smooth expand/collapse animations
 * - Keyboard accessible (Space/Enter to toggle)
 * - Screen reader friendly with ARIA attributes
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
  className = '',
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(defaultOpenItems))

  const toggleItem = (itemId: string) => {
    setOpenItems((prev) => {
      const newOpenItems = new Set(prev)
      const isCurrentlyOpen = newOpenItems.has(itemId)

      if (isCurrentlyOpen) {
        newOpenItems.delete(itemId)
      } else {
        if (!allowMultiple) {
          newOpenItems.clear()
        }
        newOpenItems.add(itemId)
      }

      onToggle?.(itemId, !isCurrentlyOpen)
      return newOpenItems
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleItem(itemId)
    }
  }

  return (
    <div className={`max-w-3xl ${className}`} role="region">
      {items.map((item, index) => {
        const isOpen = openItems.has(item.id)
        const isLastItem = index === items.length - 1

        return (
          <article
            key={item.id}
            className={`${!isLastItem ? 'border-b border-gray-300' : ''}`}
          >
            <h3>
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                aria-expanded={isOpen}
                aria-controls={`accordion-content-${item.id}`}
                className="relative w-full text-left py-4 pr-8 cursor-pointer group flex items-center justify-between"
              >
                <span className={`text-xl font-medium transition-colors ${
                  isOpen ? 'text-gray-800' : 'text-gray-600 group-hover:text-gray-800'
                }`}>
                  {item.title}
                </span>
                <Icon
                  icon={ChevronDownIcon}
                  size="md"
                  color="tertiary"
                  className={`transition-transform duration-300 shrink-0 ${
                    isOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                  aria-hidden="true"
                />
              </button>
            </h3>

            <div
              id={`accordion-content-${item.id}`}
              role="region"
              aria-labelledby={`accordion-header-${item.id}`}
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="pb-6 pr-8 text-base leading-relaxed text-gray-600">
                {item.content}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
