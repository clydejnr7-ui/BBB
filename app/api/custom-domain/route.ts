import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const host = request.headers.get("host") || ""
    const domain = host.split(":")[0].toLowerCase()

    if (!domain) {
      return new NextResponse("Domain not found", { status: 404 })
    }

    const adminClient = createAdminClient()
    const { data: site } = await adminClient
      .from("generated_sites")
      .select("html_code, name")
      .eq("custom_domain", domain)
      .single()

    if (!site) {
      return new NextResponse(
        `<!DOCTYPE html><html><head><title>Site Not Found</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0a0a0f;color:#fff;flex-direction:column;gap:1rem">
<h1 style="font-size:2rem">🌐 Domain Not Connected</h1>
<p style="color:#94a3b8">No site is connected to <strong>${domain}</strong> yet.</p>
<a href="https://pngwebsitebuilders.site" style="color:#6366f1;text-decoration:none;font-weight:600">Create one at PNG Website Builders →</a>
</body></html>`,
        { status: 404, headers: { "Content-Type": "text/html" } }
      )
    }

    const fixedNavStyle = `<style>
nav[style*="position:fixed"],nav[style*="position: fixed"]{z-index:9999!important;}
html{scroll-padding-top:80px;}
</style>`
    const html = site.html_code.includes("</head>")
      ? site.html_code.replace("</head>", fixedNavStyle + "</head>")
      : site.html_code

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        "Content-Security-Policy": [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "https://cdn.tailwindcss.com https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com https://fonts.gstatic.com",
          "; img-src * data: blob:",
          "; font-src 'self' https://fonts.gstatic.com data:",
          "; connect-src *",
        ].join(" "),
      },
    })
  } catch {
    return new NextResponse("Internal server error", { status: 500 })
  }
}
