/**
 * Live Preview Page for PayloadCMS
 *
 * This page displays live preview of draft content from PayloadCMS.
 * It uses window.postMessage to receive real-time updates as editors make changes.
 *
 * URL Parameters from PayloadCMS:
 * - collection: The collection name (e.g., "pages")
 * - id: Document ID
 * - locale: Content locale (optional, defaults to 'en')
 */

'use client'

import { useData } from 'vike-react/useData'
import { useLivePreview } from '@payloadcms/live-preview-react'
import { PreviewPageData } from './+data'
import { Page as PageData } from '../../server/graphql-types'

export { Page }

function Page() {
  const { initialData, locale } = useData<PreviewPageData>()

  // useLivePreview listens for postMessage events from PayloadCMS admin
  // and updates the data in real-time as editors make changes
  const { data } = useLivePreview<PageData>({
    initialData,
    serverURL: import.meta.env.PUBLIC__PAYLOAD_URL,
    depth: 2, // Populate relationships and uploads to 2 levels deep
  })

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Loading preview...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Preview Banner */}
      <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-black px-4 py-3 flex justify-between items-center z-50 shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-xl">👁️</span>
          <div>
            <p className="font-bold text-sm">Live Preview Mode</p>
            <p className="text-xs opacity-75">
              Viewing draft content in {locale.toUpperCase()} • Changes update in real-time
            </p>
          </div>
        </div>
      </div>

      {/* Content with top padding to account for fixed banner */}
      <div className="pt-20 min-h-screen py-12 px-4">
        <article className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-5xl font-bold mb-4">{data.title}</h1>
            {data.publishAt && (
              <time className="text-sm text-gray-500">
                Published: {new Date(data.publishAt).toLocaleDateString()}
              </time>
            )}
          </header>

          {/* Render page content */}
          {data.content ? (
            <div className="prose prose-lg max-w-none">
              {/* TODO: Implement rich text renderer for PayloadCMS content */}
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {String(JSON.stringify(data.content, null, 2))}
              </pre>
            </div>
          ) : null}

          {/* Debug info */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              Preview ID: {data.id} | Locale: {locale}
            </p>
          </div>
        </article>
      </div>
    </>
  )
}
