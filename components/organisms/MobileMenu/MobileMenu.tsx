import { useId, useState, type ReactNode } from 'react'
import {
  Bars3Icon,
  CheckIcon,
  ChevronDownIcon,
  GlobeAltIcon,
  MapPinIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
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
import { Button, Icon, Link, Logo } from '../../atoms'
import { SocialIcon } from '../../atoms/graphics/SocialIcon'
import type { NavItem } from '../Header'
import type { SocialLink } from '../Footer'
import type { LanguageOption } from '../../molecules/LanguageDropdown'
import type { Locale } from '../../../server/sahajcloud-types'
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
  /** The language the page is in, marked in the list. */
  currentLanguage?: Locale
  /** Social profiles, as the footer lists them. */
  socialLinks?: SocialLink[]
  /** Extra classes for the trigger. */
  className?: string
}

const row =
  'flex w-full touch-target items-center justify-center gap-2.5 py-3.5 text-xl text-fg no-underline transition-colors hover:text-primary focus-ring'

const subRow =
  'flex touch-target items-center justify-center gap-2 text-base text-fg-muted no-underline transition-colors hover:text-primary focus-ring'

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
  currentLanguage,
  socialLinks = [],
  className,
}: MobileMenuProps) {
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
              the lock the panel's own scroll chains into it. Above the sticky
              nav's `z-50`: at `auto` the bar and the splash overlay painted
              over the panel, and took the taps meant for its close control. */}
          <FloatingOverlay lockScroll className="z-60">
            {/* Trapped, unlike `Dropdown` and `HeaderNavDropdown`: the panel
                covers the page, so there is nothing behind it to reach. */}
            <FloatingFocusManager context={context}>
              <div
                ref={refs.setFloating}
                {...getFloatingProps({ 'aria-label': label })}
                // Insets rather than a width: `w-screen` counts the scrollbar
                // and would add a horizontal one of its own.
                className="surface-light fixed inset-0 flex flex-col overflow-y-auto bg-white pb-8 text-fg-muted"
              >
                {/* The header bar's own geometry — height, gutter, the ☰'s
                    offset — so × replaces ☰ in place. It is also the only way
                    out a pointer has: the trap has the trigger inert. */}
                <div className="flex min-h-14 shrink-0 items-center justify-between px-6">
                  <Logo
                    aria-label={t('common.general.site_title')}
                    className="shrink-0 touch-target"
                    href={logoHref}
                    size="lg"
                    variant="inline"
                    onClick={close}
                  />
                  <Button
                    aria-label={t('common.a11y.close')}
                    className="-mr-2.5"
                    icon={XMarkIcon}
                    variant="ghost"
                    onClick={close}
                  />
                </div>

                <ul className="px-6 pt-10">
                  {navItems.map((item) => (
                    <li key={item.label}>
                      {item.dropdown ? (
                        <Disclosure label={item.label} triggerClassName={row}>
                          {item.dropdown.links.map((link) => (
                            <li key={link.href}>
                              <Link
                                className={subRow}
                                href={link.href}
                                variant="unstyled"
                                onClick={close}
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </Disclosure>
                      ) : (
                        item.href && (
                          <Link
                            aria-current={item.active ? 'page' : undefined}
                            className={`${row} aria-[current=page]:text-primary`}
                            href={item.href}
                            variant="unstyled"
                            onClick={close}
                          >
                            {item.label}
                          </Link>
                        )
                      )}
                    </li>
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

                {/* `mt-auto` holds these to the foot of a tall screen, and lets
                    them follow the list on a short one. */}
                <div className="mt-auto flex flex-col items-center gap-1 px-6 pt-12">
                  {socialLinks.length > 0 && (
                    <div className="flex">
                      {socialLinks.map((social) => (
                        <SocialIcon
                          key={social.platform}
                          className="touch-target"
                          href={social.href}
                          platform={social.platform}
                        />
                      ))}
                    </div>
                  )}

                  {/* Inline rather than `LanguageDropdown`: that one portals
                      its list, and the trap has everything outside the panel
                      inert. */}
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
                            aria-current={language.code === currentLanguage ? 'true' : undefined}
                            className={subRow}
                            href={language.href}
                            locale={language.code}
                            variant="unstyled"
                            onClick={close}
                          >
                            <span lang={language.code}>{language.label}</span>
                            {language.code === currentLanguage && (
                              <Icon className="text-primary" icon={CheckIcon} size="xs" />
                            )}
                          </Link>
                        </li>
                      ))}
                    </Disclosure>
                  )}
                </div>
              </div>
            </FloatingFocusManager>
          </FloatingOverlay>
        </FloatingPortal>
      )}
    </>
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
        className={`${triggerClassName} cursor-pointer`}
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
