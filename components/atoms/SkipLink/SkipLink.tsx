import { Link } from '../Link'
import { useT } from '../../../hooks/useT'
import { MAIN_CONTENT_ID } from '../../../lib/route-announcer'

/**
 * The link a keyboard reaches first on every page, jumping past the menus to
 * the page's own content (WCAG 2.1 2.4.1).
 *
 * It must be the first child of a layout's root element: a screen reader and a
 * keyboard both reach it in DOM order, which paint order does not change.
 *
 * Hidden until it takes focus, then drawn over the chrome. `fixed` rather than
 * `absolute` because the two layouts give it different containing blocks and
 * `LayoutMap`'s root clips overflow; `z-60` because the sticky nav sits at
 * `z-50` and is painted later. The focused padding stands in for
 * `touch-target`, whose `min-height` would fight `sr-only`'s 1px box.
 */
export function SkipLink() {
  const t = useT()

  return (
    <Link
      href={`#${MAIN_CONTENT_ID}`}
      variant="unstyled"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-60 focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:text-primary focus:shadow-lg"
    >
      {t('common.general.skip_to_main')}
    </Link>
  )
}
