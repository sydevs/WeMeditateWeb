import { PageContext } from 'vike/types'

export async function onPageTransitionStart(pageContext: PageContext) {
  console.log('Page transition start')
  console.log('Is backwards navigation?', pageContext.isBackwardNavigation)
  document.body.classList.add('page-transition')
}
