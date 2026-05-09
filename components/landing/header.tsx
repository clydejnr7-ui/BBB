"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { Menu, X, ArrowRight } from "lucide-react"

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Announcement bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-primary text-primary-foreground text-center py-2 px-3 text-xs font-medium flex items-center justify-center gap-1.5 flex-wrap">
        <span className="hidden sm:inline">🎉 Now powered by GPT-4o — smarter websites, faster generation</span>
        <span className="sm:hidden">🎉 Now powered by GPT-4o</span>
        <Link href="/auth/signup" className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:no-underline font-semibold whitespace-nowrap">
          Try free <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <header className="fixed top-8 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">

            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <Image
                src="https://i.8upload.com/image/51e2eb5f6dbfb126/photo-2026-05-08-21-05-11.webp"
                alt="PNG Website Builders"
                width={36}
                height={36}
                className="rounded-lg object-contain"
              />
              <span className="text-base sm:text-lg font-bold tracking-tight whitespace-nowrap">
               PNG Website Builders
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
              <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              <Link href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</Link>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="font-medium">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="glow font-semibold px-5">Get Started Free</Button>
              </Link>
            </div>

            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t bg-background/97 backdrop-blur-lg px-4 py-5 flex flex-col gap-2">
            {[
              { href: "#features", label: "Features" },
              { href: "#pricing", label: "Pricing" },
              { href: "#testimonials", label: "Testimonials" },
            ].map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2.5 border-b border-border/50 last:border-0"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3">
              <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link href="/auth/signup" onClick={() => setMobileOpen(false)}>
                <Button className="w-full glow font-semibold">Get Started Free</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Spacer for announcement bar + fixed header = 96px */}
      <div className="h-24" />
    </>
  )
}
