import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Globe, ArrowRight, Zap, TrendingUp, Clock } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: recentSites }] = await Promise.all([
    supabase.from("profiles").select("credits").eq("id", user?.id ?? "").single(),
    supabase
      .from("generated_sites")
      .select("*")
      .eq("user_id", user?.id ?? "")
      .order("created_at", { ascending: false })
      .limit(3),
  ])

  const credits = profile?.credits ?? 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here&apos;s what&apos;s happening with your sites.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Credits */}
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="absolute top-0 right-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-primary/10 blur-2xl" />
          <CardHeader className="pb-2 relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available Credits</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <Zap className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold tabular-nums">{credits}</span>
              <span className="text-muted-foreground text-sm">credits</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">1 credit = 1 website</p>
            {credits === 0 ? (
              <Link href="/billing" className="block mt-3">
                <Button size="sm" className="w-full">Buy Credits</Button>
              </Link>
            ) : (
              <div className="mt-3 h-1.5 w-full rounded-full bg-primary/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                  style={{ width: `${Math.min(credits * 10, 100)}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Generate */}
        <Card className="relative overflow-hidden border-border/60 hover:border-primary/30 transition-colors group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2 relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Generate Website</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted border border-border/60">
                <Sparkles className="h-4 w-4 text-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-3">
            <p className="text-sm text-muted-foreground">Create a new AI-powered website in under 30 seconds</p>
            <Link href="/generate">
              <Button className="w-full group-hover:shadow-md transition-all" disabled={credits < 1}>
                Start Building
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Total Sites */}
        <Card className="relative overflow-hidden border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sites</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted border border-border/60">
                <Globe className="h-4 w-4 text-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold tabular-nums">{recentSites?.length ?? 0}</span>
              <span className="text-muted-foreground text-sm">sites</span>
            </div>
            <Link href="/sites">
              <Button variant="ghost" size="sm" className="h-auto p-0 text-primary hover:text-primary/80 font-medium text-sm">
                View all sites
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sites */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Recent Sites</h2>
          </div>
          <Link href="/sites">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {recentSites && recentSites.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentSites.map((site) => (
              <Card key={site.id} className="group hover:shadow-md hover:border-primary/20 transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{site.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {site.description}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[10px] capitalize">
                      {site.style}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(site.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <Link href={`/preview/${site.preview_slug}`} target="_blank">
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary hover:text-primary/80">
                        Preview
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <div className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 border border-border/60">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No sites yet</h3>
              <p className="text-muted-foreground text-sm mt-1 mb-5">
                Generate your first AI-powered website in under 30 seconds.
              </p>
              <Link href="/generate">
                <Button>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Your First Website
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
