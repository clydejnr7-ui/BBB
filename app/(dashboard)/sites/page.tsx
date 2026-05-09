import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ExternalLink, Calendar } from "lucide-react"
import { DeleteSiteButton } from "@/components/dashboard/delete-site-button"
import { DomainManager } from "@/components/dashboard/domain-manager"

export default async function SitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sites } = await supabase
    .from("generated_sites")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Sites</h1>
          <p className="text-muted-foreground mt-1">
            {sites?.length
              ? `${sites.length} site${sites.length !== 1 ? "s" : ""} generated`
              : "View and manage all your generated websites."}
          </p>
        </div>
        <Link href="/generate">
          <Button className="shadow-md shadow-primary/20">
            <Sparkles className="mr-2 h-4 w-4" />
            New Website
          </Button>
        </Link>
      </div>

      {sites && sites.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Card
              key={site.id}
              className="group flex flex-col hover:shadow-md hover:border-primary/20 transition-all duration-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{site.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {site.description}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 capitalize text-[10px]">
                    {site.style}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-end space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(site.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Custom domain manager */}
                <DomainManager
                  siteId={site.id}
                  initialDomain={site.custom_domain ?? null}
                  initialVerified={site.domain_verified ?? false}
                />

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={`/preview/${site.preview_slug}`}
                    target="_blank"
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                      <ExternalLink className="h-3 w-3" />
                      Preview
                    </Button>
                  </Link>
                  <DeleteSiteButton siteId={site.id} siteName={site.name} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <div className="p-16 text-center">
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
                Generate Website
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
