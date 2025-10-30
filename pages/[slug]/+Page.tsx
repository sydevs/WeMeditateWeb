/**
 * Page component for default locale (English) pages.
 */

import { useData } from 'vike-react/useData'
import { PageData } from './+data'

export function Page() {
  // const { page, locale, slug } = useData<PageData>()
  const { locale, slug } = useData<PageData>()

  return <div>{slug} in {locale}</div>

  return (
    <div className="min-h-screen py-12 px-4">
      <article className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{page.title}</h1>
          {page.publishedAt && (
            <time className="text-sm text-gray-500">
              Published: {new Date(page.publishedAt).toLocaleDateString()}
            </time>
          )}
        </header>

        {/* Render page content */}
        {page.content ? (
          <div className="prose prose-lg max-w-none">
            {/* TODO: Implement rich text renderer for PayloadCMS content */}
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {String(JSON.stringify(page.content, null, 2))}
            </pre>
          </div>
        ) : null}

        {/* Debug info */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            Locale: {locale} | Slug: {slug} | ID: {page.id}
          </p>
        </div>
      </article>
    </div>
  )
}
