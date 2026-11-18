import { useState } from 'react'
import { Bars3Icon } from '@heroicons/react/24/outline'
import {
  useFloating,
  autoUpdate,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
} from '@floating-ui/react'
import { Button } from '../../atoms'
import type { NavItem } from '../Header/Header'
import { useT } from '../../../hooks/useT'

export interface MobileMenuProps {
  /** The same items the `lg:` link row renders, so the two reach the same places. */
  navItems: NavItem[]
  /** Extra classes for the trigger. `Header` passes `lg:hidden`. */
  className?: string
}

/**
 * The site menu on a phone: a trigger in the compact header bar, and a
 * full-screen panel under it listing every destination the `lg:` link row
 * reaches. A nav item that opens a mega menu there has no `href`, so its own
 * label becomes a heading and its links are listed inline beneath it.
 *
 * It matters most on `/map`, which renders no footer — there the bar is the
 * only way out of the page.
 */
export function MobileMenu({ navItems, className = '' }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const t = useT()

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom',
    // Fixed positioning with no transform keeps Floating UI's vertical
    // placement — below the trigger, tracking the sticky state — while the
    // style below pins the panel to the viewport on the other three sides.
    strategy: 'fixed',
    transform: false,
    whileElementsMounted: autoUpdate,
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'dialog' })

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  // One name in both states: `aria-expanded` carries whether the panel is open.
  const label = t('common.a11y.menu')

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
          {/*
           * Trapped, unlike `Dropdown` and `HeaderNavDropdown`: a full-screen
           * panel leaves nothing behind it to reach, so keyboard focus that
           * escaped it would land on a page the panel covers. Escape, the
           * outside press and the focus return are all Floating UI's.
           */}
          <FloatingFocusManager context={context}>
            <div
              ref={refs.setFloating}
              // `left: 0; right: 0` rather than `width: 100vw` spans the
              // viewport's content area, excluding the scrollbar, so the open
              // panel never adds a horizontal scrollbar. Floating UI supplies
              // only `top`; `bottom: 0` is what makes the panel full-screen,
              // and a portal is what frees it from the `overflow-hidden h-dvh`
              // column `/map` renders the bar inside.
              style={{
                position: floatingStyles.position,
                top: floatingStyles.top,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              {...getFloatingProps({ 'aria-label': label })}
              className="surface-light z-50 overflow-y-auto bg-white py-2"
            >
              <ul>
                {navItems.map((item) =>
                  item.dropdown ? (
                    <li key={item.label}>
                      <h2 className="px-8 pt-4 pb-1 text-sm font-medium text-fg-muted">
                        {item.label}
                      </h2>

                      <ul>
                        {item.dropdown.links.map((link) => (
                          <li key={link.href}>
                            <Button fullWidth href={link.href} variant="ghost">
                              {link.label}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ) : (
                    <li key={item.label}>
                      <Button fullWidth href={item.href} isActive={item.active} variant="ghost">
                        {item.label}
                      </Button>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  )
}
