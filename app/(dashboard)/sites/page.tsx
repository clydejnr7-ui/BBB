import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ExternalLink, Trash2 } from "lucide-react"
import { DeleteSiteButton } from "@/components/dashboard/delete-site-button"

export default async function SitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sites } = await supabase
    .from("generated_sites")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Sites</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your generated websites.
          </p>
        </div>
        <Link href="/generate">
          <Button>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate New
          </Button>
        </Link>
      </div>

      {sites && sites.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Card key={site.id} className="group flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate">{site.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {site.description}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {site.style}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end">
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-3">
                    Created {new Date(site.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <Link href={`/preview/${site.preview_slug}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="mr-2 h-3 w-3" />
                        Preview
                      </Button>
                    </Link>
                    <DeleteSiteButton siteId={site.id} siteName={site.name} />
                  </div>
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
            Generate your first AI-powered website to get started.
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
  )
}
