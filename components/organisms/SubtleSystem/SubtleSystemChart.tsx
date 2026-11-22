import type { Ref } from 'react'
import chartSvg from '@/assets/chart.svg?raw'

/**
 * The subtle-system drawing, inlined rather than an `<img>` so `SubtleSystem`
 * can reach its nodes.
 *
 * It is a module of its own, reached only through `React.lazy`: the markup is
 * ~325 KB, and a static import would put it in the RichText chunk every page loads.
 */
export function SubtleSystemChart({ ref }: { ref?: Ref<HTMLDivElement> }) {
  return <div dangerouslySetInnerHTML={{ __html: chartSvg }} ref={ref} />
}
