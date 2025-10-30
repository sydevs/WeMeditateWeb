import { PageContext } from 'vike/types'

export async function onPageTransitionEnd(pageContext: PageContext) {
  console.log('Page transition end')
  console.log('Is backwards navigation?', pageContext.isBackwardNavigation)
  document.body.classList.remove('page-transition')
}
