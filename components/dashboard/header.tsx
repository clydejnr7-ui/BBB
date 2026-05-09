"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LogOut, Settings, User as UserIcon, Zap } from "lucide-react"
import { toast } from "sonner"
import type { User } from "@supabase/supabase-js"
import Link from "next/link"

interface DashboardHeaderProps {
  user: User
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [credits, setCredits] = useState<number | null>(null)

  const initials = user.email
    ?.split("@")[0]
    .slice(0, 2)
    .toUpperCase() || "U"

  useEffect(() => {
    async function fetchCredits() {
      const { data } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single()
      setCredits(data?.credits ?? 0)
    }
    fetchCredits()
  }, [user.id, supabase])

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error("Error signing out")
      return
    }
    router.push("/")
    router.refresh()
  }

  return (
    <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex-1" />

        <div className="flex items-center gap-3">
          {/* Credits badge */}
          {credits !== null && (
            <Link href="/billing">
              <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors px-3 py-1.5 cursor-pointer">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-xs font-semibold text-primary">
                  {credits} {credits === 1 ? "credit" : "credits"}
                </span>
              </div>
            </Link>
          )}

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-1 ring-border hover:ring-primary/30 transition-all">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">My Account</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {credits !== null && (
                <>
                  <div className="px-2 py-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Credits remaining</span>
                      <Badge variant="secondary" className="text-xs h-5">
                        {credits}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => router.push("/account")}>
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/billing")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings & Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
