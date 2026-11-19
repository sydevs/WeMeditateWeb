import { useState } from 'react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import {
  useFloating,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
  FloatingOverlay,
} from '@floating-ui/react'
import { Button } from '../../atoms'
import type { NavItem } from '../Header'
import { useT } from '../../../hooks/useT'

export interface MobileMenuProps {
  /** The same items the `lg:` link row renders, so the two reach the same places. */
  navItems: NavItem[]
  /** Extra classes for the trigger. */
  className?: string
}

/**
 * The site menu on a phone: a trigger in the compact header bar, and a panel
 * covering the viewport over it, one row per `navItems` destination. A nav item
 * that opens a mega menu has no `href`, so its own label becomes a heading and
 * its `dropdown.links` are listed inline beneath it. The mega menu's featured
 * articles are editorial picks rather than nav, and are not repeated here.
 */
export function MobileMenu({ navItems, className }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const t = useT()

  // The interactions context alone: nothing here is positioned. An anchored
  // `top` measures the `sticky` nav, and the scroll lock below puts
  // `position: fixed` on `<body>` on iOS, which takes that nav's scroll
  // container away and drags the bar — and any top measured from it — off the
  // top of the screen.
  const { refs, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'dialog' })

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  const label = t('common.a11y.menu')
  const close = () => setIsOpen(false)

  return (
    <>
      <Button
        ref={refs.setReference}
        aria-label={label}
        className={className}
        icon={Bars3Icon}
        variant="ghost"
        {...getReferenceProps()}
      />

      {isOpen && (
        <FloatingPortal>
          {/* A `fixed` panel leaves the page behind it scrollable, so without
              the lock the panel's own scroll chains into it. */}
          <FloatingOverlay lockScroll>
            {/* Trapped, unlike `Dropdown` and `HeaderNavDropdown`: the panel
                covers the page, so there is nothing behind it to reach. */}
            <FloatingFocusManager context={context}>
              <div
                ref={refs.setFloating}
                {...getFloatingProps({ 'aria-label': label })}
                // Insets rather than a width: `w-screen` counts the scrollbar
                // and would add a horizontal one of its own.
                className="surface-light fixed inset-0 z-50 overflow-y-auto bg-white py-2"
              >
                {/* The only way out a pointer has: the panel covers the
                    trigger, and the trap has it inert meanwhile. */}
                <div className="flex justify-end px-4">
                  <Button
                    aria-label={t('common.a11y.close')}
                    icon={XMarkIcon}
                    variant="ghost"
                    onClick={close}
                  />
                </div>

                <ul>
                  {navItems.map((item) => (
                    <li key={item.label}>
                      {item.dropdown ? (
                        <>
                          <h2 className="px-8 pt-4 pb-1 text-sm font-medium text-fg-muted">
                            {item.label}
                          </h2>

                          <ul>
                            {item.dropdown.links.map((link) => (
                              <li key={link.href}>
                                <Button fullWidth href={link.href} variant="ghost" onClick={close}>
                                  {link.label}
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <Button
                          fullWidth
                          href={item.href}
                          isActive={item.active}
                          variant="ghost"
                          onClick={close}
                        >
                          {item.label}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </FloatingFocusManager>
          </FloatingOverlay>
        </FloatingPortal>
      )}
    </>
  )
}
