import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { promises as dns } from "dns"

interface Params {
  params: Promise<{ id: string }>
}

const MAIN_DOMAIN = "pngwebsitebuilders.site"

async function checkCname(domain: string): Promise<boolean> {
  try {
    const addresses = await dns.resolveCname(domain)
    return addresses.some(a => a.includes(MAIN_DOMAIN) || a.includes("vercel"))
  } catch {
    return false
  }
}

async function checkA(domain: string): Promise<boolean> {
  try {
    const mainIps = await dns.resolve4(MAIN_DOMAIN).catch(() => [] as string[])
    const domainIps = await dns.resolve4(domain).catch(() => [] as string[])
    return mainIps.some(ip => domainIps.includes(ip))
  } catch {
    return false
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const adminClient = createAdminClient()

    const { data: site } = await adminClient
      .from("generated_sites")
      .select("id, user_id, custom_domain")
      .eq("id", id)
      .single()

    if (!site || site.user_id !== user.id)
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    if (!site.custom_domain)
      return NextResponse.json({ error: "No custom domain set" }, { status: 400 })

    const domain = site.custom_domain
    const cnameOk = await checkCname(domain)
    const aOk = !cnameOk && await checkA(domain)
    const verified = cnameOk || aOk

    if (verified) {
      await adminClient
        .from("generated_sites")
        .update({ domain_verified: true })
        .eq("id", id)
    }

    return NextResponse.json({
      verified,
      domain,
      method: cnameOk ? "CNAME" : aOk ? "A record" : null,
      message: verified
        ? `Domain verified via ${cnameOk ? "CNAME" : "A record"}!`
        : "DNS not pointing to this server yet. Check your DNS settings and try again in a few minutes.",
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
