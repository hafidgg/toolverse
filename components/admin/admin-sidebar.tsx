"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Wrench, FolderTree, Building2, Tags, Layers,
  FileText, Search, Image as ImageIcon, Mail, BarChart3, Route, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/tools", label: "Tools", icon: Wrench },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/subcategories", label: "Subcategories", icon: FolderTree },
  { href: "/admin/companies", label: "Companies", icon: Building2 },
  { href: "/admin/tags", label: "Tags", icon: Tags },
  { href: "/admin/collections", label: "Collections", icon: Layers },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/seo", label: "SEO", icon: Search },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/redirects", label: "Redirects", icon: Route },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-muted/20 lg:block">
      <div className="flex h-16 items-center border-b px-5 font-bold">ToolVerse Admin</div>
      <nav className="space-y-0.5 p-3">
        {NAV_ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
