import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const adminClient = createAdminClient()

    const { data: site, error } = await adminClient
      .from("generated_sites")
      .select("html_code")
      .eq("preview_slug", slug)
      .single()

    if (error || !site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    return new NextResponse(site.html_code, {
      headers: {
        "Content-Type": "text/html",
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Security-Policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.gstatic.com https://picsum.photos; img-src * data: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://picsum.photos;",
      },
    })
  } catch (error) {
    console.error("Preview error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
