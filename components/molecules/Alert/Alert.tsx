import { ComponentProps, ReactNode } from 'react'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { Icon, type HeroIcon } from '../../atoms/Icon'

export type AlertVariant = 'info' | 'success' | 'warning' | 'error'

export interface AlertProps extends Omit<ComponentProps<'div'>, 'title'> {
  /**
   * Semantic style of the alert.
   * @default 'info'
   */
  variant?: AlertVariant

  /**
   * Optional bold heading shown above the message.
   */
  title?: ReactNode

  /**
   * Override the default variant icon (a Heroicon component).
   */
  icon?: HeroIcon

  /**
   * When provided, renders a dismiss button that calls this handler. The Alert
   * stays presentational — the caller controls visibility.
   */
  onDismiss?: () => void

  /**
   * Alert message.
   */
  children: ReactNode
}

const VARIANT_STYLES: Record<AlertVariant, { container: string; icon: HeroIcon }> = {
  info: { container: 'bg-teal-50 border-teal-200 text-teal-800', icon: InformationCircleIcon },
  success: { container: 'bg-green-50 border-green-200 text-green-800', icon: CheckCircleIcon },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: ExclamationTriangleIcon,
  },
  error: { container: 'bg-red-50 border-red-200 text-red-800', icon: XCircleIcon },
}

/**
 * Alert displays a contextual message with a semantic icon and color.
 *
 * Combines the Icon atom with a message (and optional title / dismiss button)
 * into a single inline notice. Presentational only — dismissal is delegated to
 * the caller via `onDismiss`, so the component stays SSR-safe and stateless.
 *
 * @example
 * <Alert variant="warning" title="Heads up">Something needs attention.</Alert>
 * <Alert variant="error" onDismiss={() => setOpen(false)}>Request failed.</Alert>
 */
export function Alert({
  variant = 'info',
  title,
  icon,
  onDismiss,
  className = '',
  children,
  ...props
}: AlertProps) {
  const styles = VARIANT_STYLES[variant]
  const IconComponent = icon ?? styles.icon

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 ${styles.container} ${className}`}
      role="alert"
      {...props}
    >
      <Icon
        aria-hidden
        className="mt-0.5 shrink-0"
        color="currentColor"
        icon={IconComponent}
        size="md"
      />
      <div className="min-w-0 flex-1 text-sm">
        {title ? <p className="mb-1 font-semibold">{title}</p> : null}
        <div className="font-light leading-relaxed">{children}</div>
      </div>
      {onDismiss ? (
        <button
          aria-label="Dismiss"
          className="shrink-0 rounded transition-opacity hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-current"
          type="button"
          onClick={onDismiss}
        >
          <Icon color="currentColor" icon={XMarkIcon} size="sm" />
        </button>
      ) : null}
    </div>
  )
}
