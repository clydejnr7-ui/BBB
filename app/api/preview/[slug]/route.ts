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

    // Inject a tiny fix-nav style before </head> to guarantee the nav is always on top
    const fixedNavStyle = `<style>
nav[style*="position:fixed"],nav[style*="position: fixed"]{z-index:9999!important;isolation:auto!important;}
section:first-of-type,div[style*="height:100vh"],div[style*="height: 100vh"]{transform:none!important;filter:none!important;will-change:auto!important;}
html{scroll-padding-top:80px;}
</style>`

    const html = site.html_code.includes("</head>")
      ? site.html_code.replace("</head>", fixedNavStyle + "</head>")
      : site.html_code

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Security-Policy": [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "https://cdn.tailwindcss.com",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com",
          "https://fonts.gstatic.com",
          "https://picsum.photos",
          "https://images.pexels.com",
          "https://cdn.pixabay.com",
          "https://pixabay.com",
          "https://live.staticflickr.com",
          "https://upload.wikimedia.org",
          "https://openverse.org",
          "; img-src * data: blob:",
          "; font-src 'self' https://fonts.gstatic.com data:",
          "; connect-src 'self' https://picsum.photos https://images.pexels.com https://cdn.pixabay.com",
        ].join(" "),
      },
    })
  } catch (error) {
    console.error("Preview error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
