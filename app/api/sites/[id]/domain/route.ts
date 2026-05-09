import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

interface Params {
  params: Promise<{ id: string }>
}

function normalizeDomain(raw: string): string {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "")
}

function isValidDomain(domain: string): boolean {
  return /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(domain)
}

export async function POST(request: Request, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const domain = normalizeDomain(body.domain || "")

    if (!domain) return NextResponse.json({ error: "Domain is required" }, { status: 400 })
    if (!isValidDomain(domain))
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 })

    const adminClient = createAdminClient()

    // Check the site belongs to this user
    const { data: site } = await adminClient
      .from("generated_sites").select("id, user_id").eq("id", id).single()
    if (!site || site.user_id !== user.id)
      return NextResponse.json({ error: "Site not found" }, { status: 404 })

    // Check domain not already used by another site
    const { data: existing } = await adminClient
      .from("generated_sites").select("id").eq("custom_domain", domain).single()
    if (existing && existing.id !== id)
      return NextResponse.json({ error: "Domain already in use by another site" }, { status: 409 })

    const { error } = await adminClient
      .from("generated_sites")
      .update({ custom_domain: domain, domain_verified: false })
      .eq("id", id)

    if (error) return NextResponse.json({ error: "Failed to save domain" }, { status: 500 })
    return NextResponse.json({ success: true, domain })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const adminClient = createAdminClient()

    const { data: site } = await adminClient
      .from("generated_sites").select("id, user_id").eq("id", id).single()
    if (!site || site.user_id !== user.id)
      return NextResponse.json({ error: "Site not found" }, { status: 404 })

    const { error } = await adminClient
      .from("generated_sites")
      .update({ custom_domain: null, domain_verified: false })
      .eq("id", id)

    if (error) return NextResponse.json({ error: "Failed to remove domain" }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const adminClient = createAdminClient()

    const { data: site } = await adminClient
      .from("generated_sites")
      .select("custom_domain, domain_verified")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 })
    return NextResponse.json({ domain: site.custom_domain, verified: site.domain_verified })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
