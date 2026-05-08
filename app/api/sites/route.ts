import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: sites, error } = await supabase
      .from("generated_sites")
      .select("id, name, description, style, preview_slug, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ sites })
  } catch (error) {
    console.error("Sites fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug, html_code } = await request.json()

    if (!slug || !html_code) {
      return NextResponse.json({ error: "Missing slug or html_code" }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from("generated_sites")
      .update({ html_code })
      .eq("preview_slug", slug)
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: "Failed to save" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
