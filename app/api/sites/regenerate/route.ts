import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export const maxDuration = 60

const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"

const styleThemes: Record<string, {
  fonts: string; headingFont: string; bodyFont: string
  primary: string; primaryDark: string; accent: string
  bg: string; surface: string; text: string; textMuted: string
  gradient: string; heroOverlay: string; navBg: string
}> = {
  modern: {
    fonts: "Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700",
    headingFont: "'Space Grotesk', sans-serif", bodyFont: "'Inter', sans-serif",
    primary: "#6366f1", primaryDark: "#4f46e5", accent: "#f59e0b",
    bg: "#0a0a0f", surface: "#13131a", text: "#f8fafc", textMuted: "#94a3b8",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)",
    heroOverlay: "linear-gradient(to bottom, rgba(10,10,15,0.5) 0%, rgba(10,10,15,0.8) 100%)",
    navBg: "rgba(10,10,15,0.85)",
  },
  minimal: {
    fonts: "Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700",
    headingFont: "'Playfair Display', serif", bodyFont: "'Inter', sans-serif",
    primary: "#1a1a1a", primaryDark: "#000000", accent: "#c9a84c",
    bg: "#fafaf8", surface: "#ffffff", text: "#1a1a1a", textMuted: "#6b7280",
    gradient: "linear-gradient(135deg, #1a1a1a, #404040)",
    heroOverlay: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.65) 100%)",
    navBg: "rgba(250,250,248,0.92)",
  },
  startup: {
    fonts: "Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800",
    headingFont: "'Syne', sans-serif", bodyFont: "'Plus Jakarta Sans', sans-serif",
    primary: "#0ea5e9", primaryDark: "#0284c7", accent: "#10b981",
    bg: "#020617", surface: "#0f172a", text: "#f1f5f9", textMuted: "#64748b",
    gradient: "linear-gradient(135deg, #0ea5e9, #6366f1, #8b5cf6)",
    heroOverlay: "linear-gradient(to bottom, rgba(2,6,23,0.4) 0%, rgba(2,6,23,0.85) 100%)",
    navBg: "rgba(2,6,23,0.88)",
  },
  creative: {
    fonts: "DM+Sans:wght@300;400;500;700&family=Cormorant+Garamond:wght@400;500;600;700",
    headingFont: "'Cormorant Garamond', serif", bodyFont: "'DM Sans', sans-serif",
    primary: "#ec4899", primaryDark: "#be185d", accent: "#f97316",
    bg: "#0c0c0c", surface: "#1a1a1a", text: "#fafafa", textMuted: "#a1a1aa",
    gradient: "linear-gradient(135deg, #ec4899, #f97316, #eab308)",
    heroOverlay: "linear-gradient(to bottom, rgba(12,12,12,0.3) 0%, rgba(12,12,12,0.8) 100%)",
    navBg: "rgba(12,12,12,0.88)",
  },
  corporate: {
    fonts: "Nunito+Sans:wght@300;400;600;700;800&family=Merriweather:wght@400;700",
    headingFont: "'Merriweather', serif", bodyFont: "'Nunito Sans', sans-serif",
    primary: "#1e40af", primaryDark: "#1e3a8a", accent: "#0891b2",
    bg: "#f8fafc", surface: "#ffffff", text: "#0f172a", textMuted: "#475569",
    gradient: "linear-gradient(135deg, #1e40af, #1e3a8a)",
    heroOverlay: "linear-gradient(to bottom, rgba(15,23,42,0.5) 0%, rgba(15,23,42,0.75) 100%)",
    navBg: "rgba(248,250,252,0.95)",
  },
}

async function fixBrokenImages(html: string, slug: string): Promise<string> {
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*/g
  const matches = [...html.matchAll(imgRegex)]
  if (matches.length === 0) return html
  const uniqueUrls = [...new Set(matches.map(m => m[1]))]
  const checkUrl = async (url: string): Promise<{ url: string; ok: boolean }> => {
    if (url.includes("picsum.photos")) return { url, ok: true }
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 3000)
      const res = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" })
      clearTimeout(timer)
      return { url, ok: res.ok }
    } catch { return { url, ok: false } }
  }
  const results = await Promise.race([
    Promise.all(uniqueUrls.map(checkUrl)),
    new Promise<{ url: string; ok: boolean }[]>((resolve) => setTimeout(() => resolve(uniqueUrls.map(u => ({ url: u, ok: true }))), 5000)),
  ])
  const broken = new Set(results.filter(r => !r.ok).map(r => r.url))
  if (broken.size === 0) return html
  let fixed = html; let i = 0
  for (const url of broken) { fixed = fixed.split(url).join(`https://picsum.photos/seed/${slug}-fb${i}/800/600`); i++ }
  return fixed
}

function sanitizeGeneratedHtml(html: string, theme: typeof styleThemes[string]): string {
  let s = html
  const classFixes: [RegExp, string][] = [
    [/\btext-text-muted\b/g, "text-theme-muted"],[/\btext-muted\b/g, "text-theme-muted"],
    [/\btext-text\b/g, "text-theme-text"],[/\bbg-bg\b/g, "bg-theme-bg"],
    [/\bbg-muted\b/g, "bg-surface"],[/\bborder-muted\b/g, "border-surface"],
    [/\bhover:text-text-muted\b/g, "hover:text-theme-muted"],[/\bhover:text-muted\b/g, "hover:text-theme-muted"],
  ]
  for (const [pattern, replacement] of classFixes) s = s.replace(pattern, replacement)
  if (s.includes("cdn.tailwindcss.com") && !s.includes("tailwind.config")) {
    const config = `<script>\ntailwind.config={theme:{extend:{colors:{primary:'${theme.primary}','primary-dark':'${theme.primaryDark}',accent:'${theme.accent}',surface:'${theme.surface}','theme-bg':'${theme.bg}','theme-text':'${theme.text}','theme-muted':'${theme.textMuted}'}}}}\n</script>\n`
    s = s.replace('<script src="https://cdn.tailwindcss.com"', config + '<script src="https://cdn.tailwindcss.com"')
  }
  const safetyScript = `<script>\n(function(){\n  function rf(){document.querySelectorAll('.fade-in').forEach(function(e){e.classList.add('visible');})}\n  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',rf);}else{rf();}\n  setTimeout(rf,900);\n  window.addEventListener('load',rf);\n})();\n</script>`
  if (s.includes("</body>")) s = s.replace("</body>", safetyScript + "\n</body>")
  return s
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { siteId } = await request.json()
    if (!siteId) return NextResponse.json({ error: "Missing siteId" }, { status: 400 })

    const adminClient = createAdminClient()

    const { data: site, error: fetchError } = await adminClient
      .from("generated_sites")
      .select("id, name, description, style, preview_slug, user_id")
      .eq("id", siteId).eq("user_id", user.id).single()

    if (fetchError || !site) return NextResponse.json({ error: "Site not found" }, { status: 404 })

    const { name, description, style, preview_slug } = site
    const theme = styleThemes[style] || styleThemes.modern
    const slug = name.toLowerCase().replace(/\s+/g, "-")

    const systemPrompt = `You are a world-class UI/UX designer and senior frontend developer. Produce a stunning premium website that looks like it cost $50,000.

PROJECT: Name: ${name} | Description: ${description} | Style: ${style}

OUTPUT: Return ONLY complete HTML starting with <!DOCTYPE html>. No markdown, no code fences.

HEAD order: meta tags → Google Fonts (${theme.fonts}) → Tailwind config script → CDN script → Alpine.js → style block with CSS vars.
CSS vars: --primary:${theme.primary}; --primary-dark:${theme.primaryDark}; --accent:${theme.accent}; --bg:${theme.bg}; --surface:${theme.surface}; --text:${theme.text}; --text-muted:${theme.textMuted}; --heading-font:${theme.headingFont}; --body-font:${theme.bodyFont}; --gradient:${theme.gradient};

COLOR CLASSES: ONLY text-primary, text-accent, text-theme-muted, bg-primary, bg-surface, bg-theme-bg
NEVER: text-muted, text-text-muted, bg-bg, bg-muted

IMAGES: https://picsum.photos/seed/${slug}-{unique}/1200/800

SECTIONS (8 required): navbar, hero, stats, features(4 cards), gallery, testimonials(3), cta, footer

Return COMPLETE HTML. Make it stunning.`

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://pngwebsitebuilders.site",
        "X-Title": "PNG Website Builders",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Regenerate a fresh, stunning ${style} website for: ${name}. ${description}` },
        ],
        max_tokens: 14000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData: { error?: string } = {}
      try { errorData = JSON.parse(errorText) } catch { /* non-JSON */ }
      if (response.status === 429) return NextResponse.json({ error: "AI is rate limited. Please wait 30 seconds." }, { status: 429 })
      if (response.status === 503 || response.status === 502) return NextResponse.json({ error: "AI service temporarily unavailable." }, { status: 503 })
      console.error("OpenRouter error:", errorData)
      return NextResponse.json({ error: "Failed to regenerate website" }, { status: 500 })
    }

    const data = await response.json()
    const generatedHtml = data.choices?.[0]?.message?.content
    if (!generatedHtml) return NextResponse.json({ error: "No content generated" }, { status: 500 })

    let cleanHtml = generatedHtml.trim()
    if (cleanHtml.startsWith("```html")) cleanHtml = cleanHtml.slice(7)
    if (cleanHtml.startsWith("```")) cleanHtml = cleanHtml.slice(3)
    if (cleanHtml.endsWith("```")) cleanHtml = cleanHtml.slice(0, -3)
    cleanHtml = cleanHtml.trim()

    cleanHtml = sanitizeGeneratedHtml(cleanHtml, theme)
    cleanHtml = await fixBrokenImages(cleanHtml, slug)

    // Note: removed updated_at — column does not exist in schema
    const { error: updateError } = await adminClient
      .from("generated_sites")
      .update({ html_code: cleanHtml })
      .eq("id", siteId).eq("user_id", user.id)

    if (updateError) {
      console.error("Database update error:", updateError)
      return NextResponse.json({ error: "Failed to save regenerated website" }, { status: 500 })
    }

    return NextResponse.json({ success: true, previewSlug: preview_slug, message: "Website regenerated successfully" })
  } catch (error) {
    console.error("Regeneration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
