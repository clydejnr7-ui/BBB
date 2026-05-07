import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Zap, Globe, Calendar, ArrowRight } from "lucide-react"

export default async function UsagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits, created_at")
    .eq("id", user?.id)
    .single()

  // Get sites count
  const { count: sitesCount } = await supabase
    .from("generated_sites")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id)

  // Get total credits used
  const { data: creditsUsed } = await supabase
    .from("generated_sites")
    .select("credits_used")
    .eq("user_id", user?.id)

  const totalCreditsUsed = creditsUsed?.reduce((sum, site) => sum + site.credits_used, 0) ?? 0
  const currentCredits = profile?.credits ?? 0
  const totalCredits = currentCredits + totalCreditsUsed

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usage</h1>
        <p className="text-muted-foreground mt-1">
          Track your credit usage and generation history.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Credits Overview */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Available Credits</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentCredits}</div>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Used</span>
                <span>{totalCreditsUsed} of {totalCredits}</span>
              </div>
              <Progress 
                value={totalCredits > 0 ? (totalCreditsUsed / totalCredits) * 100 : 0} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Sites Created */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Sites Created</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{sitesCount ?? 0}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Total websites generated
            </p>
          </CardContent>
        </Card>

        {/* Member Since */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Member Since</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {profile?.created_at 
                ? new Date(profile.created_at).toLocaleDateString("en-US", { 
                    month: "short", 
                    year: "numeric" 
                  })
                : "N/A"
              }
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Account creation date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Credits Usage Info */}
      <Card>
        <CardHeader>
          <CardTitle>How Credits Work</CardTitle>
          <CardDescription>
            Each website generation uses 1 credit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-2">Free Credits</h4>
              <p className="text-sm text-muted-foreground">
                New users receive 3 free credits to try the platform. These credits never expire.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-2">Purchased Credits</h4>
              <p className="text-sm text-muted-foreground">
                Buy additional credits anytime. Credits are non-refundable and never expire.
              </p>
            </div>
          </div>

          {currentCredits === 0 && (
            <div className="rounded-lg bg-muted p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Out of credits?</p>
                <p className="text-sm text-muted-foreground">
                  Purchase more credits to continue generating websites.
                </p>
              </div>
              <Link href="/billing">
                <Button>
                  Buy Credits
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
