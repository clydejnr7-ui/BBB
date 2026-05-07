import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single()

    return NextResponse.json({
      credits: profile?.credits ?? 0,
    })
  } catch (error) {
    console.error("Credits fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
