/**
 * PageTemplate - Template for rendering page content
 *
 * This template is used by both regular pages and preview pages to ensure
 * consistent page rendering. Following Atomic Design, templates represent
 * page layout structures.
 *
 * @example
 * <PageTemplate page={pageData} />
 */

import type { Page } from '../../server/cms-types'

export interface PageTemplateProps {
  /**
   * Page data from PayloadCMS
   */
  page: Page
}

export function PageTemplate({ page }: PageTemplateProps) {
  return (
    <article className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-5xl font-bold mb-4">{page.title}</h1>
        {page.createdAt && (
          <time className="text-sm text-gray-500">
            Published: {new Date(page.createdAt).toLocaleDateString()}
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
    </article>
  )
}
