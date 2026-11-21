import { useEffect, useId, useState, type ReactNode } from 'react'
import {
  Bars3Icon,
  CheckIcon,
  ChevronDownIcon,
  GlobeAltIcon,
  MapPinIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  useFloatingRootContext,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
  FloatingOverlay,
} from '@floating-ui/react'
import { Button, Icon, Link, Logo } from '../../atoms'
import { SocialIcon } from '../../atoms/graphics/SocialIcon'
import type { NavItem } from '../Header'
import { barRow, trailingIconInset } from '../Header/bar'
import type { SocialLink } from '../Footer'
import type { LanguageOption } from '../../molecules/LanguageDropdown'
import { useLocale } from '../../../hooks/usePageContext'
import { useT } from '../../../hooks/useT'

export interface MobileMenuProps {
  /** The same items the `lg:` link row renders, so the two reach the same places. */
  navItems: NavItem[]
  /** The header logo's destination, repeated in the panel's own bar. */
  logoHref?: string
  /** The header's action link, for example "Classes near me". */
  actionLinkText?: string
  actionLinkHref?: string
  /** Languages to offer, each linking to the current page in that language. */
  languages?: LanguageOption[]
  /** Social profiles, as the footer lists them. */
  socialLinks?: readonly SocialLink[]
  /** Extra classes for the trigger. */
  className?: string
}

const rowBase =
  'flex touch-target items-center justify-center no-underline transition-colors hover:text-primary'
const row = `${rowBase} w-full gap-2.5 py-3.5 text-xl text-fg`
const subRow = `${rowBase} gap-2 text-base text-fg-muted`

/**
 * The site menu on a phone: a trigger in the compact header bar, and a calm,
 * centred panel covering the viewport over it. The panel opens on a copy of the
 * bar, so its close control lands where the trigger was. A nav item that opens
 * a mega menu has no `href`, so here it is a disclosure over its
 * `dropdown.links`. The mega menu's featured articles are editorial picks
 * rather than nav, and are not repeated here.
 */
export function MobileMenu({
  navItems,
  logoHref = '/',
  actionLinkText,
  actionLinkHref,
  languages = [],
  socialLinks = [],
  className,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reference, setReference] = useState<Element | null>(null)
  const [floating, setFloating] = useState<HTMLElement | null>(null)
  const t = useT()

  // The interactions context alone: nothing here is positioned. An anchored
  // `top` measures the `sticky` nav, and the scroll lock below puts
  // `position: fixed` on `<body>` on iOS, which takes that nav's scroll
  // container away and drags the bar — and any top measured from it — off the
  // top of the screen. `useFloating` would still compute a position on open,
  // and re-render the panel to store it.
  const context = useFloatingRootContext({
    open: isOpen,
    onOpenChange: setIsOpen,
    elements: { reference, floating },
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'dialog' })

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  // The trigger is `lg:hidden`, so a panel left open when a tablet turns to
  // landscape would hold the scroll lock and the trap over a page that offers
  // no way back to it. `64rem` is Tailwind's `lg`.
  useEffect(() => {
    if (!isOpen || typeof window.matchMedia !== 'function') return

    const desktop = window.matchMedia('(min-width: 64rem)')
    const closeOnDesktop = () => {
      if (desktop.matches) setIsOpen(false)
    }

    desktop.addEventListener('change', closeOnDesktop)

    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [isOpen])

  const label = t('common.a11y.menu')
  const close = () => setIsOpen(false)

  return (
    <>
      <Button
        ref={setReference}
        aria-label={label}
        className={className}
        icon={Bars3Icon}
        variant="ghost"
        {...getReferenceProps()}
      />

      {isOpen && (
        <FloatingPortal>
          {/* A `fixed` panel leaves the page behind it scrollable, so without
              the lock the panel's own scroll chains into it. Above the sticky
              nav's `z-50`: at `auto` the bar and the splash overlay painted
              over the panel, and took the taps meant for its close control. */}
          <FloatingOverlay lockScroll className="z-60">
            {/* Trapped, unlike `Dropdown` and `HeaderNavDropdown`: the panel
                covers the page, so there is nothing behind it to reach. */}
            <FloatingFocusManager context={context}>
              <div
                ref={setFloating}
                {...getFloatingProps({ 'aria-label': label })}
                // Insets rather than a width: `w-screen` counts the scrollbar
                // and would add a horizontal one of its own.
                className="surface-light fixed inset-0 flex flex-col overflow-y-auto bg-white pb-8 text-fg-muted"
              >
                {/* The header bar's own geometry — height, gutter, the ☰'s
                    offset — so × replaces ☰ in place. It is also the only way
                    out a pointer has: the trap has the trigger inert. */}
                <div className={`${barRow} shrink-0 justify-between px-6`}>
                  <Logo
                    className="shrink-0"
                    href={logoHref}
                    size="lg"
                    variant="inline"
                    onClick={close}
                  />
                  <Button
                    aria-label={t('common.a11y.close')}
                    className={trailingIconInset}
                    icon={XMarkIcon}
                    variant="ghost"
                    onClick={close}
                  />
                </div>

                {/* `my-auto` centres the list in the room the bar and the foot
                    leave, and collapses to nothing on a short screen —
                    `justify-center` would push the first rows above the
                    scroll origin, out of reach. */}
                <div className="my-auto py-8">
                  <ul className="px-6">
                    {navItems.map((item) => (
                      <NavRow key={item.label} item={item} onNavigate={close} />
                    ))}
                  </ul>

                  {actionLinkText && actionLinkHref && (
                    <div className="flex justify-center px-6 pt-7">
                      <Button
                        href={actionLinkHref}
                        icon={MapPinIcon}
                        variant="outline"
                        onClick={close}
                      >
                        {actionLinkText}
                      </Button>
                    </div>
                  )}
                </div>

                <MenuFoot languages={languages} socialLinks={socialLinks} onNavigate={close} />
              </div>
            </FloatingFocusManager>
          </FloatingOverlay>
        </FloatingPortal>
      )}
    </>
  )
}

/** One top-level destination: a link, or a disclosure over a mega menu's links. */
function NavRow({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  if (item.dropdown) {
    return (
      <li>
        <Disclosure label={item.label} triggerClassName={row}>
          {item.dropdown.links.map((link) => (
            <li key={link.href}>
              <Link className={subRow} href={link.href} variant="unstyled" onClick={onNavigate}>
                {link.label}
              </Link>
            </li>
          ))}
        </Disclosure>
      </li>
    )
  }

  // A mega-menu item has no `href` of its own; so has a malformed one.
  if (!item.href) return null

  return (
    <li>
      <Link
        aria-current={item.active ? 'page' : undefined}
        className={`${row} aria-[current=page]:text-primary`}
        href={item.href}
        variant="unstyled"
        onClick={onNavigate}
      >
        {item.label}
      </Link>
    </li>
  )
}

/** The panel's foot: the social row, and the languages this page is published in. */
function MenuFoot({
  languages,
  socialLinks,
  onNavigate,
}: {
  languages: LanguageOption[]
  socialLinks: readonly SocialLink[]
  onNavigate: () => void
}) {
  const locale = useLocale()
  const t = useT()

  return (
    <div className="flex flex-col items-center gap-1 px-6">
      {socialLinks.length > 0 && (
        <div className="flex flex-wrap justify-center">
          {socialLinks.map((social) => (
            <SocialIcon key={social.platform} href={social.href} platform={social.platform} />
          ))}
        </div>
      )}

      {/* Inline rather than `LanguageDropdown`: its list portals at `z-50`,
          under this panel. */}
      {languages.length > 1 && (
        <Disclosure
          label={
            <>
              <Icon icon={GlobeAltIcon} size="sm" />
              {t('footer.languages')}
            </>
          }
          triggerClassName={`${subRow} px-2`}
        >
          {languages.map((language) => (
            <li key={language.code}>
              <Link
                aria-current={language.code === locale ? 'true' : undefined}
                className={subRow}
                href={language.href}
                locale={language.code}
                variant="unstyled"
                onClick={onNavigate}
              >
                <span lang={language.code}>{language.label}</span>
                {language.code === locale && (
                  <Icon className="text-primary" icon={CheckIcon} size="xs" />
                )}
              </Link>
            </li>
          ))}
        </Disclosure>
      )}
    </div>
  )
}

/** A trigger that shows and hides the list of `<li>` children beneath it. */
function Disclosure({
  label,
  triggerClassName,
  children,
}: {
  label: ReactNode
  triggerClassName: string
  children: ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const listId = useId()

  return (
    <>
      <button
        aria-controls={listId}
        aria-expanded={isOpen}
        className={`${triggerClassName} cursor-pointer focus-ring`}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
      >
        {label}
        <Icon
          className={`motion-safe:transition-transform ${isOpen ? 'rotate-180' : ''}`}
          icon={ChevronDownIcon}
          size="sm"
        />
      </button>

      <ul className="pb-2" hidden={!isOpen} id={listId}>
        {children}
      </ul>
    </>
  )
}
