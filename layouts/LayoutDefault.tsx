import "./style.css";

import "./tailwind.css";
import logoUrl from "../assets/logo.svg";
import { Link } from "../components/Link.js";
import { useData } from "vike-react/useData";
import { WeMeditateWebSettings } from "../server/graphql-types";

export default function LayoutDefault({ children }: { children: React.ReactNode }) {
  const data = useData<{ settings?: WeMeditateWebSettings }>()
  const settings = data?.settings

  const navigationPages = [
    settings?.homePage,
    settings?.techniquesPage,
    settings?.musicPage,
    settings?.inspirationPage,
    settings?.classesPage,
  ].filter(Boolean)

  return (
    <div className={"flex max-w-5xl m-auto"}>
      <Sidebar>
        <Logo />
        {navigationPages.map(page => {
          if (!page) return null
          return <Link key={page.id} href={'/' + page.slug}>{page.title}</Link>
        })}
      </Sidebar>
      <Content>{children}</Content>
    </div>
  );
}

function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <div id="sidebar" className={"p-5 flex flex-col shrink-0 border-r-2 border-r-gray-200"}>
      {children}
    </div>
  );
}

function Content({ children }: { children: React.ReactNode }) {
  return (
    <div id="page-container">
      <div id="page-content" className={"p-5 pb-12 min-h-screen"}>
        {children}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className={"p-5 mb-2"}>
      <a href="/">
        <img src={logoUrl} height={64} width={64} alt="logo" />
      </a>
    </div>
  );
}
