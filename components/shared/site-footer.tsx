import Link from "next/link";

const FOOTER_SECTIONS = [
  {
    title: "Explore",
    links: [
      { href: "/tools", label: "All Tools" },
      { href: "/categories", label: "Categories" },
      { href: "/collections", label: "Collections" },
      { href: "/compare", label: "Compare Tools" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/cookies", label: "Cookie Policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="font-bold text-lg">ToolVerse</Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            The directory for discovering, comparing, and choosing the right digital tools.
          </p>
        </div>
        {FOOTER_SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-semibold">{section.title}</h3>
            <ul className="mt-3 space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t py-6">
        <p className="container text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ToolVerse. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
