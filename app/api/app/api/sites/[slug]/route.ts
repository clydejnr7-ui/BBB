import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { slug } = await params
    const { html_code } = await request.json()

    if (!html_code) return NextResponse.json({ error: "Missing html_code" }, { status: 400 })

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from("generated_sites")
      .update({ html_code })
      .eq("preview_slug", slug)
      .eq("user_id", user.id)

    if (error) return NextResponse.json({ error: "Failed to save" }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
