import { ReactNode } from "hono/jsx";
import { usePageContext } from "vike-react/usePageContext";

export type LinkProps = {
  href: string,
  locale?: string,
  children: ReactNode,
}

export function Link({ href, locale, ...props }: LinkProps) {
  const pageContext = usePageContext()
  locale = (locale ?? pageContext.locale) || 'en'

  if (locale !== 'en') {
    href = '/' + locale + href
  }

  return <a href={href} {...props} />
}
