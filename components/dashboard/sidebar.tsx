"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  LayoutDashboard,
  Globe,
  BarChart3,
  CreditCard,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Generate", href: "/generate", icon: Sparkles },
  { name: "My Sites", href: "/sites", icon: Globe },
  { name: "Usage", href: "/usage", icon: BarChart3 },
  { name: "Billing", href: "/billing", icon: CreditCard },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="https://i.8upload.com/image/51e2eb5f6dbfb126/photo-2026-05-08-21-05-11.webp"
            alt="PNG Website Builders"
            width={48}
            height={48}
            className="rounded-lg object-contain"
          />
          <span className="text-xl font-bold">PNG Website Builders</span>
        </Link>
      </div>

      <div className="flex-1 py-4 px-3">
        <Link href="/generate">
          <Button className="w-full justify-start gap-2 mb-4">
            <Plus className="h-4 w-4" />
            New Website
          </Button>
        </Link>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-3 border-t">
        <div className="rounded-lg bg-sidebar-accent/50 p-4">
          <p className="text-sm font-medium">Need more credits?</p>
          <p className="text-xs text-muted-foreground mt-1">
            Upgrade your plan to generate more websites.
          </p>
          <Link href="/billing">
            <Button variant="secondary" size="sm" className="w-full mt-3">
              View Plans
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  )
}
