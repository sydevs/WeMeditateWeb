/**
 * Preview Banner Component
 *
 * Yellow fixed banner indicating live preview mode with collection and locale info.
 */

export interface PreviewBannerProps {
  collection: string
  locale: string
}

export function PreviewBanner({ collection, locale }: PreviewBannerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-black px-4 py-3 flex justify-between items-center z-50 shadow-md">
      <div className="flex items-center gap-3">
        <span className="text-xl">👁️</span>
        <div>
          <p className="font-bold text-sm">Live Preview Mode</p>
          <p className="text-xs opacity-75">
            Viewing draft {collection} in {locale.toUpperCase()} • Changes update in real-time
          </p>
        </div>
      </div>
    </div>
  )
}
