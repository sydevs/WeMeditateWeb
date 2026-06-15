/**
 * Page component for default locale (English) pages.
 */

import { useData } from 'vike-react/useData'
import { PageData } from './+data'
import { PageTemplate } from '../../components/templates'

export function Page() {
  const { page } = useData<PageData>()

  return (
    <div className="min-h-screen py-12 px-4">
      <PageTemplate page={page} />
    </div>
  )
}
