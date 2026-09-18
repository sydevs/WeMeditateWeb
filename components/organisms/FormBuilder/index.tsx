import React from 'react'
import { ClientOnly } from 'vike-react/ClientOnly'
import type { FormBuilderProps } from './FormBuilder'

const FormBuilderLazy = React.lazy(() =>
  import('./FormBuilder').then((mod) => ({ default: mod.FormBuilder }))
)

/**
 * The SSR-and-hydration fallback: the form's heading over a reserved box.
 *
 * The heading is real content and costs nothing to render here, so a crawler
 * and a reader on a slow connection both see what the form is for. The box
 * holds roughly a form's height so hydration does not shove the rest of the
 * article down the page.
 *
 * The heading classes are copied from `FormBuilder`, deliberately: importing
 * it here is the one thing this wrapper exists to avoid.
 */
function FormBuilderFallback({ title, className }: { title?: string; className?: string }) {
  return (
    <div className={className}>
      {title && (
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 sm:mb-8 text-left">
          {title}
        </h2>
      )}
      <div className="h-64 w-full animate-pulse rounded-lg bg-gray-100" />
    </div>
  )
}

/**
 * Client-only wrapper around the authored CMS form.
 *
 * ⚠ **`RichText` renders on every page, so a static import here is a static
 * import everywhere.** Reaching `FormBuilder` from the rich-text converter put
 * `react-hook-form` (~29 kB minified) plus the resolver into the eager chunk of
 * every route — the embed routes included — and into the Worker bundle, for a
 * component almost no page contains. Following the `VideoPlayer` and
 * `LocationSearch` pattern, `ClientOnly` plus `React.lazy` keeps the whole
 * form out of the SSR graph and code-splits it in the browser, so only a page
 * that embeds a form pays for it.
 *
 * Nothing is lost by not server-rendering it: the form submits through
 * `fetch`, so it never worked without JavaScript, and its heading still
 * renders in the fallback.
 */
export function FormBuilder(props: FormBuilderProps) {
  // A form with no fields renders nothing, the way every other embedded
  // document degrades rather than showing an empty shell. Deciding it here
  // keeps the rule true on the server, rather than only after hydration.
  if ((props.form.fields ?? []).length === 0) {
    return null
  }

  return (
    <ClientOnly
      fallback={<FormBuilderFallback className={props.className} title={props.form.title} />}
    >
      <FormBuilderLazy {...props} />
    </ClientOnly>
  )
}

export type { FormBuilderProps } from './FormBuilder'
