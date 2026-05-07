import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Globe, ArrowRight, Zap } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user profile with credits
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user?.id)
    .single()

  // Get recent sites
  const { data: recentSites } = await supabase
    .from("generated_sites")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(3)

  const credits = profile?.credits ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here is an overview of your account.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Credits Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Available Credits</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{credits}</span>
              <span className="text-muted-foreground">credits</span>
            </div>
            {credits === 0 && (
              <Link href="/billing">
                <Button variant="outline" size="sm" className="mt-4">
                  Buy Credits
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Quick Generate Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Generate Website</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
            </div>
            <CardDescription>
              Create a new AI-powered website
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <Link href="/generate">
              <Button className="w-full">
                Start Generating
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Sites Count Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Your Sites</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Globe className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{recentSites?.length ?? 0}</span>
              <span className="text-muted-foreground">sites created</span>
            </div>
            <Link href="/sites">
              <Button variant="link" className="p-0 h-auto mt-2">
                View all sites
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sites */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Sites</h2>
          <Link href="/sites">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {recentSites && recentSites.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentSites.map((site) => (
              <Card key={site.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{site.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {site.description}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {site.style}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{new Date(site.created_at).toLocaleDateString()}</span>
                    <Link href={`/preview/${site.preview_slug}`}>
                      <Button variant="ghost" size="sm" className="h-7">
                        Preview
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No sites yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Generate your first AI-powered website
            </p>
            <Link href="/generate">
              <Button>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Website
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
