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
  Plus,
  Zap,
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
    <aside className="hidden md:flex w-64 flex-col border-r border-border/50 bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border/50 px-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-primary/30 blur-md group-hover:blur-lg transition-all" />
            <Image
              src="https://i.8upload.com/image/51e2eb5f6dbfb126/photo-2026-05-08-21-05-11.webp"
              alt="PNG Website Builders"
              width={36}
              height={36}
              className="relative rounded-xl object-contain"
            />
          </div>
          <div>
            <span className="text-sm font-bold leading-none tracking-tight">PNG Website</span>
            <span className="block text-xs text-muted-foreground leading-none mt-0.5">Builders</span>
          </div>
        </Link>
      </div>

      {/* New Website CTA */}
      <div className="px-3 pt-4 pb-2">
        <Link href="/generate">
          <Button className="w-full justify-start gap-2.5 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
            <Plus className="h-4 w-4" />
            New Website
            <Sparkles className="ml-auto h-3 w-3 opacity-60" />
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-3 py-2">
          Menu
        </p>
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "text-primary bg-primary/10 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.15)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" />
              )}
              <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "")} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom upgrade card */}
      <div className="p-3 border-t border-border/50">
        <div className="rounded-xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
              <Zap className="h-3 w-3 text-primary" />
            </div>
            <p className="text-sm font-semibold">Need more credits?</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Unlock unlimited AI generations with a Pro plan.
          </p>
          <Link href="/billing">
            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs font-semibold shadow-sm"
            >
              Upgrade Plan
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  )
}
