"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Database, Settings, FileSpreadsheet } from "lucide-react"

const links = [
  { href: "/dashboard", label: "Dashboard",     icon: LayoutDashboard },
  { href: "/customers", label: "Customers",     icon: Users },
  { href: "/export",    label: "QB Export",      icon: FileSpreadsheet },
  { href: "/reference", label: "Reference Data", icon: Database },
  { href: "/admin",     label: "Admin",          icon: Settings },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-background flex flex-col h-full">
      <div className="px-5 py-5 border-b border-border">
        <span className="text-base font-semibold tracking-tight">QuickQB</span>
      </div>
      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
