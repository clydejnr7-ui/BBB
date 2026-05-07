import { createClient } from "@/lib/supabase/server"
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

    if (error) {
      throw error
    }

    return NextResponse.json({ sites })
  } catch (error) {
    console.error("Sites fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
